import { IsOptional, IsDateString, IsEnum, IsUUID } from 'class-validator';

/**
 * Query parameters for dashboard statistics endpoint
 */
export class DashboardStatisticsDto {
  @IsOptional()
  @IsDateString()
  date?: string; // defaults to today

  @IsOptional()
  @IsUUID()
  company_id?: string;
}

/**
 * Period enum for attendance statistics
 */
export enum StatsPeriod {
  ONE_MONTH = '1m',
  THREE_MONTHS = '3m',
  SIX_MONTHS = '6m',
}

/**
 * Query parameters for attendance statistics endpoint
 */
export class AttendanceStatsDto {
  @IsEnum(StatsPeriod)
  period: StatsPeriod = StatsPeriod.ONE_MONTH;

  @IsOptional()
  @IsUUID()
  company_id?: string;
}

/**
 * Query parameters for exceptions endpoint
 */
export class ExceptionsDto {
  @IsOptional()
  @IsDateString()
  date?: string; // defaults to today, also accepts 'tomorrow'

  @IsOptional()
  @IsUUID()
  company_id?: string;

  @IsOptional()
  @IsUUID()
  department_id?: string;
}
