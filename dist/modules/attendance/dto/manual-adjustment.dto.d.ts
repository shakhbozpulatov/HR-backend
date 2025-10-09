import { AttendanceStatus } from '@/modules/attendance/entities/attendance-record.entity';
export declare enum AdjustmentType {
    CLOCK_TIME_EDIT = "CLOCK_TIME_EDIT",
    MARK_ABSENT_PAID = "MARK_ABSENT_PAID",
    MARK_ABSENT_UNPAID = "MARK_ABSENT_UNPAID",
    OVERRIDE_STATUS = "OVERRIDE_STATUS",
    ADD_MINUTES = "ADD_MINUTES",
    REMOVE_MINUTES = "REMOVE_MINUTES"
}
export declare class ManualAdjustmentDto {
    type: AdjustmentType;
    reason: string;
    clock_in_time?: string;
    clock_out_time?: string;
    minutes?: number;
    new_status?: AttendanceStatus;
    metadata?: any;
}
