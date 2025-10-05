import { SubscriptionPlan } from '../entities/company.entity';
export declare class CreateCompanyDto {
    code: string;
    name: string;
    legal_name?: string;
    tax_id?: string;
    registration_number?: string;
    address?: string;
    city?: string;
    country?: string;
    email?: string;
    phone?: string;
    website?: string;
    subscription_plan?: SubscriptionPlan;
    max_employees?: number;
    timezone?: string;
    currency?: string;
}
export declare class CreateDepartmentDto {
    code: string;
    name: string;
    company_id?: string;
    description?: string;
    manager_id?: string;
    parent_department_id?: string;
}
