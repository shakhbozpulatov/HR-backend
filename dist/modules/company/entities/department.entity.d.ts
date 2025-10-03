import { Company } from '@/modules/company/entities/company.entity';
import { User } from '@/modules/users/entities/user.entity';
export declare class Department {
    department_id: string;
    company_id: string;
    code: string;
    name: string;
    description?: string;
    manager_id?: string;
    parent_department_id?: string;
    active: boolean;
    created_at: Date;
    updated_at: Date;
    company: Company;
    users: User[];
    parent_department?: Department;
    sub_departments: Department[];
}
