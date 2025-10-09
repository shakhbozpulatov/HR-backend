"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceStatusController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const dto_1 = require("../dto");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const auth_guard_1 = require("../../../common/guards/auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const user_entity_1 = require("../../users/entities/user.entity");
let DeviceStatusController = class DeviceStatusController {
    async updateDeviceStatus(statusData) {
        console.log('Device status updated:', statusData);
        return {
            success: true,
            message: 'Device status updated successfully',
            data: {
                device_id: statusData.device_id,
                status: statusData.status,
                last_seen: statusData.last_seen || new Date().toISOString(),
            },
        };
    }
    async getDeviceStatus(deviceId) {
        return {
            success: true,
            data: {
                device_id: deviceId,
                status: dto_1.DeviceStatus.ONLINE,
                last_seen: new Date().toISOString(),
                ip_address: '192.168.1.100',
                firmware_version: '2.1.5',
                battery_level: 95,
                health_metrics: {
                    cpu_usage: 45,
                    memory_usage: 60,
                    storage_usage: 30,
                    temperature: 42,
                },
            },
        };
    }
    async getAllDevicesStatus(statusFilter, location) {
        const devices = [
            {
                device_id: 'device-001',
                device_name: 'Main Entrance',
                status: dto_1.DeviceStatus.ONLINE,
                location: 'Office Floor 1',
                last_seen: new Date().toISOString(),
            },
            {
                device_id: 'device-002',
                device_name: 'Warehouse Gate',
                status: dto_1.DeviceStatus.OFFLINE,
                location: 'Warehouse',
                last_seen: new Date(Date.now() - 3600000).toISOString(),
            },
        ];
        let filtered = devices;
        if (statusFilter) {
            filtered = filtered.filter((d) => d.status === statusFilter);
        }
        if (location) {
            filtered = filtered.filter((d) => d.location.toLowerCase().includes(location.toLowerCase()));
        }
        return {
            success: true,
            data: filtered,
            total: filtered.length,
            summary: {
                online: devices.filter((d) => d.status === dto_1.DeviceStatus.ONLINE).length,
                offline: devices.filter((d) => d.status === dto_1.DeviceStatus.OFFLINE)
                    .length,
                disconnected: devices.filter((d) => d.status === dto_1.DeviceStatus.DISCONNECTED).length,
                maintenance: devices.filter((d) => d.status === dto_1.DeviceStatus.MAINTENANCE).length,
                error: devices.filter((d) => d.status === dto_1.DeviceStatus.ERROR).length,
            },
        };
    }
    async deviceHeartbeat(deviceId, data) {
        console.log(`Heartbeat from device ${deviceId}`, data);
        return {
            success: true,
            message: 'Heartbeat received',
            timestamp: new Date().toISOString(),
        };
    }
    async getDeviceHealth(deviceId) {
        return {
            success: true,
            data: {
                device_id: deviceId,
                health_status: 'good',
                metrics: {
                    cpu_usage: 45,
                    memory_usage: 60,
                    storage_usage: 30,
                    temperature: 42,
                    network_latency_ms: 25,
                    uptime_hours: 168,
                },
                last_reboot: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
                firmware_version: '2.1.5',
                alerts: [],
            },
        };
    }
    async rebootDevice(deviceId) {
        console.log(`Reboot command sent to device ${deviceId}`);
        return {
            success: true,
            message: 'Reboot command sent to device',
            device_id: deviceId,
        };
    }
    async getDeviceLogs(deviceId, limit = 100, level) {
        const logs = [
            {
                timestamp: new Date().toISOString(),
                level: 'info',
                message: 'User verification successful',
                metadata: { user_id: 42 },
            },
            {
                timestamp: new Date(Date.now() - 60000).toISOString(),
                level: 'warn',
                message: 'Low memory warning',
                metadata: { memory_usage: 85 },
            },
        ];
        return {
            success: true,
            data: logs,
            total: logs.length,
            device_id: deviceId,
        };
    }
    async updateDeviceConfig(deviceId, config) {
        console.log(`Updating config for device ${deviceId}`, config);
        return {
            success: true,
            message: 'Configuration update sent to device',
            device_id: deviceId,
        };
    }
};
exports.DeviceStatusController = DeviceStatusController;
__decorate([
    (0, common_1.Post)('status'),
    (0, public_decorator_1.Public)(),
    (0, throttler_1.Throttle)({ short: { limit: 50, ttl: 60000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.DeviceStatusDto]),
    __metadata("design:returntype", Promise)
], DeviceStatusController.prototype, "updateDeviceStatus", null);
__decorate([
    (0, common_1.Get)(':deviceId/status'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    __param(0, (0, common_1.Param)('deviceId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceStatusController.prototype, "getDeviceStatus", null);
__decorate([
    (0, common_1.Get)('status/all'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('location')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DeviceStatusController.prototype, "getAllDevicesStatus", null);
__decorate([
    (0, common_1.Post)(':deviceId/heartbeat'),
    (0, public_decorator_1.Public)(),
    (0, throttler_1.Throttle)({ short: { limit: 120, ttl: 60000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('deviceId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DeviceStatusController.prototype, "deviceHeartbeat", null);
__decorate([
    (0, common_1.Get)(':deviceId/health'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('deviceId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceStatusController.prototype, "getDeviceHealth", null);
__decorate([
    (0, common_1.Post)(':deviceId/reboot'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Param)('deviceId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceStatusController.prototype, "rebootDevice", null);
__decorate([
    (0, common_1.Get)(':deviceId/logs'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('deviceId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('level')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String]),
    __metadata("design:returntype", Promise)
], DeviceStatusController.prototype, "getDeviceLogs", null);
__decorate([
    (0, common_1.Post)(':deviceId/config'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('deviceId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DeviceStatusController.prototype, "updateDeviceConfig", null);
exports.DeviceStatusController = DeviceStatusController = __decorate([
    (0, common_1.Controller)('attendance/devices')
], DeviceStatusController);
//# sourceMappingURL=device-status.controller.js.map