import { IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * DTO for fetching attendance events from HC
 */
export class FetchAttendanceEventsDto {
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  maxNumberPerTime: number;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;
}

/**
 * Work session within a day (entry/exit intervals)
 */
export class WorkSessionDto {
  entryTime: string;

  exitTime: string | null;
}

/**
 * User attendance summary for a day
 */
export class UserAttendanceSummaryDto {
  userId: string;

  userName: string;

  clockIn: string | null;

  clockOut: string | null;

  innerData: WorkSessionDto[];
}

/**
 * Pagination metadata
 */
export class PaginationMetadataDto {
  page: number;

  limit: number;

  total: number;

  totalPages: number;
}

/**
 * Response DTO for fetching attendance events
 */
export class FetchAttendanceEventsResponseDto {
  data: UserAttendanceSummaryDto[];
  message?: string;
  pagination: PaginationMetadataDto;
}

export class GetEventsDto {
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  userId?: string; // Filter by user_id (HC person ID from events table, matches hcPersonId in users table)
}

/**
 * Daily attendance record for an employee
 */
export class DailyAttendanceDto {
  date: string; // Format: YYYY-MM-DD

  startTime: string | null; // Format: HH:mm

  endTime: string | null; // Format: HH:mm
}

/**
 * Employee attendance data with all dates in range
 */
export class EmployeeAttendanceDto {
  id: string; // User ID

  name: string; // Full name

  personId: string; // HC person ID

  phone: string | null; // Phone number

  attendance: DailyAttendanceDto[]; // Array of daily attendance for date range
}

/**
 * Response DTO for get-events endpoint grouped by employees
 */
export class GetEventsResponseDto {
  employees: EmployeeAttendanceDto[];

  pagination: PaginationMetadataDto;
}
