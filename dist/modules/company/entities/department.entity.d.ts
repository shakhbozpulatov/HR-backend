import { Company } from '@/modules/company/entities/company.entity';
import { Employee } from '@/modules/employees/entities/employee.entity';
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
    employees: Employee[];
    parent_department?: Department;
    sub_departments: Department[];
}
