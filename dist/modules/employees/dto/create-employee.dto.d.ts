import { TariffType } from '../entities/employee.entity';
export declare class CreateEmployeeDto {
    first_name: string;
    last_name: string;
    middle_name?: string;
    email: string;
    dob?: string;
    phone?: string;
    department?: string;
    location?: string;
    manager_id?: string;
    position?: string;
    start_date: string;
    end_date?: string;
    tariff_type: TariffType;
    hourly_rate?: number;
    monthly_salary?: number;
}
