import { IsOptional, IsDateString, IsString } from 'class-validator';

/**
 * DTO for getting user attendance by user_id
 */
export class GetUserAttendanceDto {
  @IsString()
  user_id: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;
}

/**
 * Response DTO for user attendance
 */
export class UserAttendanceResponseDto {
  userId: string;
  userName: string;
  attendance: Array<{
    eventId: string;
    eventType: 'CLOCK_IN' | 'CLOCK_OUT';
    timestamp: string;
    timestampLocal: string;
  }>;
}