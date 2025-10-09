import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  Length,
  IsNumber,
  Min,
  IsObject,
} from 'class-validator';
import { AttendanceStatus } from '@/modules/attendance/entities/attendance-record.entity';

export enum AdjustmentType {
  CLOCK_TIME_EDIT = 'CLOCK_TIME_EDIT',
  MARK_ABSENT_PAID = 'MARK_ABSENT_PAID',
  MARK_ABSENT_UNPAID = 'MARK_ABSENT_UNPAID',
  OVERRIDE_STATUS = 'OVERRIDE_STATUS',
  ADD_MINUTES = 'ADD_MINUTES',
  REMOVE_MINUTES = 'REMOVE_MINUTES',
}

export class ManualAdjustmentDto {
  @IsEnum(AdjustmentType)
  type: AdjustmentType;

  @IsString()
  @Length(10, 500)
  reason: string;

  @IsOptional()
  @IsDateString()
  clock_in_time?: string;

  @IsOptional()
  @IsDateString()
  clock_out_time?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minutes?: number;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  new_status?: AttendanceStatus;

  @IsOptional()
  @IsObject()
  metadata?: any;
}
