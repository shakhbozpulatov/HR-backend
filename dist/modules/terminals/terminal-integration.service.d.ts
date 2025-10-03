import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { TerminalDevice } from './entities/terminal-device.entity';
import { User } from '@/modules/users/entities/user.entity';
interface CreateTerminalUserRequest {
    display_name: string;
    terminal_user_external_id: string;
}
export declare class TerminalIntegrationService {
    private deviceRepository;
    private userRepository;
    private configService;
    private readonly logger;
    private readonly vendorApiUrl;
    private readonly vendorApiKey;
    constructor(deviceRepository: Repository<TerminalDevice>, userRepository: Repository<User>, configService: ConfigService);
    createTerminalUser(request: CreateTerminalUserRequest): Promise<string>;
    updateTerminalUser(terminalUserId: string, updates: Partial<CreateTerminalUserRequest>): Promise<void>;
    deleteTerminalUser(terminalUserId: string): Promise<void>;
    syncTerminalUsers(): Promise<void>;
    pullMissedEvents(deviceId?: string, hours?: number): Promise<void>;
    dailySync(): Promise<void>;
    retryFailedOperations(): Promise<void>;
}
export {};
