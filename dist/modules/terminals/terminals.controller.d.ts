import { TerminalsService } from './terminals.service';
import { DeviceStatus } from './entities/terminal-device.entity';
export declare class TerminalsController {
    private readonly terminalsService;
    constructor(terminalsService: TerminalsService);
    getAllDevices(): Promise<import("./entities/terminal-device.entity").TerminalDevice[]>;
    getDevice(id: string): Promise<import("./entities/terminal-device.entity").TerminalDevice>;
    createDevice(deviceData: any): Promise<import("./entities/terminal-device.entity").TerminalDevice>;
    updateDeviceStatus(id: string, statusData: {
        status: DeviceStatus;
    }): Promise<import("./entities/terminal-device.entity").TerminalDevice>;
}
