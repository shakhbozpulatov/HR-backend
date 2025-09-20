import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum AdjustmentType {
  CLOCK_TIME_EDIT = 'CLOCK_TIME_EDIT',
  MARK_ABSENT_PAID = 'MARK_ABSENT_PAID',
  MARK_ABSENT_UNPAID = 'MARK_ABSENT_UNPAID',
}

export class ManualAdjustmentDto {
  @IsEnum(AdjustmentType)
  type: AdjustmentType;

  @IsString()
  reason: string;

  @IsOptional()
  @IsDateString()
  clock_in_time?: string;

  @IsOptional()
  @IsDateString()
  clock_out_time?: string;
}
