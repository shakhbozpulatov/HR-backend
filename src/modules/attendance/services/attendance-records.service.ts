import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as moment from 'moment-timezone';
import { v4 as uuidv4 } from 'uuid';
import {
  Approval,
  ApprovalDto,
  AttendanceFilterDto,
  AttendanceRecord,
  AttendanceStatus,
  AttendanceSummaryDto,
  ManualAdjustment,
  ManualAdjustmentDto,
  PaginatedResponseDto,
} from '@/modules/attendance';

@Injectable()
export class AttendanceRecordsService {
  private readonly logger = new Logger(AttendanceRecordsService.name);

  constructor(
    @InjectRepository(AttendanceRecord)
    private recordRepository: Repository<AttendanceRecord>,
    @InjectQueue('attendance')
    private attendanceQueue: Queue,
  ) {}

  /**
   * Find all records with advanced filtering
   */
  async findAll(
    filterDto: AttendanceFilterDto,
  ): Promise<PaginatedResponseDto<AttendanceRecord>> {
    const {
      page = 1,
      limit = 10,
      user_id,
      user_ids,
      device_id,
      from,
      to,
      status,
      statuses,
      is_locked,
      requires_approval,
      department,
      sort_by = 'date',
      sort_order = 'DESC',
    } = filterDto;

    const queryBuilder = this.recordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.user', 'user');

    // User filters
    if (user_id) {
      queryBuilder.andWhere('record.user_id = :user_id', { user_id });
    }

    if (user_ids && user_ids.length > 0) {
      queryBuilder.andWhere('record.user_id IN (:...user_ids)', { user_ids });
    }

    // Date filters
    if (from) {
      queryBuilder.andWhere('record.date >= :from', { from: new Date(from) });
    }

    if (to) {
      queryBuilder.andWhere('record.date <= :to', { to: new Date(to) });
    }

    // Status filters
    if (status) {
      queryBuilder.andWhere('record.status = :status', { status });
    }

    if (statuses && statuses.length > 0) {
      queryBuilder.andWhere('record.status IN (:...statuses)', { statuses });
    }

    // Lock and approval filters
    if (is_locked !== undefined) {
      queryBuilder.andWhere('record.is_locked = :is_locked', { is_locked });
    }

    if (requires_approval !== undefined) {
      queryBuilder.andWhere('record.requires_approval = :requires_approval', {
        requires_approval,
      });
    }

    // Department filter
    if (department) {
      queryBuilder.andWhere('user.department = :department', { department });
    }

    // Sorting
    const sortColumn = sort_by === 'date' ? 'record.date' : `record.${sort_by}`;
    queryBuilder.orderBy(sortColumn, sort_order);

    // Pagination
    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find single record
   */
  async findOne(userId: string, date: Date): Promise<AttendanceRecord> {
    const dateStr = moment(date).format('YYYY-MM-DD');

    const record = await this.recordRepository.findOne({
      where: { user_id: userId, date: dateStr as any },
      relations: ['user'],
    });

    if (!record) {
      throw new NotFoundException(
        `Attendance record not found for user ${userId} on ${dateStr}`,
      );
    }

    return record;
  }

  /**
   * Create manual adjustment
   */
  async createManualAdjustment(
    userId: string,
    date: Date,
    adjustmentDto: ManualAdjustmentDto,
    actorId: string,
  ): Promise<AttendanceRecord> {
    const record = await this.findOne(userId, date);

    if (record.is_locked) {
      throw new BadRequestException('Cannot adjust locked record');
    }

    // Create adjustment object
    const adjustment: ManualAdjustment = {
      id: uuidv4(),
      type: adjustmentDto.type,
      reason: adjustmentDto.reason,
      before_value: this.captureBeforeValue(record, adjustmentDto),
      after_value: this.captureAfterValue(adjustmentDto),
      created_by: actorId,
      created_at: new Date(),
    };

    // Apply adjustment
    this.applyAdjustment(record, adjustmentDto);

    // Add to adjustments array
    if (!record.manual_adjustments) {
      record.manual_adjustments = [];
    }
    record.manual_adjustments.push(adjustment);

    // Mark as requiring approval
    record.requires_approval = true;

    const saved = await this.recordRepository.save(record);

    this.logger.log(
      `Manual adjustment created for user ${userId} on ${moment(date).format('YYYY-MM-DD')} by ${actorId}`,
    );

    return saved;
  }

  /**
   * Capture before value for adjustment
   */
  private captureBeforeValue(
    record: AttendanceRecord,
    adjustmentDto: ManualAdjustmentDto,
  ): any {
    switch (adjustmentDto.type) {
      case 'CLOCK_TIME_EDIT':
        return {
          first_clock_in: record.first_clock_in,
          last_clock_out: record.last_clock_out,
          worked_minutes: record.worked_minutes,
        };
      case 'OVERRIDE_STATUS':
        return { status: record.status };
      case 'ADD_MINUTES':
      case 'REMOVE_MINUTES':
        return { worked_minutes: record.worked_minutes };
      default:
        return null;
    }
  }

  /**
   * Capture after value for adjustment
   */
  private captureAfterValue(adjustmentDto: ManualAdjustmentDto): any {
    switch (adjustmentDto.type) {
      case 'CLOCK_TIME_EDIT':
        return {
          clock_in_time: adjustmentDto.clock_in_time,
          clock_out_time: adjustmentDto.clock_out_time,
        };
      case 'OVERRIDE_STATUS':
        return { status: adjustmentDto.new_status };
      case 'ADD_MINUTES':
      case 'REMOVE_MINUTES':
        return { minutes: adjustmentDto.minutes };
      default:
        return null;
    }
  }

  /**
   * Apply adjustment to record
   */
  private applyAdjustment(
    record: AttendanceRecord,
    adjustmentDto: ManualAdjustmentDto,
  ): void {
    switch (adjustmentDto.type) {
      case 'CLOCK_TIME_EDIT':
        if (adjustmentDto.clock_in_time) {
          record.first_clock_in = moment(adjustmentDto.clock_in_time).format(
            'HH:mm:ss',
          );
        }
        if (adjustmentDto.clock_out_time) {
          record.last_clock_out = moment(adjustmentDto.clock_out_time).format(
            'HH:mm:ss',
          );
        }
        // Recalculate worked minutes
        if (adjustmentDto.clock_in_time && adjustmentDto.clock_out_time) {
          const minutes = moment(adjustmentDto.clock_out_time).diff(
            moment(adjustmentDto.clock_in_time),
            'minutes',
          );
          record.worked_minutes = Math.max(0, minutes);
        }
        break;

      case 'MARK_ABSENT_PAID':
        record.status = AttendanceStatus.ABSENT;
        record.worked_minutes = record.scheduled_minutes || 0;
        break;

      case 'MARK_ABSENT_UNPAID':
        record.status = AttendanceStatus.ABSENT;
        record.worked_minutes = 0;
        break;

      case 'OVERRIDE_STATUS':
        if (adjustmentDto.new_status) {
          record.status = adjustmentDto.new_status;
        }
        break;

      case 'ADD_MINUTES':
        if (adjustmentDto.minutes) {
          record.worked_minutes += adjustmentDto.minutes;
        }
        break;

      case 'REMOVE_MINUTES':
        if (adjustmentDto.minutes) {
          record.worked_minutes = Math.max(
            0,
            record.worked_minutes - adjustmentDto.minutes,
          );
        }
        break;
    }
  }

  /**
   * Approve record
   */
  async approveRecord(
    userId: string,
    date: Date,
    approvalDto: ApprovalDto,
    actorId: string,
  ): Promise<AttendanceRecord> {
    const record = await this.findOne(userId, date);

    const approval: Approval = {
      level: approvalDto.level || 1,
      approved_by: actorId,
      approved_at: new Date(),
      locked: approvalDto.lock_record || false,
      comments: approvalDto.comments,
    };

    if (!record.approvals) {
      record.approvals = [];
    }
    record.approvals.push(approval);

    // Lock record if requested
    if (approvalDto.lock_record) {
      record.is_locked = true;
    }

    // Clear requires_approval flag
    record.requires_approval = false;

    const saved = await this.recordRepository.save(record);

    this.logger.log(
      `Record approved for user ${userId} on ${moment(date).format('YYYY-MM-DD')} by ${actorId}`,
    );

    return saved;
  }

  /**
   * Unlock record
   */
  async unlockRecord(
    userId: string,
    date: Date,
    actorId: string,
  ): Promise<AttendanceRecord> {
    const record = await this.findOne(userId, date);

    if (!record.is_locked) {
      throw new BadRequestException('Record is not locked');
    }

    record.is_locked = false;

    const saved = await this.recordRepository.save(record);

    this.logger.log(
      `Record unlocked for user ${userId} on ${moment(date).format('YYYY-MM-DD')} by ${actorId}`,
    );

    return saved;
  }

  /**
   * Reprocess record
   */
  async reprocessRecord(userId: string, date: Date): Promise<AttendanceRecord> {
    const record = await this.findOne(userId, date);

    if (record.is_locked) {
      throw new BadRequestException('Cannot reprocess locked record');
    }

    // Queue for reprocessing
    const dateStr = moment(date).format('YYYY-MM-DD');
    await this.attendanceQueue.add(
      'process-employee-day',
      {
        employeeId: userId,
        date: dateStr,
      },
      {
        priority: 1,
        removeOnComplete: true,
      },
    );

    this.logger.log(`Queued reprocessing for user ${userId} on ${dateStr}`);

    return record;
  }

  /**
   * Get timesheet grid (calendar view)
   */
  async getTimesheetGrid(filterDto: AttendanceFilterDto): Promise<{
    users: any[];
    dates: string[];
    records: Map<string, Map<string, AttendanceRecord>>;
  }> {
    const { from, to, user_ids } = filterDto;

    if (!from || !to) {
      throw new BadRequestException('Date range is required for timesheet');
    }

    const startDate = moment(from);
    const endDate = moment(to);

    // Generate date range
    const dates: string[] = [];
    const current = startDate.clone();
    while (current.isSameOrBefore(endDate)) {
      dates.push(current.format('YYYY-MM-DD'));
      current.add(1, 'day');
    }

    // Fetch records
    const records = await this.recordRepository.find({
      where: {
        user_id: user_ids ? In(user_ids) : undefined,
        date: Between(startDate.toDate(), endDate.toDate()) as any,
      },
      relations: ['user'],
      order: { date: 'ASC' },
    });

    // Group records by user and date
    const recordsMap = new Map<string, Map<string, AttendanceRecord>>();
    const usersSet = new Set<string>();

    for (const record of records) {
      usersSet.add(record.user_id);

      if (!recordsMap.has(record.user_id)) {
        recordsMap.set(record.user_id, new Map());
      }

      const dateStr = moment(record.date).format('YYYY-MM-DD');
      recordsMap.get(record.user_id)!.set(dateStr, record);
    }

    // Get unique users
    const users = Array.from(usersSet).map((userId) => {
      const firstRecord = records.find((r) => r.user_id === userId);
      return firstRecord?.user;
    });

    return {
      users,
      dates,
      records: recordsMap,
    };
  }

  /**
   * Get attendance summary
   */
  async getAttendanceSummary(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AttendanceSummaryDto> {
    const records = await this.recordRepository.find({
      where: {
        user_id: userId,
        date: Between(startDate, endDate) as any,
      },
    });

    const totalDays = records.length;
    const presentDays = records.filter(
      (r) =>
        r.status === AttendanceStatus.OK ||
        r.status === AttendanceStatus.INCOMPLETE,
    ).length;
    const absentDays = records.filter(
      (r) => r.status === AttendanceStatus.ABSENT,
    ).length;
    const lateDays = records.filter((r) => r.late_minutes > 0).length;

    const totalWorkedMinutes = records.reduce(
      (sum, r) => sum + (r.worked_minutes || 0),
      0,
    );
    const totalLateMinutes = records.reduce(
      (sum, r) => sum + (r.late_minutes || 0),
      0,
    );
    const totalOvertimeMinutes = records.reduce(
      (sum, r) => sum + (r.overtime_minutes || 0),
      0,
    );

    return {
      total_days: totalDays,
      present_days: presentDays,
      absent_days: absentDays,
      late_days: lateDays,
      total_worked_minutes: totalWorkedMinutes,
      total_late_minutes: totalLateMinutes,
      total_overtime_minutes: totalOvertimeMinutes,
      average_daily_minutes:
        totalDays > 0 ? Math.round(totalWorkedMinutes / totalDays) : 0,
    };
  }

  /**
   * Export to Excel (placeholder)
   */
  async exportToExcel(filterDto: AttendanceFilterDto): Promise<Buffer> {
    // Implementation would use a library like exceljs
    const { data } = await this.findAll(filterDto);

    this.logger.log(`Exporting ${data.length} records to Excel`);

    // Placeholder implementation
    return Buffer.from('Excel export not implemented yet');
  }
}
