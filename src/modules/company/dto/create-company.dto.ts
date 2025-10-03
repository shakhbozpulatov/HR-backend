import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';
import { SubscriptionPlan } from '../entities/company.entity';

export class CreateCompanyDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  legal_name?: string;

  @IsOptional()
  @IsString()
  tax_id?: string;

  @IsOptional()
  @IsString()
  registration_number?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsEnum(SubscriptionPlan)
  subscription_plan?: SubscriptionPlan;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_employees?: number;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class CreateDepartmentDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  manager_id?: string;

  @IsOptional()
  @IsString()
  parent_department_id?: string;
}
