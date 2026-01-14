import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual } from 'typeorm';
import * as moment from 'moment-timezone';

import { User } from '@/modules/users/entities/user.entity';
import { AttendanceRecord } from '@/modules/attendance/entities/attendance-record.entity';
import { AttendanceEvent } from '@/modules/attendance/entities/attendance-event.entity';
import { UserScheduleAssignment } from '@/modules/schedules/entities/employee-schedule-assignment.entity';
import { ScheduleTemplate } from '@/modules/schedules/entities/schedule-template.entity';
import { Holiday } from '@/modules/holidays/entities/holiday.entity';

import {
  DashboardStatisticsDto,
  AttendanceStatsDto,
  ExceptionsDto,
  StatsPeriod,
} from '../dto/dashboard.dto';

interface ScheduleException {
  date?: string;
  start_date?: string;
  end_date?: string;
  template_id?: string;
  type: 'OFF' | 'ALTERNATE_TEMPLATE';
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private readonly timezone = 'Asia/Tashkent';

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AttendanceRecord)
    private recordRepository: Repository<AttendanceRecord>,
    @InjectRepository(AttendanceEvent)
    private eventRepository: Repository<AttendanceEvent>,
    @InjectRepository(UserScheduleAssignment)
    private assignmentRepository: Repository<UserScheduleAssignment>,
    @InjectRepository(ScheduleTemplate)
    private templateRepository: Repository<ScheduleTemplate>,
    @InjectRepository(Holiday)
    private holidayRepository: Repository<Holiday>,
  ) {}

  /**
   * Get dashboard statistics for a specific date
   */
  async getDashboardStatistics(dto: DashboardStatisticsDto) {
    const date = dto.date
      ? moment(dto.date).format('YYYY-MM-DD')
      : moment().tz(this.timezone).format('YYYY-MM-DD');
    const dayOfWeek = moment(date).format('dddd'); // e.g., 'Monday'

    this.logger.log(
      `Getting dashboard statistics for date: ${date}, day: ${dayOfWeek}`,
    );

    // Get all active employees
    const activeUsersQuery = this.userRepository
      .createQueryBuilder('user')
      .where('user.end_date IS NULL OR user.end_date >= :date', { date });

    if (dto.company_id) {
      activeUsersQuery.andWhere('user.company_id = :company_id', {
        company_id: dto.company_id,
      });
    }

    const activeUsers = await activeUsersQuery.getMany();
    const totalEmployees = activeUsers.length;

    this.logger.log(`Total active employees: ${totalEmployees}`);

    // Check if today is a holiday
    const holiday = await this.holidayRepository.findOne({
      where: [
        { date: new Date(date), company_id: dto.company_id || null },
        { date: new Date(date), company_id: null }, // global holidays
      ],
    });

    if (holiday) {
      this.logger.log(`${date} is a holiday: ${holiday.name}`);
      return {
        date,
        is_holiday: true,
        holiday_name: holiday.name,
        total_employees: totalEmployees,
        expected_today: 0,
        checked_in: 0,
        on_time_arrivals: 0,
      };
    }

    // Get employees expected to work today
    const expectedUserIds: string[] = [];
    const userAssignments = await this.assignmentRepository.find({
      where: {
        user_id: In(activeUsers.map((u) => u.id)),
        effective_from: LessThanOrEqual(new Date(date)),
      },
      relations: ['default_template'],
    });

    for (const assignment of userAssignments) {
      // Check if assignment is still active
      if (
        assignment.effective_to &&
        moment(assignment.effective_to).format('YYYY-MM-DD') < date
      ) {
        continue;
      }

      // Check for exceptions on this date
      const exceptions = (assignment.exceptions as ScheduleException[]) || [];
      const hasException = exceptions.some((exc) => {
        if (exc.date && exc.date === date && exc.type === 'OFF') {
          return true;
        }
        if (exc.start_date && exc.end_date) {
          return (
            date >= exc.start_date && date <= exc.end_date && exc.type === 'OFF'
          );
        }
        return false;
      });

      if (hasException) {
        continue; // Employee is off today
      }

      // Check if this day is in the workdays
      const template = assignment.default_template;
      if (template && template.workdays) {
        const workdays = Array.isArray(template.workdays)
          ? template.workdays
          : [];
        if (workdays.includes(dayOfWeek)) {
          expectedUserIds.push(assignment.user_id);
        }
      }
    }

    const expectedToday = expectedUserIds.length;
    this.logger.log(`Employees expected to work today: ${expectedToday}`);

    // Get attendance records for today
    const attendanceRecords = await this.recordRepository.find({
      where: {
        user_id: In(expectedUserIds),
        date: new Date(date),
      },
    });

    // Count checked in employees (those who have first_clock_in)
    const checkedIn = attendanceRecords.filter(
      (r) => r.first_clock_in !== null,
    ).length;

    // Count on-time arrivals (late_minutes is 0 or negative)
    const onTimeArrivals = attendanceRecords.filter(
      (r) =>
        r.first_clock_in !== null &&
        (r.late_minutes === null || r.late_minutes <= 0),
    ).length;

    this.logger.log(`Checked in: ${checkedIn}, On-time: ${onTimeArrivals}`);

    return {
      date,
      is_holiday: false,
      total_employees: totalEmployees,
      expected_today: expectedToday,
      checked_in: checkedIn,
      on_time_arrivals: onTimeArrivals,
    };
  }

  /**
   * Get check-in and check-out statistics for a period
   */
  async getAttendanceStats(dto: AttendanceStatsDto) {
    const endDate = moment().tz(this.timezone).format('YYYY-MM-DD');
    let startDate: string;

    switch (dto.period) {
      case StatsPeriod.ONE_MONTH:
        startDate = moment().subtract(1, 'month').format('YYYY-MM-DD');
        break;
      case StatsPeriod.THREE_MONTHS:
        startDate = moment().subtract(3, 'months').format('YYYY-MM-DD');
        break;
      case StatsPeriod.SIX_MONTHS:
        startDate = moment().subtract(6, 'months').format('YYYY-MM-DD');
        break;
      default:
        startDate = moment().subtract(1, 'month').format('YYYY-MM-DD');
    }

    this.logger.log(`Getting attendance stats from ${startDate} to ${endDate}`);

    // Get all attendance records in the period
    const recordsQuery = this.recordRepository
      .createQueryBuilder('record')
      .where('record.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (dto.company_id) {
      recordsQuery
        .leftJoin('record.user', 'user')
        .andWhere('user.company_id = :company_id', {
          company_id: dto.company_id,
        });
    }

    const records = await recordsQuery.getMany();

    // Group records by date
    const recordsByDate = new Map<string, typeof records>();
    records.forEach((record) => {
      const dateKey = moment(record.date).format('YYYY-MM-DD');
      if (!recordsByDate.has(dateKey)) {
        recordsByDate.set(dateKey, []);
      }
      recordsByDate.get(dateKey)!.push(record);
    });

    // Build statistics for each day
    const checkInStats: any[] = [];
    const checkOutStats: any[] = [];

    const currentDate = moment(startDate);
    while (currentDate.isSameOrBefore(endDate)) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      const dayRecords = recordsByDate.get(dateStr) || [];

      // Check-in statistics
      const totalExpected = dayRecords.length; // All records represent expected employees
      const checkedIn = dayRecords.filter(
        (r) => r.first_clock_in !== null,
      ).length;
      const onTimeCheckIn = dayRecords.filter(
        (r) =>
          r.first_clock_in !== null &&
          (r.late_minutes === null || r.late_minutes <= 0),
      ).length;
      const lateCheckIn = dayRecords.filter(
        (r) => r.late_minutes && r.late_minutes > 0,
      ).length;
      const noCheckIn = totalExpected - checkedIn;

      checkInStats.push({
        date: dateStr,
        total_expected: totalExpected,
        on_time: onTimeCheckIn,
        late: lateCheckIn,
        absent: noCheckIn,
      });

      // Check-out statistics
      const checkedOut = dayRecords.filter(
        (r) => r.last_clock_out !== null,
      ).length;
      const onTimeCheckOut = dayRecords.filter(
        (r) =>
          r.last_clock_out !== null &&
          (r.early_leave_minutes === null || r.early_leave_minutes <= 0),
      ).length;
      const earlyCheckOut = dayRecords.filter(
        (r) => r.early_leave_minutes && r.early_leave_minutes > 0,
      ).length;
      const noCheckOut = checkedIn - checkedOut; // Only those who checked in but didn't check out

      checkOutStats.push({
        date: dateStr,
        total_expected: checkedIn, // Expected checkout = those who checked in
        on_time: onTimeCheckOut,
        early: earlyCheckOut,
        no_checkout: noCheckOut,
      });

      currentDate.add(1, 'day');
    }

    return {
      period: dto.period,
      start_date: startDate,
      end_date: endDate,
      check_in_stats: checkInStats,
      check_out_stats: checkOutStats,
    };
  }

  /**
   * Get employees who are not coming today or tomorrow (exceptions)
   */
  async getExceptions(dto: ExceptionsDto) {
    let targetDate: string;

    if (dto.date === 'tomorrow') {
      targetDate = moment()
        .tz(this.timezone)
        .add(1, 'day')
        .format('YYYY-MM-DD');
    } else if (dto.date) {
      targetDate = moment(dto.date).format('YYYY-MM-DD');
    } else {
      targetDate = moment().tz(this.timezone).format('YYYY-MM-DD');
    }

    this.logger.log(`Getting exceptions for date: ${targetDate}`);

    // Get all active assignments
    const assignmentsQuery = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.user', 'user')
      .leftJoinAndSelect('user.department', 'department')
      .where('assignment.effective_from <= :targetDate', { targetDate })
      .andWhere(
        '(assignment.effective_to IS NULL OR assignment.effective_to >= :targetDate)',
        { targetDate },
      );

    if (dto.company_id) {
      assignmentsQuery.andWhere('user.company_id = :company_id', {
        company_id: dto.company_id,
      });
    }

    if (dto.department_id) {
      assignmentsQuery.andWhere('user.department_id = :department_id', {
        department_id: dto.department_id,
      });
    }

    const assignments = await assignmentsQuery.getMany();

    // Filter employees with exceptions on target date
    const employeesWithExceptions: any[] = [];

    for (const assignment of assignments) {
      const exceptions = (assignment.exceptions as ScheduleException[]) || [];

      for (const exc of exceptions) {
        let isApplicable = false;
        let exceptionStartDate = '';
        let exceptionEndDate = '';

        if (exc.type === 'OFF') {
          if (exc.date && exc.date === targetDate) {
            isApplicable = true;
            exceptionStartDate = exc.date;
            exceptionEndDate = exc.date;
          } else if (exc.start_date && exc.end_date) {
            if (targetDate >= exc.start_date && targetDate <= exc.end_date) {
              isApplicable = true;
              exceptionStartDate = exc.start_date;
              exceptionEndDate = exc.end_date;
            }
          }
        }

        if (isApplicable) {
          employeesWithExceptions.push({
            user_id: assignment.user.id,
            employee_id: assignment.user.employee_id,
            full_name: `${assignment.user.first_name} ${assignment.user.last_name}`,
            department: assignment.user.department?.name || 'N/A',
            exception_type: exc.type,
            start_date: exceptionStartDate,
            end_date: exceptionEndDate,
          });
          break; // One exception per employee is enough
        }
      }
    }

    this.logger.log(
      `Found ${employeesWithExceptions.length} employees with exceptions`,
    );

    return {
      date: targetDate,
      total_exceptions: employeesWithExceptions.length,
      employees: employeesWithExceptions,
    };
  }
}
