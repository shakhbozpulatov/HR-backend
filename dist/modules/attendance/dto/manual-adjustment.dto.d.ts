export declare enum AdjustmentType {
    CLOCK_TIME_EDIT = "CLOCK_TIME_EDIT",
    MARK_ABSENT_PAID = "MARK_ABSENT_PAID",
    MARK_ABSENT_UNPAID = "MARK_ABSENT_UNPAID"
}
export declare class ManualAdjustmentDto {
    type: AdjustmentType;
    reason: string;
    clock_in_time?: string;
    clock_out_time?: string;
}
