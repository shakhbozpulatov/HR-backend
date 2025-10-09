import { AttendanceProcessorService } from '../services/attendance-processor.service';
import { BatchProcessDto, ReprocessDateRangeDto } from '../dto';
export declare class BatchProcessingController {
    private readonly processorService;
    constructor(processorService: AttendanceProcessorService);
    batchProcessDate(batchDto: BatchProcessDto, actorId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            date: string;
            total: number;
            success: number;
            failed: number;
            success_rate: string;
        };
    }>;
    reprocessDateRange(reprocessDto: ReprocessDateRangeDto, actorId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            user_id: string;
            start_date: string;
            end_date: string;
            records_processed: number;
            records: {
                date: Date;
                status: import("..").AttendanceStatus;
                worked_minutes: number;
            }[];
        };
    }>;
    reprocessBulk(data: {
        user_ids: string[];
        start_date: string;
        end_date: string;
        force?: boolean;
    }, actorId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            total: number;
            success: number;
            failed: number;
            results: any[];
        };
    }>;
    processYesterday(actorId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            total: number;
            success: number;
            failed: number;
            date: string;
        };
    }>;
    processCurrentMonth(data: {
        user_ids?: string[];
    }, actorId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            month: string;
            start_date: string;
            end_date: string;
            users_processed: number;
            results: any[];
        };
    }>;
    getBatchStatus(_limit?: number): Promise<{
        success: boolean;
        data: {
            active_jobs: number;
            recent_jobs: {
                job_id: string;
                type: string;
                date: string;
                status: string;
                total: number;
                success: number;
                failed: number;
                duration_ms: number;
                completed_at: string;
            }[];
        };
    }>;
    getStatistics(from?: string, to?: string): Promise<{
        success: boolean;
        data: {
            period: {
                from: string;
                to: string;
            };
            total_jobs: number;
            successful_jobs: number;
            failed_jobs: number;
            total_records_processed: number;
            average_processing_time_ms: number;
            success_rate: string;
        };
    }>;
    cancelBatch(jobId: string): Promise<{
        success: boolean;
        message: string;
        job_id: string;
    }>;
    validateBatch(data: {
        user_ids?: string[];
        start_date: string;
        end_date: string;
    }): Promise<{
        success: boolean;
        data: {
            valid: boolean;
            days_count: number;
            users_count: string | number;
            estimated_records: number;
            estimated_duration_minutes: number;
            warnings: string[];
        };
    }>;
}
