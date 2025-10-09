import { DeviceStatusDto, DeviceStatus } from '../dto';
export declare class DeviceStatusController {
    updateDeviceStatus(statusData: DeviceStatusDto): Promise<{
        success: boolean;
        message: string;
        data: {
            device_id: string;
            status: DeviceStatus;
            last_seen: string;
        };
    }>;
    getDeviceStatus(deviceId: string): Promise<{
        success: boolean;
        data: {
            device_id: string;
            status: DeviceStatus;
            last_seen: string;
            ip_address: string;
            firmware_version: string;
            battery_level: number;
            health_metrics: {
                cpu_usage: number;
                memory_usage: number;
                storage_usage: number;
                temperature: number;
            };
        };
    }>;
    getAllDevicesStatus(statusFilter?: DeviceStatus, location?: string): Promise<{
        success: boolean;
        data: {
            device_id: string;
            device_name: string;
            status: DeviceStatus;
            location: string;
            last_seen: string;
        }[];
        total: number;
        summary: {
            online: number;
            offline: number;
            disconnected: number;
            maintenance: number;
            error: number;
        };
    }>;
    deviceHeartbeat(deviceId: string, data?: {
        ip_address?: string;
        firmware_version?: string;
    }): Promise<{
        success: boolean;
        message: string;
        timestamp: string;
    }>;
    getDeviceHealth(deviceId: string): Promise<{
        success: boolean;
        data: {
            device_id: string;
            health_status: string;
            metrics: {
                cpu_usage: number;
                memory_usage: number;
                storage_usage: number;
                temperature: number;
                network_latency_ms: number;
                uptime_hours: number;
            };
            last_reboot: string;
            firmware_version: string;
            alerts: any[];
        };
    }>;
    rebootDevice(deviceId: string): Promise<{
        success: boolean;
        message: string;
        device_id: string;
    }>;
    getDeviceLogs(deviceId: string, limit?: number, level?: 'error' | 'warn' | 'info' | 'debug'): Promise<{
        success: boolean;
        data: ({
            timestamp: string;
            level: string;
            message: string;
            metadata: {
                user_id: number;
                memory_usage?: undefined;
            };
        } | {
            timestamp: string;
            level: string;
            message: string;
            metadata: {
                memory_usage: number;
                user_id?: undefined;
            };
        })[];
        total: number;
        device_id: string;
    }>;
    updateDeviceConfig(deviceId: string, config: any): Promise<{
        success: boolean;
        message: string;
        device_id: string;
    }>;
}
