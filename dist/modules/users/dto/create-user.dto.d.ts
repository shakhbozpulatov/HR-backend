import { TariffType, UserRole } from '../entities/user.entity';
export declare class CreateUserDto {
    email: string;
    password: string;
    role: UserRole;
    active?: boolean;
    first_name: string;
    last_name: string;
    middle_name?: string;
    dob?: string;
    phone?: string;
    department_id?: string;
    location?: string;
    manager_id?: string;
    position?: string;
    start_date: string;
    end_date?: string;
    tariff_type: TariffType;
    hourly_rate?: number;
    monthly_salary?: number;
}
