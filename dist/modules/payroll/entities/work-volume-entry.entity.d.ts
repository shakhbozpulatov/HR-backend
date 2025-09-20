import { Employee } from '../../employees/entities/employee.entity';
export declare class WorkVolumeEntry {
    entry_id: string;
    employee_id: string;
    date: Date;
    work_type: string;
    quantity: number;
    unit_rate: number;
    approved: boolean;
    approved_by?: string;
    approved_at?: Date;
    created_at: Date;
    updated_at: Date;
    employee: Employee;
}
