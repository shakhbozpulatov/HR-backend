import { AttendanceStatus } from '@/modules/attendance/entities/attendance-record.entity';
import { ProcessingStatus } from '../entities/attendance-event.entity';
export declare enum ExportFormat {
    EXCEL = "excel",
    CSV = "csv",
    PDF = "pdf",
    JSON = "json"
}
export declare class AttendanceFilterDto {
    page?: number;
    limit?: number;
    user_id?: string;
    user_ids?: string[];
    device_id?: string;
    from?: string;
    to?: string;
    status?: AttendanceStatus;
    statuses?: AttendanceStatus[];
    is_locked?: boolean;
    requires_approval?: boolean;
    department?: string;
    processing_status?: ProcessingStatus;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
}
export declare class ExportAttendanceDto extends AttendanceFilterDto {
    format: ExportFormat;
    columns?: string[];
    include_summary?: boolean;
    timezone?: string;
}
