import { Repository } from 'typeorm';
import { UserDeviceMapping, EnrollmentStatus } from '@/modules/attendance';
export declare class UserDeviceMappingService {
    private mappingRepository;
    private readonly logger;
    constructor(mappingRepository: Repository<UserDeviceMapping>);
    enrollUser(enrollDto: any, actorId: string): Promise<UserDeviceMapping>;
    private generateTerminalUserId;
    getMapping(terminalUserId: string, deviceId: string): Promise<UserDeviceMapping | null>;
    getUserMappings(userId: string): Promise<UserDeviceMapping[]>;
    getDeviceMappings(deviceId: string): Promise<UserDeviceMapping[]>;
    updateEnrollmentStatus(mappingId: string, status: EnrollmentStatus, metadata?: any): Promise<UserDeviceMapping>;
    updateBiometric(mappingId: string, data: {
        fingerprint_enrolled?: boolean;
        fingerprint_count?: number;
        face_enrolled?: boolean;
    }): Promise<UserDeviceMapping>;
    deactivateMapping(mappingId: string): Promise<void>;
    reactivateMapping(mappingId: string): Promise<UserDeviceMapping>;
    updateSyncStatus(mappingId: string, metadata?: any): Promise<UserDeviceMapping>;
    bulkEnroll(deviceId: string, userIds: string[], actorId: string, autoGenerateTerminalId?: boolean): Promise<{
        success: UserDeviceMapping[];
        failed: Array<{
            user_id: string;
            error: string;
        }>;
    }>;
    deleteMapping(mappingId: string): Promise<void>;
    getMappingById(mappingId: string): Promise<UserDeviceMapping>;
    isUserEnrolled(userId: string, deviceId: string): Promise<boolean>;
    getDeviceEnrollmentStats(deviceId: string): Promise<{
        total: number;
        active: number;
        inactive: number;
        pending: number;
        completed: number;
        failed: number;
    }>;
    getUserEnrollmentStats(userId: string): Promise<{
        total_devices: number;
        active_devices: number;
        pending_devices: number;
    }>;
}
