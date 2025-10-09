export declare enum DeviceStatus {
    ONLINE = "online",
    OFFLINE = "offline",
    DISCONNECTED = "disconnected",
    MAINTENANCE = "maintenance",
    ERROR = "error"
}
export declare class DeviceStatusDto {
    device_id: string;
    status: DeviceStatus;
    last_seen?: string;
    ip_address?: string;
    firmware_version?: string;
    battery_level?: number;
    health_metrics?: {
        cpu_usage?: number;
        memory_usage?: number;
        storage_usage?: number;
        temperature?: number;
    };
}
