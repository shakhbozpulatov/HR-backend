import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AttendanceEvent, EventType } from './entities/attendance-event.entity';
import {
  AttendanceRecord,
  AttendanceStatus,
} from './entities/attendance-record.entity';
import { ScheduleAssignmentsService } from '../schedules/schedule-assignments.service';
import { HolidaysService } from '../holidays/holidays.service';
import * as moment from 'moment-timezone';

@Injectable()
export class AttendanceProcessorService {
  private readonly timezone: string;
  private readonly graceInMinutes: number;
  private readonly graceOutMinutes: number;
  private readonly roundingMinutes: number;
  private readonly overtimeThreshold: number;

  constructor(
    @InjectRepository(AttendanceEvent)
    private eventRepository: Repository<AttendanceEvent>,
    @InjectRepository(AttendanceRecord)
    private recordRepository: Repository<AttendanceRecord>,
    private scheduleService: ScheduleAssignmentsService,
    private holidaysService: HolidaysService,
    private configService: ConfigService,
  ) {
    this.timezone = this.configService.get('DEFAULT_TIMEZONE', 'Asia/Tashkent');
    this.graceInMinutes = this.configService.get('GRACE_IN_MINUTES', 5);
    this.graceOutMinutes = this.configService.get('GRACE_OUT_MINUTES', 0);
    this.roundingMinutes = this.configService.get('ROUNDING_MINUTES', 5);
    this.overtimeThreshold = this.configService.get(
      'OVERTIME_THRESHOLD_MINUTES',
      15,
    );
  }

  async processEmployeeDay(
    employeeId: string,
    date: Date,
  ): Promise<AttendanceRecord> {
    const dateStr = moment(date).format('YYYY-MM-DD');

    // Get effective schedule for the date
    const schedule = await this.scheduleService.getEffectiveSchedule(
      employeeId,
      date,
    );

    // Check if it's a holiday
    const isHoliday = await this.holidaysService.isHoliday(date, 'global'); // TODO: use employee location

    // Get events for the day
    const events = await this.getEventsForDay(employeeId, date);

    // Find or create attendance record
    let record = await this.recordRepository.findOne({
      where: { user_id: employeeId, date: dateStr as any },
    });

    if (!record) {
      record = this.recordRepository.create({
        user_id: employeeId,
        date: dateStr as any,
      });
    }

    // Process the day
    if (isHoliday) {
      record.status = AttendanceStatus.HOLIDAY;
      record.scheduled_start = null;
      record.scheduled_end = null;

      if (events.length > 0) {
        // Employee worked on holiday - calculate as regular work
        const sessions = this.pairEvents(events);
        const workResult = this.calculateWorkTime(sessions, null, null);
        record.worked_minutes = workResult.workedMinutes;
        record.holiday_minutes = workResult.workedMinutes;
      }
    } else if (!schedule) {
      record.status = AttendanceStatus.ABSENT;
      record.scheduled_start = null;
      record.scheduled_end = null;
    } else {
      record.scheduled_start = schedule.start_time;
      record.scheduled_end = schedule.end_time;

      if (events.length === 0) {
        record.status = AttendanceStatus.MISSING;
      } else {
        const sessions = this.pairEvents(events);
        const incompleteSession = sessions.find((s) => !s.clockOut);

        if (incompleteSession) {
          record.status = AttendanceStatus.INCOMPLETE;
        } else {
          record.status = AttendanceStatus.OK;
        }

        const workResult = this.calculateWorkTime(
          sessions,
          schedule.start_time,
          schedule.end_time,
        );
        record.worked_minutes = workResult.workedMinutes;
        record.late_minutes = workResult.lateMinutes;
        record.early_leave_minutes = workResult.earlyLeaveMinutes;
        record.overtime_minutes = workResult.overtimeMinutes;
      }
    }

    record.event_ids = events.map((e) => e.event_id);
    return await this.recordRepository.save(record);
  }

  private async getEventsForDay(
    employeeId: string,
    date: Date,
  ): Promise<AttendanceEvent[]> {
    const startOfDay = moment.tz(date, this.timezone).startOf('day').toDate();
    const endOfDay = moment.tz(date, this.timezone).endOf('day').toDate();

    return await this.eventRepository.find({
      where: {
        user_id: employeeId,
        ts_local: Between(startOfDay, endOfDay),
      },
      order: { ts_local: 'ASC' },
    });
  }

  private pairEvents(
    events: AttendanceEvent[],
  ): Array<{ clockIn: AttendanceEvent; clockOut?: AttendanceEvent }> {
    const sessions = [];
    let currentClockIn = null;

    for (const event of events) {
      if (event.event_type === EventType.CLOCK_IN) {
        if (currentClockIn) {
          // Previous session was incomplete
          sessions.push({ clockIn: currentClockIn });
        }
        currentClockIn = event;
      } else if (event.event_type === EventType.CLOCK_OUT && currentClockIn) {
        sessions.push({ clockIn: currentClockIn, clockOut: event });
        currentClockIn = null;
      }
    }

    // Handle final incomplete session
    if (currentClockIn) {
      sessions.push({ clockIn: currentClockIn });
    }

    return sessions;
  }

  private calculateWorkTime(
    sessions: Array<{ clockIn: AttendanceEvent; clockOut?: AttendanceEvent }>,
    scheduledStart?: string,
    scheduledEnd?: string,
  ): {
    workedMinutes: number;
    lateMinutes: number;
    earlyLeaveMinutes: number;
    overtimeMinutes: number;
  } {
    let totalWorkedMinutes = 0;
    let firstClockIn: Date | null = null;
    let lastClockOut: Date | null = null;

    // Calculate total worked time from complete sessions
    for (const session of sessions) {
      if (session.clockOut) {
        const sessionMinutes = moment(session.clockOut.ts_local).diff(
          moment(session.clockIn.ts_local),
          'minutes',
        );
        totalWorkedMinutes += sessionMinutes;
      }

      if (!firstClockIn || session.clockIn.ts_local < firstClockIn) {
        firstClockIn = session.clockIn.ts_local;
      }

      if (
        session.clockOut &&
        (!lastClockOut || session.clockOut.ts_local > lastClockOut)
      ) {
        lastClockOut = session.clockOut.ts_local;
      }
    }

    // Apply rounding
    totalWorkedMinutes = this.roundToNearest(
      totalWorkedMinutes,
      this.roundingMinutes,
    );

    let lateMinutes = 0;
    let earlyLeaveMinutes = 0;
    let overtimeMinutes = 0;

    if (scheduledStart && scheduledEnd && firstClockIn && lastClockOut) {
      const scheduledStartTime = this.parseTimeToMoment(
        scheduledStart,
        firstClockIn,
      );
      const scheduledEndTime = this.parseTimeToMoment(
        scheduledEnd,
        firstClockIn,
      );

      // Handle cross-midnight shifts
      if (scheduledEndTime.isBefore(scheduledStartTime)) {
        scheduledEndTime.add(1, 'day');
      }

      // Calculate late minutes
      const actualStartTime = moment(firstClockIn);
      if (
        actualStartTime.isAfter(
          scheduledStartTime.clone().add(this.graceInMinutes, 'minutes'),
        )
      ) {
        lateMinutes = actualStartTime.diff(scheduledStartTime, 'minutes');
      }

      // Calculate early leave minutes
      const actualEndTime = moment(lastClockOut);
      if (
        actualEndTime.isBefore(
          scheduledEndTime.clone().subtract(this.graceOutMinutes, 'minutes'),
        )
      ) {
        earlyLeaveMinutes = scheduledEndTime.diff(actualEndTime, 'minutes');
      }

      // Calculate overtime minutes
      if (
        actualEndTime.isAfter(
          scheduledEndTime.clone().add(this.overtimeThreshold, 'minutes'),
        )
      ) {
        overtimeMinutes =
          actualEndTime.diff(scheduledEndTime, 'minutes') -
          this.overtimeThreshold;
      }
    }

    return {
      workedMinutes: totalWorkedMinutes,
      lateMinutes: Math.max(0, lateMinutes),
      earlyLeaveMinutes: Math.max(0, earlyLeaveMinutes),
      overtimeMinutes: Math.max(0, overtimeMinutes),
    };
  }

  private parseTimeToMoment(
    timeStr: string,
    referenceDate: Date,
  ): moment.Moment {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return moment(referenceDate)
      .startOf('day')
      .add(hours, 'hours')
      .add(minutes, 'minutes');
  }

  private roundToNearest(value: number, nearest: number): number {
    return Math.round(value / nearest) * nearest;
  }

  async reprocessDateRange(
    employeeId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AttendanceRecord[]> {
    const records = [];
    const current = moment(startDate);
    const end = moment(endDate);

    while (current.isSameOrBefore(end)) {
      const record = await this.processEmployeeDay(
        employeeId,
        current.toDate(),
      );
      records.push(record);
      current.add(1, 'day');
    }

    return records;
  }
}
