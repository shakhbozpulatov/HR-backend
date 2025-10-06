import { Repository } from 'typeorm';
import { TerminalDevice, DeviceStatus } from './entities/terminal-device.entity';
export declare class TerminalsService {
    private deviceRepository;
    constructor(deviceRepository: Repository<TerminalDevice>);
    findAll(companyId?: string): Promise<TerminalDevice[]>;
    findOne(id: string, companyId?: string): Promise<TerminalDevice>;
    create(deviceData: Partial<TerminalDevice>, companyId: string): Promise<TerminalDevice>;
    updateStatus(deviceId: string, status: DeviceStatus, companyId?: string): Promise<TerminalDevice>;
    getOnlineDevices(): Promise<TerminalDevice[]>;
    getOfflineDevices(): Promise<TerminalDevice[]>;
}
