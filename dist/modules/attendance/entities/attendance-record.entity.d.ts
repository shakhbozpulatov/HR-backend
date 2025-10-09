import { AttendanceEvent } from './attendance-event.entity';
import { User } from '@/modules/users/entities/user.entity';
export declare enum AttendanceStatus {
    OK = "OK",
    MISSING = "MISSING",
    INCOMPLETE = "INCOMPLETE",
    ABSENT = "ABSENT",
    HOLIDAY = "HOLIDAY",
    LEAVE = "LEAVE",
    WEEKEND = "WEEKEND"
}
export interface ManualAdjustment {
    id: string;
    type: 'CLOCK_TIME_EDIT' | 'MARK_ABSENT_PAID' | 'MARK_ABSENT_UNPAID' | 'OVERRIDE_STATUS' | 'ADD_MINUTES' | 'REMOVE_MINUTES';
    reason: string;
    before_value?: any;
    after_value?: any;
    created_by: string;
    created_at: Date;
    approved_by?: string;
    approved_at?: Date;
}
export interface Approval {
    level: number;
    approved_by: string;
    approved_at: Date;
    locked: boolean;
    comments?: string;
}
export interface WorkSession {
    session_id: string;
    clock_in_event_id: string;
    clock_out_event_id?: string;
    clock_in_time: Date;
    clock_out_time?: Date;
    worked_minutes?: number;
    is_complete: boolean;
}
export declare class AttendanceRecord {
    record_id: string;
    user_id: string;
    date: Date;
    scheduled_start?: string;
    scheduled_end?: string;
    scheduled_minutes?: number;
    first_clock_in?: string;
    last_clock_out?: string;
    worked_minutes: number;
    late_minutes: number;
    early_leave_minutes: number;
    overtime_minutes: number;
    night_minutes: number;
    holiday_minutes: number;
    break_minutes: number;
    status: AttendanceStatus;
    event_ids?: string[];
    work_sessions?: WorkSession[];
    manual_adjustments?: ManualAdjustment[];
    approvals?: Approval[];
    is_locked: boolean;
    requires_approval: boolean;
    last_processed_at?: Date;
    processed_by?: string;
    notes?: string;
    created_at: Date;
    updated_at: Date;
    user: User;
    events: AttendanceEvent[];
}
