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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AttendanceProcessorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceProcessorService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const attendance_1 = require("..");
const schedule_assignments_service_1 = require("../../schedules/schedule-assignments.service");
const holidays_service_1 = require("../../holidays/holidays.service");
let AttendanceProcessorService = AttendanceProcessorService_1 = class AttendanceProcessorService {
    constructor(eventRepository, recordRepository, logRepository, scheduleService, holidaysService, configService, dataSource) {
        this.eventRepository = eventRepository;
        this.recordRepository = recordRepository;
        this.logRepository = logRepository;
        this.scheduleService = scheduleService;
        this.holidaysService = holidaysService;
        this.configService = configService;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(AttendanceProcessorService_1.name);
        this.timezone = this.configService.get('DEFAULT_TIMEZONE', 'Asia/Tashkent');
        this.graceInMinutes = this.configService.get('GRACE_IN_MINUTES', 15);
        this.graceOutMinutes = this.configService.get('GRACE_OUT_MINUTES', 15);
        this.roundingMinutes = this.configService.get('ROUNDING_MINUTES', 5);
        this.overtimeThreshold = this.configService.get('OVERTIME_THRESHOLD_MINUTES', 30);
        this.nightShiftStart = this.configService.get('NIGHT_SHIFT_START_HOUR', 22);
        this.nightShiftEnd = this.configService.get('NIGHT_SHIFT_END_HOUR', 6);
    }
    async processEmployeeDay(userId, date, triggeredBy) {
        const startTime = Date.now();
        const dateStr = (0, moment_timezone_1.default)(date).format('YYYY-MM-DD');
        this.logger.log(`Processing attendance for user ${userId} on ${dateStr}`);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const schedule = await this.scheduleService.getEffectiveSchedule(userId, date);
            const isHoliday = await this.holidaysService.isHoliday(date, 'global');
            const dayOfWeek = (0, moment_timezone_1.default)(date).day();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const events = await this.getEventsForDay(userId, date);
            let record = await queryRunner.manager.findOne(attendance_1.AttendanceRecord, {
                where: { user_id: userId, date: dateStr },
            });
            const isNewRecord = !record;
            if (!record) {
                record = queryRunner.manager.create(attendance_1.AttendanceRecord, {
                    user_id: userId,
                    date: dateStr,
                });
            }
            if (record.is_locked) {
                this.logger.warn(`Record for ${userId} on ${dateStr} is locked. Skipping processing.`);
                await queryRunner.rollbackTransaction();
                return record;
            }
            if (isHoliday) {
                this.processHolidayDay(record, events, schedule);
            }
            else if (isWeekend && !schedule) {
                this.processWeekendDay(record, events);
            }
            else if (!schedule) {
                this.processNoScheduleDay(record, events);
            }
            else {
                this.processNormalWorkDay(record, events, schedule);
            }
            record.last_processed_at = new Date();
            record.processed_by = triggeredBy || 'system';
            const savedRecord = await queryRunner.manager.save(record);
            await this.updateEventStatuses(queryRunner, events, attendance_1.ProcessingStatus.PROCESSED);
            await this.logProcessing(queryRunner, userId, date, attendance_1.ProcessingType.SINGLE_RECORD, events.length, isNewRecord ? 1 : 0, isNewRecord ? 0 : 1, true, null, Date.now() - startTime, triggeredBy);
            await queryRunner.commitTransaction();
            this.logger.log(`Successfully processed ${userId} on ${dateStr}. Status: ${savedRecord.status}`);
            return savedRecord;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            await this.logProcessing(queryRunner, userId, date, attendance_1.ProcessingType.SINGLE_RECORD, 0, 0, 0, false, error.message, Date.now() - startTime, triggeredBy);
            const events = await this.getEventsForDay(userId, date);
            await this.updateEventStatuses(queryRunner, events, attendance_1.ProcessingStatus.FAILED, error.message);
            this.logger.error(`Failed to process ${userId} on ${dateStr}: ${error.message}`, error.stack);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    processHolidayDay(record, events, schedule) {
        record.status = attendance_1.AttendanceStatus.HOLIDAY;
        record.scheduled_start = null;
        record.scheduled_end = null;
        record.scheduled_minutes = null;
        if (events.length > 0) {
            const sessions = this.pairEvents(events);
            const workResult = this.calculateWorkTime(sessions, null, null);
            record.worked_minutes = workResult.workedMinutes;
            record.holiday_minutes = workResult.workedMinutes;
            record.night_minutes = workResult.nightMinutes;
            record.work_sessions = sessions.map(this.sessionToJson);
            record.event_ids = events.map((e) => e.event_id);
            record.first_clock_in = this.formatTime(sessions[0]?.clockIn?.ts_local);
            record.last_clock_out = this.formatTime(sessions[sessions.length - 1]?.clockOut?.ts_local);
        }
        else {
            this.resetWorkMetrics(record);
        }
    }
    processWeekendDay(record, events) {
        record.status = attendance_1.AttendanceStatus.WEEKEND;
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
            record.last_clock_out = this.formatTime(sessions[sessions.length - 1]?.clockOut?.ts_local);
        }
        else {
            this.resetWorkMetrics(record);
        }
    }
    processNoScheduleDay(record, events) {
        if (events.length === 0) {
            record.status = attendance_1.AttendanceStatus.ABSENT;
            record.scheduled_start = null;
            record.scheduled_end = null;
            record.scheduled_minutes = null;
            this.resetWorkMetrics(record);
        }
        else {
            record.status = attendance_1.AttendanceStatus.INCOMPLETE;
            const sessions = this.pairEvents(events);
            const workResult = this.calculateWorkTime(sessions, null, null);
            record.worked_minutes = workResult.workedMinutes;
            record.night_minutes = workResult.nightMinutes;
            record.work_sessions = sessions.map(this.sessionToJson);
            record.event_ids = events.map((e) => e.event_id);
            record.first_clock_in = this.formatTime(sessions[0]?.clockIn?.ts_local);
            record.last_clock_out = this.formatTime(sessions[sessions.length - 1]?.clockOut?.ts_local);
        }
    }
    processNormalWorkDay(record, events, schedule) {
        record.scheduled_start = schedule.start_time;
        record.scheduled_end = schedule.end_time;
        const schedStart = this.parseTimeToMinutes(schedule.start_time);
        let schedEnd = this.parseTimeToMinutes(schedule.end_time);
        if (schedEnd < schedStart) {
            schedEnd += 24 * 60;
        }
        record.scheduled_minutes = schedEnd - schedStart;
        if (events.length === 0) {
            record.status = attendance_1.AttendanceStatus.MISSING;
            this.resetWorkMetrics(record);
            return;
        }
        const sessions = this.pairEvents(events);
        const incompleteSession = sessions.find((s) => !s.clockOut);
        if (incompleteSession) {
            record.status = attendance_1.AttendanceStatus.INCOMPLETE;
            record.requires_approval = true;
        }
        else {
            record.status = attendance_1.AttendanceStatus.OK;
        }
        const workResult = this.calculateWorkTime(sessions, schedule.start_time, schedule.end_time);
        record.worked_minutes = workResult.workedMinutes;
        record.late_minutes = workResult.lateMinutes;
        record.early_leave_minutes = workResult.earlyLeaveMinutes;
        record.overtime_minutes = workResult.overtimeMinutes;
        record.night_minutes = workResult.nightMinutes;
        record.work_sessions = sessions.map(this.sessionToJson);
        record.event_ids = events.map((e) => e.event_id);
        record.first_clock_in = this.formatTime(sessions[0]?.clockIn?.ts_local);
        record.last_clock_out = this.formatTime(sessions[sessions.length - 1]?.clockOut?.ts_local);
        if (record.late_minutes > 60 ||
            record.overtime_minutes > 180 ||
            record.early_leave_minutes > 60) {
            record.requires_approval = true;
        }
    }
    async getEventsForDay(userId, date) {
        const startOfDay = moment_timezone_1.default.tz(date, this.timezone).startOf('day').toDate();
        const endOfDay = moment_timezone_1.default.tz(date, this.timezone).endOf('day').toDate();
        return await this.eventRepository.find({
            where: {
                user_id: userId,
                ts_local: (0, typeorm_2.Between)(startOfDay, endOfDay),
                processing_status: attendance_1.ProcessingStatus.PROCESSED,
            },
            order: { ts_local: 'ASC' },
        });
    }
    pairEvents(events) {
        const sessions = [];
        let currentClockIn = null;
        for (const event of events) {
            if (event.event_type === attendance_1.EventType.CLOCK_IN) {
                if (currentClockIn) {
                    sessions.push({ clockIn: currentClockIn, clockOut: undefined });
                }
                currentClockIn = event;
            }
            else if (event.event_type === attendance_1.EventType.CLOCK_OUT && currentClockIn) {
                sessions.push({ clockIn: currentClockIn, clockOut: event });
                currentClockIn = null;
            }
        }
        if (currentClockIn) {
            sessions.push({ clockIn: currentClockIn, clockOut: undefined });
        }
        return sessions;
    }
    calculateWorkTime(sessions, scheduledStart, scheduledEnd) {
        let totalWorkedMinutes = 0;
        let totalNightMinutes = 0;
        let firstClockIn = null;
        let lastClockOut = null;
        for (const session of sessions) {
            if (session.clockOut) {
                const sessionMinutes = (0, moment_timezone_1.default)(session.clockOut.ts_local).diff((0, moment_timezone_1.default)(session.clockIn.ts_local), 'minutes');
                totalWorkedMinutes += sessionMinutes;
                const nightMins = this.calculateNightMinutes(session.clockIn.ts_local, session.clockOut.ts_local);
                totalNightMinutes += nightMins;
            }
            if (!firstClockIn || session.clockIn.ts_local < firstClockIn) {
                firstClockIn = session.clockIn.ts_local;
            }
            if (session.clockOut &&
                (!lastClockOut || session.clockOut.ts_local > lastClockOut)) {
                lastClockOut = session.clockOut.ts_local;
            }
        }
        totalWorkedMinutes = this.roundToNearest(totalWorkedMinutes, this.roundingMinutes);
        let lateMinutes = 0;
        let earlyLeaveMinutes = 0;
        let overtimeMinutes = 0;
        if (scheduledStart && scheduledEnd && firstClockIn && lastClockOut) {
            const scheduledStartTime = this.parseTimeToMoment(scheduledStart, firstClockIn);
            const scheduledEndTime = this.parseTimeToMoment(scheduledEnd, firstClockIn);
            if (scheduledEndTime.isBefore(scheduledStartTime)) {
                scheduledEndTime.add(1, 'day');
            }
            const actualStartTime = (0, moment_timezone_1.default)(firstClockIn);
            const graceStartTime = scheduledStartTime
                .clone()
                .add(this.graceInMinutes, 'minutes');
            if (actualStartTime.isAfter(graceStartTime)) {
                lateMinutes = actualStartTime.diff(scheduledStartTime, 'minutes');
            }
            const actualEndTime = (0, moment_timezone_1.default)(lastClockOut);
            const graceEndTime = scheduledEndTime
                .clone()
                .subtract(this.graceOutMinutes, 'minutes');
            if (actualEndTime.isBefore(graceEndTime)) {
                earlyLeaveMinutes = scheduledEndTime.diff(actualEndTime, 'minutes');
            }
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
    calculateNightMinutes(startTime, endTime) {
        let nightMinutes = 0;
        const current = (0, moment_timezone_1.default)(startTime);
        const end = (0, moment_timezone_1.default)(endTime);
        while (current.isBefore(end)) {
            const hour = current.hour();
            if (hour >= this.nightShiftStart || hour < this.nightShiftEnd) {
                const minutesInHour = Math.min(60 - current.minute(), end.diff(current, 'minutes'));
                nightMinutes += minutesInHour;
                current.add(minutesInHour, 'minutes');
            }
            else {
                current.add(1, 'hour').startOf('hour');
            }
        }
        return nightMinutes;
    }
    parseTimeToMoment(timeStr, referenceDate) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return (0, moment_timezone_1.default)(referenceDate)
            .startOf('day')
            .add(hours, 'hours')
            .add(minutes, 'minutes');
    }
    parseTimeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }
    roundToNearest(value, nearest) {
        if (nearest === 0)
            return value;
        return Math.round(value / nearest) * nearest;
    }
    formatTime(date) {
        if (!date)
            return undefined;
        return (0, moment_timezone_1.default)(date).format('HH:mm:ss');
    }
    sessionToJson(session, index) {
        return {
            session_id: `session-${index + 1}`,
            clock_in_event_id: session.clockIn.event_id,
            clock_out_event_id: session.clockOut?.event_id,
            clock_in_time: session.clockIn.ts_local,
            clock_out_time: session.clockOut?.ts_local,
            worked_minutes: session.clockOut
                ? (0, moment_timezone_1.default)(session.clockOut.ts_local).diff((0, moment_timezone_1.default)(session.clockIn.ts_local), 'minutes')
                : undefined,
            is_complete: !!session.clockOut,
        };
    }
    resetWorkMetrics(record) {
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
    async updateEventStatuses(queryRunner, events, status, error) {
        for (const event of events) {
            event.processing_status = status;
            event.processed_at = new Date();
            if (error) {
                event.processing_error = error;
            }
            await queryRunner.manager.save(event);
        }
    }
    async logProcessing(queryRunner, userId, date, type, eventsProcessed, recordsCreated, recordsUpdated, success, errorMessage, durationMs, triggeredBy) {
        const log = queryRunner.manager.create(attendance_1.AttendanceProcessingLog, {
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
    async reprocessDateRange(employeeId, startDate, endDate, triggeredBy) {
        const records = [];
        const current = (0, moment_timezone_1.default)(startDate);
        const end = (0, moment_timezone_1.default)(endDate);
        this.logger.log(`Reprocessing date range for ${employeeId} from ${current.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`);
        while (current.isSameOrBefore(end)) {
            try {
                const record = await this.processEmployeeDay(employeeId, current.toDate(), triggeredBy);
                records.push(record);
            }
            catch (error) {
                this.logger.error(`Failed to process ${employeeId} on ${current.format('YYYY-MM-DD')}: ${error.message}`);
            }
            current.add(1, 'day');
        }
        return records;
    }
    async batchProcessDate(date, userIds, triggeredBy) {
        const startTime = Date.now();
        const dateStr = (0, moment_timezone_1.default)(date).format('YYYY-MM-DD');
        this.logger.log(`Starting batch processing for ${dateStr}`);
        const targetUserIds = userIds;
        if (!targetUserIds || targetUserIds.length === 0) {
            this.logger.warn('No user IDs provided for batch processing');
            return { total: 0, success: 0, failed: 0 };
        }
        let successCount = 0;
        let failedCount = 0;
        for (const userId of targetUserIds) {
            try {
                await this.processEmployeeDay(userId, date, triggeredBy);
                successCount++;
            }
            catch (error) {
                failedCount++;
                this.logger.error(`Failed to process user ${userId}: ${error.message}`);
            }
        }
        const duration = Date.now() - startTime;
        this.logger.log(`Batch processing completed for ${dateStr}. Total: ${targetUserIds.length}, Success: ${successCount}, Failed: ${failedCount}, Duration: ${duration}ms`);
        await this.logRepository.save({
            processing_date: date,
            processing_type: attendance_1.ProcessingType.DAILY_BATCH,
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
};
exports.AttendanceProcessorService = AttendanceProcessorService;
exports.AttendanceProcessorService = AttendanceProcessorService = AttendanceProcessorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attendance_1.AttendanceEvent)),
    __param(1, (0, typeorm_1.InjectRepository)(attendance_1.AttendanceRecord)),
    __param(2, (0, typeorm_1.InjectRepository)(attendance_1.AttendanceProcessingLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        schedule_assignments_service_1.ScheduleAssignmentsService,
        holidays_service_1.HolidaysService,
        config_1.ConfigService,
        typeorm_2.DataSource])
], AttendanceProcessorService);
//# sourceMappingURL=attendance-processor.service.js.map