import { Employee } from '@/modules/employees/entities/employee.entity';
import { ScheduleTemplate } from './schedule-template.entity';
export interface ScheduleException {
    date?: string;
    start_date?: string;
    end_date?: string;
    template_id?: string;
    type: 'OFF' | 'ALTERNATE_TEMPLATE';
}
export declare class EmployeeScheduleAssignment {
    assignment_id: string;
    employee_id: string;
    default_template_id: string;
    effective_from: Date;
    effective_to?: Date;
    exceptions?: ScheduleException[];
    created_at: Date;
    updated_at: Date;
    employee: Employee;
    default_template: ScheduleTemplate;
}
