export declare enum ProcessingType {
    DAILY_BATCH = "daily_batch",
    SINGLE_RECORD = "single_record",
    RANGE_REPROCESS = "range_reprocess",
    MANUAL_TRIGGER = "manual_trigger"
}
export declare class AttendanceProcessingLog {
    log_id: string;
    user_id?: string;
    processing_date: Date;
    processing_type: ProcessingType;
    events_processed: number;
    records_created: number;
    records_updated: number;
    success: boolean;
    error_message?: string;
    duration_ms: number;
    triggered_by?: string;
    metadata?: any;
    created_at: Date;
}
