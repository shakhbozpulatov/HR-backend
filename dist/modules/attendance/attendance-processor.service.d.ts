import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AttendanceEvent } from './entities/attendance-event.entity';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { ScheduleAssignmentsService } from '../schedules/schedule-assignments.service';
import { HolidaysService } from '../holidays/holidays.service';
export declare class AttendanceProcessorService {
    private eventRepository;
    private recordRepository;
    private scheduleService;
    private holidaysService;
    private configService;
    private readonly timezone;
    private readonly graceInMinutes;
    private readonly graceOutMinutes;
    private readonly roundingMinutes;
    private readonly overtimeThreshold;
    constructor(eventRepository: Repository<AttendanceEvent>, recordRepository: Repository<AttendanceRecord>, scheduleService: ScheduleAssignmentsService, holidaysService: HolidaysService, configService: ConfigService);
    processEmployeeDay(userId: string, date: Date): Promise<AttendanceRecord>;
    private getEventsForDay;
    private pairEvents;
    private calculateWorkTime;
    private parseTimeToMoment;
    private roundToNearest;
    reprocessDateRange(employeeId: string, startDate: Date, endDate: Date): Promise<AttendanceRecord[]>;
}
