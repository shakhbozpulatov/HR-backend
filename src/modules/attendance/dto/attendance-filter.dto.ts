import {
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsUUID,
  IsArray,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AttendanceStatus } from '@/modules/attendance/entities/attendance-record.entity';
import { ProcessingStatus } from '../entities/attendance-event.entity';

export enum ExportFormat {
  EXCEL = 'excel',
  CSV = 'csv',
  PDF = 'pdf',
  JSON = 'json',
}

export class AttendanceFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @IsUUID()
  user_id?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  user_ids?: string[];

  @IsOptional()
  @IsString()
  @IsUUID()
  device_id?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsArray()
  @IsEnum(AttendanceStatus, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  statuses?: AttendanceStatus[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_locked?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  requires_approval?: boolean;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsEnum(ProcessingStatus)
  processing_status?: ProcessingStatus;

  @IsOptional()
  @IsString()
  sort_by?: string = 'date';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}

export class ExportAttendanceDto extends AttendanceFilterDto {
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  columns?: string[];

  @IsOptional()
  @IsBoolean()
  include_summary?: boolean = true;

  @IsOptional()
  @IsString()
  timezone?: string;
}
