import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { UserRole } from '@/modules/users/entities/user.entity';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsOptional()
  @IsString()
  middle_name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  position?: string;

  // Employee code for linking existing employee
  @IsOptional()
  @IsString()
  employee_code?: string;
}

export class AdminRegisterDto extends RegisterDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  employee_id?: string;
}
