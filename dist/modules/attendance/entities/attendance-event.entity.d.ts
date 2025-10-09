import { TerminalDevice } from '@/modules/terminals/entities/terminal-device.entity';
import { User } from '@/modules/users/entities/user.entity';
export declare enum EventType {
    CLOCK_IN = "clock_in",
    CLOCK_OUT = "clock_out"
}
export declare enum EventSource {
    BIOMETRIC_DEVICE = "biometric_device",
    MOBILE_APP = "mobile_app",
    WEB_APP = "web_app",
    MANUAL_ENTRY = "manual_entry",
    IMPORTED = "imported"
}
export declare enum ProcessingStatus {
    PENDING = "pending",
    PROCESSED = "processed",
    FAILED = "failed",
    QUARANTINED = "quarantined"
}
export declare class AttendanceEvent {
    event_id: string;
    user_id?: string;
    terminal_user_id?: string;
    device_id: string;
    event_type: EventType;
    event_source: EventSource;
    ts_utc: Date;
    ts_local: Date;
    source_payload?: any;
    ingestion_idempotency_key: string;
    signature_valid: boolean;
    signature_hash?: string;
    processing_status: ProcessingStatus;
    processed_at?: Date;
    processing_error?: string;
    retry_count: number;
    resolved_by?: string;
    resolved_at?: Date;
    created_at: Date;
    updated_at: Date;
    user?: User;
    device: TerminalDevice;
}
