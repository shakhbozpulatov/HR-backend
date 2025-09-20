import { EmployeeScheduleAssignment } from './employee-schedule-assignment.entity';
export interface BreakTime {
    start_time: string;
    end_time: string;
    paid: boolean;
}
export declare class ScheduleTemplate {
    template_id: string;
    name: string;
    workdays: string[];
    start_time: string;
    end_time: string;
    breaks?: BreakTime[];
    grace_in_min: number;
    grace_out_min: number;
    rounding_min: number;
    created_at: Date;
    updated_at: Date;
    assignments: EmployeeScheduleAssignment[];
}
