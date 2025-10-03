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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceProcessorService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const attendance_event_entity_1 = require("./entities/attendance-event.entity");
const attendance_record_entity_1 = require("./entities/attendance-record.entity");
const schedule_assignments_service_1 = require("../schedules/schedule-assignments.service");
const holidays_service_1 = require("../holidays/holidays.service");
const moment = require("moment-timezone");
let AttendanceProcessorService = class AttendanceProcessorService {
    constructor(eventRepository, recordRepository, scheduleService, holidaysService, configService) {
        this.eventRepository = eventRepository;
        this.recordRepository = recordRepository;
        this.scheduleService = scheduleService;
        this.holidaysService = holidaysService;
        this.configService = configService;
        this.timezone = this.configService.get('DEFAULT_TIMEZONE', 'Asia/Tashkent');
        this.graceInMinutes = this.configService.get('GRACE_IN_MINUTES', 5);
        this.graceOutMinutes = this.configService.get('GRACE_OUT_MINUTES', 0);
        this.roundingMinutes = this.configService.get('ROUNDING_MINUTES', 5);
        this.overtimeThreshold = this.configService.get('OVERTIME_THRESHOLD_MINUTES', 15);
    }
    async processEmployeeDay(employeeId, date) {
        const dateStr = moment(date).format('YYYY-MM-DD');
        const schedule = await this.scheduleService.getEffectiveSchedule(employeeId, date);
        const isHoliday = await this.holidaysService.isHoliday(date, 'global');
        const events = await this.getEventsForDay(employeeId, date);
        let record = await this.recordRepository.findOne({
            where: { user_id: employeeId, date: dateStr },
        });
        if (!record) {
            record = this.recordRepository.create({
                user_id: employeeId,
                date: dateStr,
            });
        }
        if (isHoliday) {
            record.status = attendance_record_entity_1.AttendanceStatus.HOLIDAY;
            record.scheduled_start = null;
            record.scheduled_end = null;
            if (events.length > 0) {
                const sessions = this.pairEvents(events);
                const workResult = this.calculateWorkTime(sessions, null, null);
                record.worked_minutes = workResult.workedMinutes;
                record.holiday_minutes = workResult.workedMinutes;
            }
        }
        else if (!schedule) {
            record.status = attendance_record_entity_1.AttendanceStatus.ABSENT;
            record.scheduled_start = null;
            record.scheduled_end = null;
        }
        else {
            record.scheduled_start = schedule.start_time;
            record.scheduled_end = schedule.end_time;
            if (events.length === 0) {
                record.status = attendance_record_entity_1.AttendanceStatus.MISSING;
            }
            else {
                const sessions = this.pairEvents(events);
                const incompleteSession = sessions.find((s) => !s.clockOut);
                if (incompleteSession) {
                    record.status = attendance_record_entity_1.AttendanceStatus.INCOMPLETE;
                }
                else {
                    record.status = attendance_record_entity_1.AttendanceStatus.OK;
                }
                const workResult = this.calculateWorkTime(sessions, schedule.start_time, schedule.end_time);
                record.worked_minutes = workResult.workedMinutes;
                record.late_minutes = workResult.lateMinutes;
                record.early_leave_minutes = workResult.earlyLeaveMinutes;
                record.overtime_minutes = workResult.overtimeMinutes;
            }
        }
        record.event_ids = events.map((e) => e.event_id);
        return await this.recordRepository.save(record);
    }
    async getEventsForDay(employeeId, date) {
        const startOfDay = moment.tz(date, this.timezone).startOf('day').toDate();
        const endOfDay = moment.tz(date, this.timezone).endOf('day').toDate();
        return await this.eventRepository.find({
            where: {
                user_id: employeeId,
                ts_local: (0, typeorm_2.Between)(startOfDay, endOfDay),
            },
            order: { ts_local: 'ASC' },
        });
    }
    pairEvents(events) {
        const sessions = [];
        let currentClockIn = null;
        for (const event of events) {
            if (event.event_type === attendance_event_entity_1.EventType.CLOCK_IN) {
                if (currentClockIn) {
                    sessions.push({ clockIn: currentClockIn });
                }
                currentClockIn = event;
            }
            else if (event.event_type === attendance_event_entity_1.EventType.CLOCK_OUT && currentClockIn) {
                sessions.push({ clockIn: currentClockIn, clockOut: event });
                currentClockIn = null;
            }
        }
        if (currentClockIn) {
            sessions.push({ clockIn: currentClockIn });
        }
        return sessions;
    }
    calculateWorkTime(sessions, scheduledStart, scheduledEnd) {
        let totalWorkedMinutes = 0;
        let firstClockIn = null;
        let lastClockOut = null;
        for (const session of sessions) {
            if (session.clockOut) {
                const sessionMinutes = moment(session.clockOut.ts_local).diff(moment(session.clockIn.ts_local), 'minutes');
                totalWorkedMinutes += sessionMinutes;
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
            const actualStartTime = moment(firstClockIn);
            if (actualStartTime.isAfter(scheduledStartTime.clone().add(this.graceInMinutes, 'minutes'))) {
                lateMinutes = actualStartTime.diff(scheduledStartTime, 'minutes');
            }
            const actualEndTime = moment(lastClockOut);
            if (actualEndTime.isBefore(scheduledEndTime.clone().subtract(this.graceOutMinutes, 'minutes'))) {
                earlyLeaveMinutes = scheduledEndTime.diff(actualEndTime, 'minutes');
            }
            if (actualEndTime.isAfter(scheduledEndTime.clone().add(this.overtimeThreshold, 'minutes'))) {
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
    parseTimeToMoment(timeStr, referenceDate) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return moment(referenceDate)
            .startOf('day')
            .add(hours, 'hours')
            .add(minutes, 'minutes');
    }
    roundToNearest(value, nearest) {
        return Math.round(value / nearest) * nearest;
    }
    async reprocessDateRange(employeeId, startDate, endDate) {
        const records = [];
        const current = moment(startDate);
        const end = moment(endDate);
        while (current.isSameOrBefore(end)) {
            const record = await this.processEmployeeDay(employeeId, current.toDate());
            records.push(record);
            current.add(1, 'day');
        }
        return records;
    }
};
exports.AttendanceProcessorService = AttendanceProcessorService;
exports.AttendanceProcessorService = AttendanceProcessorService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attendance_event_entity_1.AttendanceEvent)),
    __param(1, (0, typeorm_1.InjectRepository)(attendance_record_entity_1.AttendanceRecord)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        schedule_assignments_service_1.ScheduleAssignmentsService,
        holidays_service_1.HolidaysService,
        config_1.ConfigService])
], AttendanceProcessorService);
//# sourceMappingURL=attendance-processor.service.js.map