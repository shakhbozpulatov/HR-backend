import { AttendanceEvent } from '@/modules/attendance/entities/attendance-event.entity';
export declare enum DeviceStatus {
    ONLINE = "ONLINE",
    OFFLINE = "OFFLINE",
    MAINTENANCE = "MAINTENANCE"
}
export declare class TerminalDevice {
    device_id: string;
    name: string;
    location?: string;
    status: DeviceStatus;
    last_seen_at?: Date;
    vendor: string;
    metadata?: any;
    created_at: Date;
    updated_at: Date;
    events: AttendanceEvent[];
}
