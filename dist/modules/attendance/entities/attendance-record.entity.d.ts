import { AttendanceEvent } from './attendance-event.entity';
import { User } from '@/modules/users/entities/user.entity';
export declare enum AttendanceStatus {
    OK = "OK",
    MISSING = "MISSING",
    INCOMPLETE = "INCOMPLETE",
    ABSENT = "ABSENT",
    HOLIDAY = "HOLIDAY"
}
export interface ManualAdjustment {
    id: string;
    type: 'CLOCK_TIME_EDIT' | 'MARK_ABSENT_PAID' | 'MARK_ABSENT_UNPAID';
    reason: string;
    before_value?: any;
    after_value?: any;
    created_by: string;
    created_at: Date;
}
export interface Approval {
    approved_by: string;
    approved_at: Date;
    locked: boolean;
}
export declare class AttendanceRecord {
    record_id: string;
    user_id: string;
    date: Date;
    scheduled_start?: string;
    scheduled_end?: string;
    worked_minutes: number;
    late_minutes: number;
    early_leave_minutes: number;
    overtime_minutes: number;
    night_minutes?: number;
    holiday_minutes?: number;
    status: AttendanceStatus;
    event_ids?: string[];
    manual_adjustments?: ManualAdjustment[];
    approvals?: Approval[];
    created_at: Date;
    updated_at: Date;
    user: User;
    events: AttendanceEvent[];
}
