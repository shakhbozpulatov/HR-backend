import { Employee } from '@/modules/employees/entities/employee.entity';
import { TerminalDevice } from '@/modules/terminals/entities/terminal-device.entity';
export declare enum EventType {
    CLOCK_IN = "clock_in",
    CLOCK_OUT = "clock_out"
}
export declare class AttendanceEvent {
    event_id: string;
    employee_id?: string;
    terminal_user_id?: string;
    device_id: string;
    event_type: EventType;
    ts_utc: Date;
    ts_local: Date;
    source_payload?: any;
    ingestion_idempotency_key: string;
    signature_valid: boolean;
    created_at: Date;
    employee?: Employee;
    device: TerminalDevice;
}
