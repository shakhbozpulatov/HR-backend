export declare class BatchProcessDto {
    date: string;
    user_ids?: string[];
    force_reprocess?: boolean;
    include_locked?: boolean;
}
export declare class ReprocessDateRangeDto {
    user_id: string;
    start_date: string;
    end_date: string;
    force?: boolean;
}
export declare class ApprovalDto {
    level?: number;
    comments?: string;
    lock_record?: boolean;
}
