import { DeviceStatus } from '../entities/terminal-device.entity';
export declare class CreateTerminalDto {
    company_id?: string;
    name: string;
    location?: string;
    status?: DeviceStatus;
    vendor: string;
    metadata?: any;
}
