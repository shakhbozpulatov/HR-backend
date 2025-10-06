import { TerminalsService } from './terminals.service';
import { CreateTerminalDto } from './dto/create-terminal.dto';
import { UpdateTerminalStatusDto } from './dto/update-terminal-status.dto';
export declare class TerminalsController {
    private readonly terminalsService;
    constructor(terminalsService: TerminalsService);
    getAllDevices(user: any): Promise<import("./entities/terminal-device.entity").TerminalDevice[]>;
    getDevice(id: string, user: any): Promise<import("./entities/terminal-device.entity").TerminalDevice>;
    createDevice(deviceData: CreateTerminalDto, user: any): Promise<import("./entities/terminal-device.entity").TerminalDevice>;
    updateDeviceStatus(id: string, statusData: UpdateTerminalStatusDto, user: any): Promise<import("./entities/terminal-device.entity").TerminalDevice>;
}
