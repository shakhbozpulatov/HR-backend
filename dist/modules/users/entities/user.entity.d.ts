import { Employee } from '@/modules/employees/entities/employee.entity';
import { Company } from '@/modules/company/entities/company.entity';
export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    COMPANY_OWNER = "COMPANY_OWNER",
    ADMIN = "ADMIN",
    HR_MANAGER = "HR_MANAGER",
    PAYROLL = "PAYROLL",
    MANAGER = "MANAGER",
    EMPLOYEE = "EMPLOYEE"
}
export declare class User {
    user_id: string;
    company_id?: string;
    role: UserRole;
    email: string;
    password_hash: string;
    employee_id?: string;
    mfa_enabled: boolean;
    active: boolean;
    created_at: Date;
    updated_at: Date;
    company?: Company;
    employee?: Employee;
}
