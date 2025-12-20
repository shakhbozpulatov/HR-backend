import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { Exclude } from 'class-transformer';
import { TariffType, UserRole } from '@/modules/users/entities/user.entity';

export class AdminCreateUserDto {
  // Explicitly exclude these fields - they are hard-coded in the service
  @Exclude()
  gender?: any;

  @Exclude()
  groupId?: any;

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
  @IsArray()
  @IsString({ each: true })
  accessLevelIdList?: string[];

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
  @IsUUID('4', { message: 'Invalid department ID format' })
  department_id?: string;

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
