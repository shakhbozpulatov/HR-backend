import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment-timezone';
import {
  AttendanceEvent,
  AttendanceProcessingLog,
  AttendanceRecord,
  AttendanceStatus,
  EventType,
  ProcessingStatus,
  ProcessingType,
  WorkSession,
} from '@/modules/attendance';
import { ScheduleAssignmentsService } from '@/modules/schedules/schedule-assignments.service';
import { HolidaysService } from '@/modules/holidays/holidays.service';

@Injectable()
export class AttendanceProcessorService {
  private readonly logger = new Logger(AttendanceProcessorService.name);
  private readonly timezone: string;
  private readonly graceInMinutes: number;
  private readonly graceOutMinutes: number;
  private readonly roundingMinutes: number;
  private readonly overtimeThreshold: number;
  private readonly nightShiftStart: number;
  private readonly nightShiftEnd: number;

  constructor(
    @InjectRepository(AttendanceEvent)
    private eventRepository: Repository<AttendanceEvent>,
    @InjectRepository(AttendanceRecord)
    private recordRepository: Repository<AttendanceRecord>,
    @InjectRepository(AttendanceProcessingLog)
    private logRepository: Repository<AttendanceProcessingLog>,
    private scheduleService: ScheduleAssignmentsService,
    private holidaysService: HolidaysService,
    private configService: ConfigService,
    private dataSource: DataSource,
  ) {
    this.timezone = this.configService.get('DEFAULT_TIMEZONE', 'Asia/Tashkent');
    this.graceInMinutes = this.configService.get('GRACE_IN_MINUTES', 15);
    this.graceOutMinutes = this.configService.get('GRACE_OUT_MINUTES', 15);
    this.roundingMinutes = this.configService.get('ROUNDING_MINUTES', 5);
    this.overtimeThreshold = this.configService.get(
      'OVERTIME_THRESHOLD_MINUTES',
      30,
    );
    this.nightShiftStart = this.configService.get('NIGHT_SHIFT_START_HOUR', 22); // 10 PM
    this.nightShiftEnd = this.configService.get('NIGHT_SHIFT_END_HOUR', 6); // 6 AM
  }

  /**
   * Process single employee day with comprehensive logic
   */
  async processEmployeeDay(
    userId: string,
    date: Date,
    triggeredBy?: string,
  ): Promise<AttendanceRecord> {
    const startTime = Date.now();
    const dateStr = moment(date).format('YYYY-MM-DD');

    this.logger.log(`Processing attendance for user ${userId} on ${dateStr}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Get effective schedule
      const schedule = await this.scheduleService.getEffectiveSchedule(
        userId,
        date,
      );

      // 2. Check if it's a holiday
      const isHoliday = await this.holidaysService.isHoliday(date, 'global');

      // 3. Check if it's weekend
      const dayOfWeek = moment(date).day();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // 4. Get events for the day
      const events = await this.getEventsForDay(userId, date);

      // 5. Find or create attendance record
      let record = await queryRunner.manager.findOne(AttendanceRecord, {
        where: { user_id: userId, date: dateStr as any },
      });

      const isNewRecord = !record;

      if (!record) {
        record = queryRunner.manager.create(AttendanceRecord, {
          user_id: userId,
          date: dateStr as any,
        });
      }

      // 6. Check if record is locked
      if (record.is_locked) {
        this.logger.warn(
          `Record for ${userId} on ${dateStr} is locked. Skipping processing.`,
        );
        await queryRunner.rollbackTransaction();
        return record;
      }

      // 7. Process based on type of day
      if (isHoliday) {
        this.processHolidayDay(record, events, schedule);
      } else if (isWeekend && !schedule) {
        this.processWeekendDay(record, events);
      } else if (!schedule) {
        this.processNoScheduleDay(record, events);
      } else {
        this.processNormalWorkDay(record, events, schedule);
      }

      // 8. Update metadata
      record.last_processed_at = new Date();
      record.processed_by = triggeredBy || 'system';

      // 9. Save record
      const savedRecord = await queryRunner.manager.save(record);

      // 10. Update event statuses
      await this.updateEventStatuses(
        queryRunner,
        events,
        ProcessingStatus.PROCESSED,
      );

      // 11. Log processing
      await this.logProcessing(
        queryRunner,
        userId,
        date,
        ProcessingType.SINGLE_RECORD,
        events.length,
        isNewRecord ? 1 : 0,
        isNewRecord ? 0 : 1,
        true,
        null,
        Date.now() - startTime,
        triggeredBy,
      );

      await queryRunner.commitTransaction();

      this.logger.log(
        `Successfully processed ${userId} on ${dateStr}. Status: ${savedRecord.status}`,
      );

      return savedRecord;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      // Log failure
      await this.logProcessing(
        queryRunner,
        userId,
        date,
        ProcessingType.SINGLE_RECORD,
        0,
        0,
        0,
        false,
        error.message,
        Date.now() - startTime,
        triggeredBy,
      );

      // Mark events as failed
      const events = await this.getEventsForDay(userId, date);
      await this.updateEventStatuses(
        queryRunner,
        events,
        ProcessingStatus.FAILED,
        error.message,
      );

      this.logger.error(
        `Failed to process ${userId} on ${dateStr}: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Process holiday day
   */
  private processHolidayDay(
    record: AttendanceRecord,
    events: AttendanceEvent[],
    schedule?: any,
  ): void {
    record.status = AttendanceStatus.HOLIDAY;
    record.scheduled_start = null;
    record.scheduled_end = null;
    record.scheduled_minutes = null;

    if (events.length > 0) {
      // Employee worked on holiday
      const sessions = this.pairEvents(events);
      const workResult = this.calculateWorkTime(sessions, null, null);

      record.worked_minutes = workResult.workedMinutes;
      record.holiday_minutes = workResult.workedMinutes;
      record.night_minutes = workResult.nightMinutes;
      record.work_sessions = sessions.map(this.sessionToJson);
      record.event_ids = events.map((e) => e.event_id);
      record.first_clock_in = this.formatTime(sessions[0]?.clockIn?.ts_local);
      record.last_clock_out = this.formatTime(
        sessions[sessions.length - 1]?.clockOut?.ts_local,
      );
    } else {
      this.resetWorkMetrics(record);
    }
  }

  /**
   * Process weekend day
   */
  private processWeekendDay(
    record: AttendanceRecord,
    events: AttendanceEvent[],
  ): void {
    record.status = AttendanceStatus.WEEKEND;
    record.scheduled_start = null;
    record.scheduled_end = null;
    record.scheduled_minutes = null;

    if (events.length > 0) {
      const sessions = this.pairEvents(events);
      const workResult = this.calculateWorkTime(sessions, null, null);

      record.worked_minutes = workResult.workedMinutes;
      record.night_minutes = workResult.nightMinutes;
      record.work_sessions = sessions.map(this.sessionToJson);
      record.event_ids = events.map((e) => e.event_id);
      record.first_clock_in = this.formatTime(sessions[0]?.clockIn?.ts_local);
      record.last_clock_out = this.formatTime(
        sessions[sessions.length - 1]?.clockOut?.ts_local,
      );
    } else {
      this.resetWorkMetrics(record);
    }
  }

  /**
   * Process day with no schedule
   */
  private processNoScheduleDay(
    record: AttendanceRecord,
    events: AttendanceEvent[],
  ): void {
    if (events.length === 0) {
      record.status = AttendanceStatus.ABSENT;
      record.scheduled_start = null;
      record.scheduled_end = null;
      record.scheduled_minutes = null;
      this.resetWorkMetrics(record);
    } else {
      // Has events but no schedule - mark as incomplete
      record.status = AttendanceStatus.INCOMPLETE;
      const sessions = this.pairEvents(events);
      const workResult = this.calculateWorkTime(sessions, null, null);

      record.worked_minutes = workResult.workedMinutes;
      record.night_minutes = workResult.nightMinutes;
      record.work_sessions = sessions.map(this.sessionToJson);
      record.event_ids = events.map((e) => e.event_id);
      record.first_clock_in = this.formatTime(sessions[0]?.clockIn?.ts_local);
      record.last_clock_out = this.formatTime(
        sessions[sessions.length - 1]?.clockOut?.ts_local,
      );
    }
  }

  /**
   * Process normal work day
   */
  private processNormalWorkDay(
    record: AttendanceRecord,
    events: AttendanceEvent[],
    schedule: any,
  ): void {
    record.scheduled_start = schedule.start_time;
    record.scheduled_end = schedule.end_time;

    // Calculate scheduled minutes
    const schedStart = this.parseTimeToMinutes(schedule.start_time);
    let schedEnd = this.parseTimeToMinutes(schedule.end_time);

    if (schedEnd < schedStart) {
      schedEnd += 24 * 60; // Cross-midnight shift
    }

    record.scheduled_minutes = schedEnd - schedStart;

    if (events.length === 0) {
      record.status = AttendanceStatus.MISSING;
      this.resetWorkMetrics(record);
      return;
    }

    // Pair events into sessions
    const sessions = this.pairEvents(events);

    // Check for incomplete sessions
    const incompleteSession = sessions.find((s) => !s.clockOut);
    if (incompleteSession) {
      record.status = AttendanceStatus.INCOMPLETE;
      record.requires_approval = true;
    } else {
      record.status = AttendanceStatus.OK;
    }

    // Calculate work metrics
    const workResult = this.calculateWorkTime(
      sessions,
      schedule.start_time,
      schedule.end_time,
    );

    record.worked_minutes = workResult.workedMinutes;
    record.late_minutes = workResult.lateMinutes;
    record.early_leave_minutes = workResult.earlyLeaveMinutes;
    record.overtime_minutes = workResult.overtimeMinutes;
    record.night_minutes = workResult.nightMinutes;
    record.work_sessions = sessions.map(this.sessionToJson);
    record.event_ids = events.map((e) => e.event_id);
    record.first_clock_in = this.formatTime(sessions[0]?.clockIn?.ts_local);
    record.last_clock_out = this.formatTime(
      sessions[sessions.length - 1]?.clockOut?.ts_local,
    );

    // Flag for approval if anomalies detected
    if (
      record.late_minutes > 60 ||
      record.overtime_minutes > 180 ||
      record.early_leave_minutes > 60
    ) {
      record.requires_approval = true;
    }
  }

  /**
   * Get events for a specific day
   */
  private async getEventsForDay(
    userId: string,
    date: Date,
  ): Promise<AttendanceEvent[]> {
    const startOfDay = moment.tz(date, this.timezone).startOf('day').toDate();
    const endOfDay = moment.tz(date, this.timezone).endOf('day').toDate();

    return await this.eventRepository.find({
      where: {
        user_id: userId,
        ts_local: Between(startOfDay, endOfDay),
        processing_status: ProcessingStatus.PROCESSED,
      },
      order: { ts_local: 'ASC' },
    });
  }

  /**
   * Pair clock-in and clock-out events into sessions
   */
  private pairEvents(
    events: AttendanceEvent[],
  ): Array<{ clockIn: AttendanceEvent; clockOut?: AttendanceEvent }> {
    const sessions = [];
    let currentClockIn: AttendanceEvent | null = null;

    for (const event of events) {
      if (event.event_type === EventType.CLOCK_IN) {
        if (currentClockIn) {
          // Previous session was incomplete
          sessions.push({ clockIn: currentClockIn, clockOut: undefined });
        }
        currentClockIn = event;
      } else if (event.event_type === EventType.CLOCK_OUT && currentClockIn) {
        sessions.push({ clockIn: currentClockIn, clockOut: event });
        currentClockIn = null;
      }
    }

    // Handle final incomplete session
    if (currentClockIn) {
      sessions.push({ clockIn: currentClockIn, clockOut: undefined });
    }

    return sessions;
  }

  /**
   * Calculate work time with advanced logic
   */
  private calculateWorkTime(
    sessions: Array<{ clockIn: AttendanceEvent; clockOut?: AttendanceEvent }>,
    scheduledStart?: string,
    scheduledEnd?: string,
  ): {
    workedMinutes: number;
    lateMinutes: number;
    earlyLeaveMinutes: number;
    overtimeMinutes: number;
    nightMinutes: number;
  } {
    let totalWorkedMinutes = 0;
    let totalNightMinutes = 0;
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

        // Calculate night shift minutes
        const nightMins = this.calculateNightMinutes(
          session.clockIn.ts_local,
          session.clockOut.ts_local,
        );
        totalNightMinutes += nightMins;
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

    // Apply rounding BEFORE grace period
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

      // Calculate late minutes (with grace period)
      const actualStartTime = moment(firstClockIn);
      const graceStartTime = scheduledStartTime
        .clone()
        .add(this.graceInMinutes, 'minutes');

      if (actualStartTime.isAfter(graceStartTime)) {
        lateMinutes = actualStartTime.diff(scheduledStartTime, 'minutes');
      }

      // Calculate early leave minutes (with grace period)
      const actualEndTime = moment(lastClockOut);
      const graceEndTime = scheduledEndTime
        .clone()
        .subtract(this.graceOutMinutes, 'minutes');

      if (actualEndTime.isBefore(graceEndTime)) {
        earlyLeaveMinutes = scheduledEndTime.diff(actualEndTime, 'minutes');
      }

      // Calculate overtime minutes (only if worked beyond threshold)
      const overtimeThreshold = scheduledEndTime
        .clone()
        .add(this.overtimeThreshold, 'minutes');

      if (actualEndTime.isAfter(overtimeThreshold)) {
        overtimeMinutes = actualEndTime.diff(scheduledEndTime, 'minutes');
      }
    }

    return {
      workedMinutes: Math.max(0, totalWorkedMinutes),
      lateMinutes: Math.max(0, lateMinutes),
      earlyLeaveMinutes: Math.max(0, earlyLeaveMinutes),
      overtimeMinutes: Math.max(0, overtimeMinutes),
      nightMinutes: Math.max(0, totalNightMinutes),
    };
  }

  /**
   * Calculate night shift minutes
   */
  private calculateNightMinutes(startTime: Date, endTime: Date): number {
    let nightMinutes = 0;
    const current = moment(startTime);
    const end = moment(endTime);

    while (current.isBefore(end)) {
      const hour = current.hour();

      // Check if current hour is in night shift range
      if (hour >= this.nightShiftStart || hour < this.nightShiftEnd) {
        const minutesInHour = Math.min(
          60 - current.minute(),
          end.diff(current, 'minutes'),
        );
        nightMinutes += minutesInHour;
        current.add(minutesInHour, 'minutes');
      } else {
        current.add(1, 'hour').startOf('hour');
      }
    }

    return nightMinutes;
  }

  /**
   * Parse time string to moment
   */
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

  /**
   * Parse time string to minutes since midnight
   */
  private parseTimeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Round to nearest value
   */
  private roundToNearest(value: number, nearest: number): number {
    if (nearest === 0) return value;
    return Math.round(value / nearest) * nearest;
  }

  /**
   * Format time for storage
   */
  private formatTime(date?: Date): string | undefined {
    if (!date) return undefined;
    return moment(date).format('HH:mm:ss');
  }

  /**
   * Convert session to JSON
   */
  private sessionToJson(
    session: { clockIn: AttendanceEvent; clockOut?: AttendanceEvent },
    index: number,
  ): WorkSession {
    return {
      session_id: `session-${index + 1}`,
      clock_in_event_id: session.clockIn.event_id,
      clock_out_event_id: session.clockOut?.event_id,
      clock_in_time: session.clockIn.ts_local,
      clock_out_time: session.clockOut?.ts_local,
      worked_minutes: session.clockOut
        ? moment(session.clockOut.ts_local).diff(
            moment(session.clockIn.ts_local),
            'minutes',
          )
        : undefined,
      is_complete: !!session.clockOut,
    };
  }

  /**
   * Reset work metrics
   */
  private resetWorkMetrics(record: AttendanceRecord): void {
    record.worked_minutes = 0;
    record.late_minutes = 0;
    record.early_leave_minutes = 0;
    record.overtime_minutes = 0;
    record.night_minutes = 0;
    record.holiday_minutes = 0;
    record.work_sessions = [];
    record.event_ids = [];
    record.first_clock_in = null;
    record.last_clock_out = null;
  }

  /**
   * Update event processing statuses
   */
  private async updateEventStatuses(
    queryRunner: any,
    events: AttendanceEvent[],
    status: ProcessingStatus,
    error?: string,
  ): Promise<void> {
    for (const event of events) {
      event.processing_status = status;
      event.processed_at = new Date();
      if (error) {
        event.processing_error = error;
      }
      await queryRunner.manager.save(event);
    }
  }

  /**
   * Log processing activity
   */
  private async logProcessing(
    queryRunner: any,
    userId: string | null,
    date: Date,
    type: ProcessingType,
    eventsProcessed: number,
    recordsCreated: number,
    recordsUpdated: number,
    success: boolean,
    errorMessage: string | null,
    durationMs: number,
    triggeredBy?: string,
  ): Promise<void> {
    const log = queryRunner.manager.create(AttendanceProcessingLog, {
      user_id: userId,
      processing_date: date,
      processing_type: type,
      events_processed: eventsProcessed,
      records_created: recordsCreated,
      records_updated: recordsUpdated,
      success,
      error_message: errorMessage,
      duration_ms: durationMs,
      triggered_by: triggeredBy,
    });

    await queryRunner.manager.save(log);
  }

  /**
   * Reprocess date range for an employee
   */
  async reprocessDateRange(
    employeeId: string,
    startDate: Date,
    endDate: Date,
    triggeredBy?: string,
  ): Promise<AttendanceRecord[]> {
    const records: AttendanceRecord[] = [];
    const current = moment(startDate);
    const end = moment(endDate);

    this.logger.log(
      `Reprocessing date range for ${employeeId} from ${current.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`,
    );

    while (current.isSameOrBefore(end)) {
      try {
        const record = await this.processEmployeeDay(
          employeeId,
          current.toDate(),
          triggeredBy,
        );
        records.push(record);
      } catch (error) {
        this.logger.error(
          `Failed to process ${employeeId} on ${current.format('YYYY-MM-DD')}: ${error.message}`,
        );
      }

      current.add(1, 'day');
    }

    return records;
  }

  /**
   * Batch process multiple employees for a date
   */
  async batchProcessDate(
    date: Date,
    userIds?: string[],
    triggeredBy?: string,
  ): Promise<{ total: number; success: number; failed: number }> {
    const startTime = Date.now();
    const dateStr = moment(date).format('YYYY-MM-DD');

    this.logger.log(`Starting batch processing for ${dateStr}`);

    const targetUserIds = userIds;

    // If no specific users, get all active users with schedules
    if (!targetUserIds || targetUserIds.length === 0) {
      // This would require a method to get all active employee IDs
      // For now, we'll skip this scenario
      this.logger.warn('No user IDs provided for batch processing');
      return { total: 0, success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    for (const userId of targetUserIds) {
      try {
        await this.processEmployeeDay(userId, date, triggeredBy);
        successCount++;
      } catch (error) {
        failedCount++;
        this.logger.error(`Failed to process user ${userId}: ${error.message}`);
      }
    }

    const duration = Date.now() - startTime;

    this.logger.log(
      `Batch processing completed for ${dateStr}. Total: ${targetUserIds.length}, Success: ${successCount}, Failed: ${failedCount}, Duration: ${duration}ms`,
    );

    // Log batch processing
    await this.logRepository.save({
      processing_date: date,
      processing_type: ProcessingType.DAILY_BATCH,
      events_processed: 0,
      records_created: successCount,
      records_updated: 0,
      success: failedCount === 0,
      error_message: failedCount > 0 ? `${failedCount} users failed` : null,
      duration_ms: duration,
      triggered_by: triggeredBy,
    });

    return {
      total: targetUserIds.length,
      success: successCount,
      failed: failedCount,
    };
  }
}
