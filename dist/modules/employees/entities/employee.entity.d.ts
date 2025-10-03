import { AttendanceEvent } from '@/modules/attendance/entities/attendance-event.entity';
import { AttendanceRecord } from '@/modules/attendance/entities/attendance-record.entity';
import { EmployeeScheduleAssignment } from '@/modules/schedules/entities/employee-schedule-assignment.entity';
import { PayrollItem } from '@/modules/payroll/entities/payroll-item.entity';
import { WorkVolumeEntry } from '@/modules/payroll/entities/work-volume-entry.entity';
import { Company } from '@/modules/company/entities/company.entity';
import { Department } from '@/modules/company/entities/department.entity';
export declare enum TariffType {
    HOURLY = "HOURLY",
    MONTHLY = "MONTHLY"
}
export declare enum EmployeeStatus {
    ACTIVE = "active",
    INACTIVE = "inactive"
}
export declare class Employee {
    id: string;
    company_id?: string;
    status: EmployeeStatus;
    first_name: string;
    last_name: string;
    middle_name?: string;
    dob?: Date;
    email: string;
    phone?: string;
    department_id?: string;
    department?: string;
    location?: string;
    manager_id?: string;
    position?: string;
    start_date: Date;
    end_date?: Date;
    tariff_type: TariffType;
    hourly_rate?: number;
    monthly_salary?: number;
    terminal_user_id?: string;
    external_ids?: Record<string, string>;
    created_at: Date;
    updated_at: Date;
    company: Company;
    department_entity?: Department;
    manager: Employee;
    attendance_events: AttendanceEvent[];
    attendance_records: AttendanceRecord[];
    schedule_assignments: EmployeeScheduleAssignment[];
    payroll_items: PayrollItem[];
    work_volume_entries: WorkVolumeEntry[];
}
