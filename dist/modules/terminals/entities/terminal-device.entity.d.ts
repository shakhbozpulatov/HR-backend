import { AttendanceEvent } from '@/modules/attendance/entities/attendance-event.entity';
import { Company } from '@/modules/company/entities/company.entity';
export declare enum DeviceStatus {
    ONLINE = "ONLINE",
    OFFLINE = "OFFLINE",
    MAINTENANCE = "MAINTENANCE"
}
export declare class TerminalDevice {
    id: string;
    company_id: string;
    name: string;
    location?: string;
    status: DeviceStatus;
    last_seen_at?: Date;
    vendor: string;
    metadata?: any;
    created_at: Date;
    updated_at: Date;
    company: Company;
    events: AttendanceEvent[];
}
