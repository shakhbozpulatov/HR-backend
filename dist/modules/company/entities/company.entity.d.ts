import { User } from '@/modules/users/entities/user.entity';
import { Holiday } from '@/modules/holidays/entities/holiday.entity';
import { Department } from './department.entity';
import { ScheduleTemplate } from '@/modules/schedules/entities/schedule-template.entity';
export declare enum CompanyStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    SUSPENDED = "SUSPENDED"
}
export declare enum SubscriptionPlan {
    FREE = "FREE",
    BASIC = "BASIC",
    PROFESSIONAL = "PROFESSIONAL",
    ENTERPRISE = "ENTERPRISE"
}
export declare class Company {
    id: string;
    code: string;
    name: string;
    legal_name?: string;
    tax_id?: string;
    registration_number?: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    website?: string;
    status: CompanyStatus;
    subscription_plan: SubscriptionPlan;
    subscription_start_date?: Date;
    subscription_end_date?: Date;
    max_employees: number;
    settings?: {
        timezone: string;
        currency: string;
        date_format: string;
        time_format: string;
        week_start: string;
        fiscal_year_start: string;
        default_language: string;
    };
    payroll_settings?: {
        overtime_multiplier: number;
        grace_in_minutes: number;
        grace_out_minutes: number;
        rounding_minutes: number;
        overtime_threshold_minutes: number;
    };
    created_at: Date;
    updated_at: Date;
    users: User[];
    holidays: Holiday[];
    departments: Department[];
    schedule_templates: ScheduleTemplate[];
}
