import { Repository } from 'typeorm';
import { TerminalDevice, DeviceStatus } from './entities/terminal-device.entity';
export declare class TerminalsService {
    private deviceRepository;
    constructor(deviceRepository: Repository<TerminalDevice>);
    findAll(): Promise<TerminalDevice[]>;
    findOne(id: string): Promise<TerminalDevice>;
    create(deviceData: Partial<TerminalDevice>): Promise<TerminalDevice>;
    updateStatus(deviceId: string, status: DeviceStatus): Promise<TerminalDevice>;
    getOnlineDevices(): Promise<TerminalDevice[]>;
    getOfflineDevices(): Promise<TerminalDevice[]>;
}
