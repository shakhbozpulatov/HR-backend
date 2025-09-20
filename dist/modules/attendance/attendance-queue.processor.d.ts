import { Job } from 'bull';
import { AttendanceProcessorService } from './attendance-processor.service';
export declare class AttendanceQueueProcessor {
    private attendanceProcessor;
    private readonly logger;
    constructor(attendanceProcessor: AttendanceProcessorService);
    processEmployeeDay(job: Job<{
        employeeId: string;
        date: string;
    }>): Promise<import("./entities/attendance-record.entity").AttendanceRecord>;
    reprocessDateRange(job: Job<{
        employeeId: string;
        startDate: string;
        endDate: string;
    }>): Promise<import("./entities/attendance-record.entity").AttendanceRecord[]>;
    dailyProcessing(job: Job<{
        date: string;
    }>): Promise<void>;
}
