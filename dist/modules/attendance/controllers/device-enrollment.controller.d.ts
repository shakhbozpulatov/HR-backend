import { UserDeviceMappingService } from '@/modules/attendance';
import { EnrollUserDto } from '../dto';
import { EnrollmentStatus } from '@/modules/attendance';
export declare class DeviceEnrollmentController {
    private readonly mappingService;
    constructor(mappingService: UserDeviceMappingService);
    enrollUser(enrollDto: EnrollUserDto, actorId: string): Promise<{
        success: boolean;
        data: import("@/modules/attendance").UserDeviceMapping;
        message: string;
    }>;
    getMapping(terminalUserId: string, deviceId: string): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: import("@/modules/attendance").UserDeviceMapping;
        message?: undefined;
    }>;
    getUserMappings(userId: string): Promise<{
        success: boolean;
        data: import("@/modules/attendance").UserDeviceMapping[];
        total: number;
    }>;
    getDeviceMappings(deviceId: string): Promise<{
        success: boolean;
        data: import("@/modules/attendance").UserDeviceMapping[];
        total: number;
    }>;
    updateEnrollmentStatus(mappingId: string, status: EnrollmentStatus, metadata?: any): Promise<{
        success: boolean;
        data: import("@/modules/attendance").UserDeviceMapping;
        message: string;
    }>;
    updateBiometric(mappingId: string, data: {
        fingerprint_enrolled?: boolean;
        fingerprint_count?: number;
        face_enrolled?: boolean;
    }): Promise<{
        success: boolean;
        data: import("@/modules/attendance").UserDeviceMapping;
        message: string;
    }>;
    deactivateMapping(mappingId: string): Promise<void>;
    reactivateMapping(mappingId: string): Promise<{
        success: boolean;
        data: import("@/modules/attendance").UserDeviceMapping;
        message: string;
    }>;
    syncMapping(mappingId: string, metadata?: any): Promise<{
        success: boolean;
        data: import("@/modules/attendance").UserDeviceMapping;
        message: string;
    }>;
    bulkEnroll(data: {
        device_id: string;
        user_ids: string[];
        auto_generate_terminal_id?: boolean;
    }, actorId: string): Promise<{
        success: boolean;
        data: {
            success: import("@/modules/attendance").UserDeviceMapping[];
            failed: Array<{
                user_id: string;
                error: string;
            }>;
        };
        message: string;
    }>;
}
