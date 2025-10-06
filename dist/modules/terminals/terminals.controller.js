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
exports.TerminalsController = void 0;
const common_1 = require("@nestjs/common");
const terminals_service_1 = require("./terminals.service");
const auth_guard_1 = require("../../common/guards/auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const create_terminal_dto_1 = require("./dto/create-terminal.dto");
const update_terminal_status_dto_1 = require("./dto/update-terminal-status.dto");
let TerminalsController = class TerminalsController {
    constructor(terminalsService) {
        this.terminalsService = terminalsService;
    }
    async getAllDevices(user) {
        const companyId = user.role === user_entity_1.UserRole.SUPER_ADMIN ? undefined : user.company_id;
        return await this.terminalsService.findAll(companyId);
    }
    async getDevice(id, user) {
        const companyId = user.role === user_entity_1.UserRole.SUPER_ADMIN ? undefined : user.company_id;
        return await this.terminalsService.findOne(id, companyId);
    }
    async createDevice(deviceData, user) {
        const companyId = deviceData.company_id || user.company_id;
        return await this.terminalsService.create(deviceData, companyId);
    }
    async updateDeviceStatus(id, statusData, user) {
        const companyId = user.role === user_entity_1.UserRole.SUPER_ADMIN ? undefined : user.company_id;
        return await this.terminalsService.updateStatus(id, statusData.status, companyId);
    }
};
exports.TerminalsController = TerminalsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TerminalsController.prototype, "getAllDevices", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TerminalsController.prototype, "getDevice", null);
__decorate([
    (0, common_1.Post)(''),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_terminal_dto_1.CreateTerminalDto, Object]),
    __metadata("design:returntype", Promise)
], TerminalsController.prototype, "createDevice", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_terminal_status_dto_1.UpdateTerminalStatusDto, Object]),
    __metadata("design:returntype", Promise)
], TerminalsController.prototype, "updateDeviceStatus", null);
exports.TerminalsController = TerminalsController = __decorate([
    (0, common_1.Controller)('terminals'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [terminals_service_1.TerminalsService])
], TerminalsController);
//# sourceMappingURL=terminals.controller.js.map