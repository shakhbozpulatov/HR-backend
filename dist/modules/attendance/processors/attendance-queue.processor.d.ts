import { Job } from 'bull';
import { AttendanceProcessorService } from '@/modules/attendance';
export declare class AttendanceQueueProcessor {
    private readonly attendanceProcessor;
    private readonly logger;
    constructor(attendanceProcessor: AttendanceProcessorService);
    processEmployeeDay(job: Job<{
        employeeId: string;
        date: string;
        triggeredBy?: string;
        priority?: number;
    }>): Promise<{
        success: boolean;
        record_id: string;
        status: import("@/modules/attendance").AttendanceStatus;
        worked_minutes: number;
        late_minutes: number;
        overtime_minutes: number;
    }>;
    reprocessDateRange(job: Job<{
        employeeId: string;
        startDate: string;
        endDate: string;
        triggeredBy?: string;
        force?: boolean;
    }>): Promise<{
        success: boolean;
        records_processed: number;
        records: {
            date: Date;
            status: import("@/modules/attendance").AttendanceStatus;
            worked_minutes: number;
        }[];
    }>;
    dailyProcessing(job: Job<{
        date: string;
        userIds?: string[];
        triggeredBy?: string;
        batchSize?: number;
    }>): Promise<{
        success: boolean;
        date: string;
        total: number;
        successful: number;
        failed: number;
        success_rate: string;
    }>;
    processPendingEvents(job: Job<{
        eventIds?: string[];
        limit?: number;
    }>): Promise<{
        success: boolean;
        events_processed: number;
    }>;
    cleanupOldData(job: Job<{
        days: number;
        type: 'logs' | 'events' | 'all';
    }>): Promise<{
        success: boolean;
        message: string;
    }>;
    onActive(job: Job): void;
    onCompleted(job: Job, result: any): void;
    onFailed(job: Job, error: Error): Promise<void>;
    onError(error: Error): void;
    onStalled(job: Job): void;
    private sendFailureAlert;
    getJobStatistics(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
    }>;
}
