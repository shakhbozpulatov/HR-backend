import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { UserRole } from '@/modules/users/entities/user.entity';

export class AdminCreateUserDto {
  @IsEnum(UserRole, { message: 'Invalid user role' })
  role: UserRole;

  @IsOptional()
  @IsUUID('4', { message: 'Invalid company ID format' })
  company_id?: string;

  @IsUUID('4', { message: 'Invalid employee ID format' })
  employee_id: string;
}
