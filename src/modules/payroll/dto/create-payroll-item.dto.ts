import { IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';
import {
  PayrollItemType,
  PayrollItemCode,
  PayrollItemSource,
} from '../entities/payroll-item.entity';

export class CreatePayrollItemDto {
  @IsString()
  employee_id: string;

  @IsEnum(PayrollItemType)
  type: PayrollItemType;

  @IsEnum(PayrollItemCode)
  code: PayrollItemCode;

  @IsNumber()
  quantity: number;

  @IsNumber()
  rate: number;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(PayrollItemSource)
  source?: PayrollItemSource;
}
