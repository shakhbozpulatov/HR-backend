import { Employee } from '@/modules/employees/entities/employee.entity';
export declare enum UserRole {
    ADMIN = "ADMIN",
    HR_MANAGER = "HR_MANAGER",
    PAYROLL = "PAYROLL",
    MANAGER = "MANAGER",
    EMPLOYEE = "EMPLOYEE"
}
export declare class User {
    user_id: string;
    role: UserRole;
    email: string;
    password_hash: string;
    employee_id?: string;
    mfa_enabled: boolean;
    active: boolean;
    created_at: Date;
    updated_at: Date;
    employee?: Employee;
}
