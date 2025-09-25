import { UserRole } from '@/modules/users/entities/user.entity';
export declare class RegisterDto {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    phone?: string;
    department?: string;
    position?: string;
    employee_code?: string;
}
export declare class AdminRegisterDto extends RegisterDto {
    role: UserRole;
    employee_id?: string;
}
