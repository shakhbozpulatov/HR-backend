import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PeriodStatus } from '../entities/payroll-period.entity';

export class PayrollFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsEnum(PeriodStatus)
  status?: PeriodStatus;

  @IsOptional()
  @IsString()
  period_id?: string;
}
