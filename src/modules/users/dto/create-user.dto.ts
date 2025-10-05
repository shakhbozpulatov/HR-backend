import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  IsDateString,
  ValidateIf,
  IsNumber,
  IsPositive,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { TariffType, UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsBoolean()
  active?: boolean = true;

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
  @IsUUID()
  department_id?: string; // ✅ shu yerda string emas, UUID

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsUUID()
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
