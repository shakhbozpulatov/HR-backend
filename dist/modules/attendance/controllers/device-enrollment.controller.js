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
exports.DeviceEnrollmentController = void 0;
const common_1 = require("@nestjs/common");
const attendance_1 = require("..");
const dto_1 = require("../dto");
const attendance_2 = require("..");
const auth_guard_1 = require("../../../common/guards/auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const user_entity_1 = require("../../users/entities/user.entity");
let DeviceEnrollmentController = class DeviceEnrollmentController {
    constructor(mappingService) {
        this.mappingService = mappingService;
    }
    async enrollUser(enrollDto, actorId) {
        const mapping = await this.mappingService.enrollUser(enrollDto, actorId);
        return {
            success: true,
            data: mapping,
            message: `User enrolled successfully. Terminal User ID: ${mapping.terminal_user_id}`,
        };
    }
    async getMapping(terminalUserId, deviceId) {
        const mapping = await this.mappingService.getMapping(terminalUserId, deviceId);
        if (!mapping) {
            return {
                success: false,
                message: 'Mapping not found',
            };
        }
        return {
            success: true,
            data: mapping,
        };
    }
    async getUserMappings(userId) {
        const mappings = await this.mappingService.getUserMappings(userId);
        return {
            success: true,
            data: mappings,
            total: mappings.length,
        };
    }
    async getDeviceMappings(deviceId) {
        const mappings = await this.mappingService.getDeviceMappings(deviceId);
        return {
            success: true,
            data: mappings,
            total: mappings.length,
        };
    }
    async updateEnrollmentStatus(mappingId, status, metadata) {
        const mapping = await this.mappingService.updateEnrollmentStatus(mappingId, status, metadata);
        return {
            success: true,
            data: mapping,
            message: 'Enrollment status updated successfully',
        };
    }
    async updateBiometric(mappingId, data) {
        const mapping = await this.mappingService.updateBiometric(mappingId, data);
        return {
            success: true,
            data: mapping,
            message: 'Biometric enrollment updated successfully',
        };
    }
    async deactivateMapping(mappingId) {
        await this.mappingService.deactivateMapping(mappingId);
    }
    async reactivateMapping(mappingId) {
        const mapping = await this.mappingService.reactivateMapping(mappingId);
        return {
            success: true,
            data: mapping,
            message: 'Mapping reactivated successfully',
        };
    }
    async syncMapping(mappingId, metadata) {
        const mapping = await this.mappingService.updateSyncStatus(mappingId, metadata);
        return {
            success: true,
            data: mapping,
            message: 'Mapping synced successfully',
        };
    }
    async bulkEnroll(data, actorId) {
        const results = await this.mappingService.bulkEnroll(data.device_id, data.user_ids, actorId, data.auto_generate_terminal_id);
        return {
            success: true,
            data: results,
            message: `${results.success.length} users enrolled successfully, ${results.failed.length} failed`,
        };
    }
};
exports.DeviceEnrollmentController = DeviceEnrollmentController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.EnrollUserDto, String]),
    __metadata("design:returntype", Promise)
], DeviceEnrollmentController.prototype, "enrollUser", null);
__decorate([
    (0, common_1.Get)(':terminalUserId/:deviceId'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    __param(0, (0, common_1.Param)('terminalUserId')),
    __param(1, (0, common_1.Param)('deviceId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DeviceEnrollmentController.prototype, "getMapping", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceEnrollmentController.prototype, "getUserMappings", null);
__decorate([
    (0, common_1.Get)('device/:deviceId'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    __param(0, (0, common_1.Param)('deviceId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceEnrollmentController.prototype, "getDeviceMappings", null);
__decorate([
    (0, common_1.Post)(':mappingId/status'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('mappingId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Body)('metadata')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], DeviceEnrollmentController.prototype, "updateEnrollmentStatus", null);
__decorate([
    (0, common_1.Post)(':mappingId/biometric'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('mappingId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DeviceEnrollmentController.prototype, "updateBiometric", null);
__decorate([
    (0, common_1.Delete)(':mappingId'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('mappingId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceEnrollmentController.prototype, "deactivateMapping", null);
__decorate([
    (0, common_1.Post)(':mappingId/reactivate'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('mappingId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceEnrollmentController.prototype, "reactivateMapping", null);
__decorate([
    (0, common_1.Post)(':mappingId/sync'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('mappingId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)('metadata')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DeviceEnrollmentController.prototype, "syncMapping", null);
__decorate([
    (0, common_1.Post)('bulk-enroll'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DeviceEnrollmentController.prototype, "bulkEnroll", null);
exports.DeviceEnrollmentController = DeviceEnrollmentController = __decorate([
    (0, common_1.Controller)('attendance/enrollment'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [attendance_1.UserDeviceMappingService])
], DeviceEnrollmentController);
//# sourceMappingURL=device-enrollment.controller.js.map