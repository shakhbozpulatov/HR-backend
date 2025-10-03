import { Company } from '@/modules/company/entities/company.entity';
import { Department } from '@/modules/company/entities/department.entity';
import { AttendanceEvent } from '@/modules/attendance/entities/attendance-event.entity';
import { AttendanceRecord } from '@/modules/attendance/entities/attendance-record.entity';
import { UserScheduleAssignment } from '@/modules/schedules/entities/employee-schedule-assignment.entity';
import { PayrollItem } from '@/modules/payroll/entities/payroll-item.entity';
import { WorkVolumeEntry } from '@/modules/payroll/entities/work-volume-entry.entity';
export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    COMPANY_OWNER = "COMPANY_OWNER",
    ADMIN = "ADMIN",
    HR_MANAGER = "HR_MANAGER",
    PAYROLL = "PAYROLL",
    MANAGER = "MANAGER",
    EMPLOYEE = "EMPLOYEE"
}
export declare enum TariffType {
    HOURLY = "HOURLY",
    MONTHLY = "MONTHLY"
}
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive"
}
export declare class User {
    id: string;
    company_id?: string;
    role: UserRole;
    email: string;
    password_hash: string;
    employee_id?: string;
    mfa_enabled: boolean;
    active: boolean;
    created_at: Date;
    updated_at: Date;
    status: UserStatus;
    first_name: string;
    last_name: string;
    middle_name?: string;
    dob?: Date;
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
    company?: Company;
    department_entity?: Department;
    manager: User;
    attendance_events: AttendanceEvent[];
    attendance_records: AttendanceRecord[];
    schedule_assignments: UserScheduleAssignment[];
    payroll_items: PayrollItem[];
    work_volume_entries: WorkVolumeEntry[];
}
