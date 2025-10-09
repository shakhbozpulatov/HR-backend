import { AttendanceStatus } from '@/modules/attendance/entities/attendance-record.entity';
import {
  EventType,
  ProcessingStatus,
} from '@/modules/attendance/entities/attendance-event.entity';

export class AttendanceEventResponseDto {
  event_id: string;
  user_id?: string;
  terminal_user_id?: string;
  device_id: string;
  event_type: EventType;
  event_source: EventSource;
  ts_local: Date;
  processing_status: ProcessingStatus;
  created_at: Date;
}

export class AttendanceRecordResponseDto {
  record_id: string;
  user_id: string;
  date: Date;
  status: AttendanceStatus;
  worked_minutes: number;
  late_minutes: number;
  early_leave_minutes: number;
  overtime_minutes: number;
  first_clock_in?: string;
  last_clock_out?: string;
  is_locked: boolean;
  requires_approval: boolean;
  created_at: Date;
  updated_at: Date;
}

export class PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class AttendanceSummaryDto {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  total_worked_minutes: number;
  total_late_minutes: number;
  total_overtime_minutes: number;
  average_daily_minutes: number;
}
