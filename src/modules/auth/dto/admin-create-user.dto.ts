import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { TariffType, UserRole } from '@/modules/users/entities/user.entity';

export class AdminCreateUserDto {
  @IsEnum(UserRole, { message: 'Invalid user role' })
  role: UserRole;

  @IsOptional()
  @IsUUID('4', { message: 'Invalid company ID format' })
  company_id?: string;

  @IsEmail()
  email: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsOptional()
  @IsString()
  middle_name?: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  manager_id?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsDateString()
  start_date: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsEnum(TariffType)
  tariff_type: TariffType;

  @ValidateIf((o) => o.tariff_type === TariffType.HOURLY)
  @IsNumber()
  @IsPositive()
  hourly_rate?: number;

  @ValidateIf((o) => o.tariff_type === TariffType.MONTHLY)
  @IsNumber()
  @IsPositive()
  monthly_salary?: number;
}
