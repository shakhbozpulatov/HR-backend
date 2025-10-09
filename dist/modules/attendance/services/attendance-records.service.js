"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AttendanceRecordsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceRecordsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bull_1 = require("@nestjs/bull");
const moment_timezone_1 = require("moment-timezone");
const uuid_1 = require("uuid");
const attendance_1 = require("..");
let AttendanceRecordsService = AttendanceRecordsService_1 = class AttendanceRecordsService {
    constructor(recordRepository, attendanceQueue) {
        this.recordRepository = recordRepository;
        this.attendanceQueue = attendanceQueue;
        this.logger = new common_1.Logger(AttendanceRecordsService_1.name);
    }
    async findAll(filterDto) {
        const { page = 1, limit = 10, user_id, user_ids, device_id, from, to, status, statuses, is_locked, requires_approval, department, sort_by = 'date', sort_order = 'DESC', } = filterDto;
        const queryBuilder = this.recordRepository
            .createQueryBuilder('record')
            .leftJoinAndSelect('record.user', 'user');
        if (user_id) {
            queryBuilder.andWhere('record.user_id = :user_id', { user_id });
        }
        if (user_ids && user_ids.length > 0) {
            queryBuilder.andWhere('record.user_id IN (:...user_ids)', { user_ids });
        }
        if (from) {
            queryBuilder.andWhere('record.date >= :from', { from: new Date(from) });
        }
        if (to) {
            queryBuilder.andWhere('record.date <= :to', { to: new Date(to) });
        }
        if (status) {
            queryBuilder.andWhere('record.status = :status', { status });
        }
        if (statuses && statuses.length > 0) {
            queryBuilder.andWhere('record.status IN (:...statuses)', { statuses });
        }
        if (is_locked !== undefined) {
            queryBuilder.andWhere('record.is_locked = :is_locked', { is_locked });
        }
        if (requires_approval !== undefined) {
            queryBuilder.andWhere('record.requires_approval = :requires_approval', {
                requires_approval,
            });
        }
        if (department) {
            queryBuilder.andWhere('user.department = :department', { department });
        }
        const sortColumn = sort_by === 'date' ? 'record.date' : `record.${sort_by}`;
        queryBuilder.orderBy(sortColumn, sort_order);
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
    async findOne(userId, date) {
        const dateStr = (0, moment_timezone_1.default)(date).format('YYYY-MM-DD');
        const record = await this.recordRepository.findOne({
            where: { user_id: userId, date: dateStr },
            relations: ['user'],
        });
        if (!record) {
            throw new common_1.NotFoundException(`Attendance record not found for user ${userId} on ${dateStr}`);
        }
        return record;
    }
    async createManualAdjustment(userId, date, adjustmentDto, actorId) {
        const record = await this.findOne(userId, date);
        if (record.is_locked) {
            throw new common_1.BadRequestException('Cannot adjust locked record');
        }
        const adjustment = {
            id: (0, uuid_1.v4)(),
            type: adjustmentDto.type,
            reason: adjustmentDto.reason,
            before_value: this.captureBeforeValue(record, adjustmentDto),
            after_value: this.captureAfterValue(adjustmentDto),
            created_by: actorId,
            created_at: new Date(),
        };
        this.applyAdjustment(record, adjustmentDto);
        if (!record.manual_adjustments) {
            record.manual_adjustments = [];
        }
        record.manual_adjustments.push(adjustment);
        record.requires_approval = true;
        const saved = await this.recordRepository.save(record);
        this.logger.log(`Manual adjustment created for user ${userId} on ${(0, moment_timezone_1.default)(date).format('YYYY-MM-DD')} by ${actorId}`);
        return saved;
    }
    captureBeforeValue(record, adjustmentDto) {
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
    captureAfterValue(adjustmentDto) {
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
    applyAdjustment(record, adjustmentDto) {
        switch (adjustmentDto.type) {
            case 'CLOCK_TIME_EDIT':
                if (adjustmentDto.clock_in_time) {
                    record.first_clock_in = (0, moment_timezone_1.default)(adjustmentDto.clock_in_time).format('HH:mm:ss');
                }
                if (adjustmentDto.clock_out_time) {
                    record.last_clock_out = (0, moment_timezone_1.default)(adjustmentDto.clock_out_time).format('HH:mm:ss');
                }
                if (adjustmentDto.clock_in_time && adjustmentDto.clock_out_time) {
                    const minutes = (0, moment_timezone_1.default)(adjustmentDto.clock_out_time).diff((0, moment_timezone_1.default)(adjustmentDto.clock_in_time), 'minutes');
                    record.worked_minutes = Math.max(0, minutes);
                }
                break;
            case 'MARK_ABSENT_PAID':
                record.status = attendance_1.AttendanceStatus.ABSENT;
                record.worked_minutes = record.scheduled_minutes || 0;
                break;
            case 'MARK_ABSENT_UNPAID':
                record.status = attendance_1.AttendanceStatus.ABSENT;
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
                    record.worked_minutes = Math.max(0, record.worked_minutes - adjustmentDto.minutes);
                }
                break;
        }
    }
    async approveRecord(userId, date, approvalDto, actorId) {
        const record = await this.findOne(userId, date);
        const approval = {
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
        if (approvalDto.lock_record) {
            record.is_locked = true;
        }
        record.requires_approval = false;
        const saved = await this.recordRepository.save(record);
        this.logger.log(`Record approved for user ${userId} on ${(0, moment_timezone_1.default)(date).format('YYYY-MM-DD')} by ${actorId}`);
        return saved;
    }
    async unlockRecord(userId, date, actorId) {
        const record = await this.findOne(userId, date);
        if (!record.is_locked) {
            throw new common_1.BadRequestException('Record is not locked');
        }
        record.is_locked = false;
        const saved = await this.recordRepository.save(record);
        this.logger.log(`Record unlocked for user ${userId} on ${(0, moment_timezone_1.default)(date).format('YYYY-MM-DD')} by ${actorId}`);
        return saved;
    }
    async reprocessRecord(userId, date) {
        const record = await this.findOne(userId, date);
        if (record.is_locked) {
            throw new common_1.BadRequestException('Cannot reprocess locked record');
        }
        const dateStr = (0, moment_timezone_1.default)(date).format('YYYY-MM-DD');
        await this.attendanceQueue.add('process-employee-day', {
            employeeId: userId,
            date: dateStr,
        }, {
            priority: 1,
            removeOnComplete: true,
        });
        this.logger.log(`Queued reprocessing for user ${userId} on ${dateStr}`);
        return record;
    }
    async getTimesheetGrid(filterDto) {
        const { from, to, user_ids } = filterDto;
        if (!from || !to) {
            throw new common_1.BadRequestException('Date range is required for timesheet');
        }
        const startDate = (0, moment_timezone_1.default)(from);
        const endDate = (0, moment_timezone_1.default)(to);
        const dates = [];
        const current = startDate.clone();
        while (current.isSameOrBefore(endDate)) {
            dates.push(current.format('YYYY-MM-DD'));
            current.add(1, 'day');
        }
        const records = await this.recordRepository.find({
            where: {
                user_id: user_ids ? (0, typeorm_2.In)(user_ids) : undefined,
                date: (0, typeorm_2.Between)(startDate.toDate(), endDate.toDate()),
            },
            relations: ['user'],
            order: { date: 'ASC' },
        });
        const recordsMap = new Map();
        const usersSet = new Set();
        for (const record of records) {
            usersSet.add(record.user_id);
            if (!recordsMap.has(record.user_id)) {
                recordsMap.set(record.user_id, new Map());
            }
            const dateStr = (0, moment_timezone_1.default)(record.date).format('YYYY-MM-DD');
            recordsMap.get(record.user_id).set(dateStr, record);
        }
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
    async getAttendanceSummary(userId, startDate, endDate) {
        const records = await this.recordRepository.find({
            where: {
                user_id: userId,
                date: (0, typeorm_2.Between)(startDate, endDate),
            },
        });
        const totalDays = records.length;
        const presentDays = records.filter((r) => r.status === attendance_1.AttendanceStatus.OK ||
            r.status === attendance_1.AttendanceStatus.INCOMPLETE).length;
        const absentDays = records.filter((r) => r.status === attendance_1.AttendanceStatus.ABSENT).length;
        const lateDays = records.filter((r) => r.late_minutes > 0).length;
        const totalWorkedMinutes = records.reduce((sum, r) => sum + (r.worked_minutes || 0), 0);
        const totalLateMinutes = records.reduce((sum, r) => sum + (r.late_minutes || 0), 0);
        const totalOvertimeMinutes = records.reduce((sum, r) => sum + (r.overtime_minutes || 0), 0);
        return {
            total_days: totalDays,
            present_days: presentDays,
            absent_days: absentDays,
            late_days: lateDays,
            total_worked_minutes: totalWorkedMinutes,
            total_late_minutes: totalLateMinutes,
            total_overtime_minutes: totalOvertimeMinutes,
            average_daily_minutes: totalDays > 0 ? Math.round(totalWorkedMinutes / totalDays) : 0,
        };
    }
    async exportToExcel(filterDto) {
        const { data } = await this.findAll(filterDto);
        this.logger.log(`Exporting ${data.length} records to Excel`);
        return Buffer.from('Excel export not implemented yet');
    }
};
exports.AttendanceRecordsService = AttendanceRecordsService;
exports.AttendanceRecordsService = AttendanceRecordsService = AttendanceRecordsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attendance_1.AttendanceRecord)),
    __param(1, (0, bull_1.InjectQueue)('attendance')),
    __metadata("design:paramtypes", [typeorm_2.Repository, Object])
], AttendanceRecordsService);
//# sourceMappingURL=attendance-records.service.js.map