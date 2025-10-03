import { UserRole } from '@/modules/users/entities/user.entity';
export declare class AdminCreateUserDto {
    email: string;
    role: UserRole;
    company_id?: string;
    employee_id?: string;
}
