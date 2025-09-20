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
exports.AttendanceEventsController = void 0;
const common_1 = require("@nestjs/common");
const attendance_events_service_1 = require("./attendance-events.service");
const attendance_filter_dto_1 = require("./dto/attendance-filter.dto");
const auth_guard_1 = require("../../common/guards/auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const user_entity_1 = require("../users/entities/user.entity");
let AttendanceEventsController = class AttendanceEventsController {
    constructor(eventsService) {
        this.eventsService = eventsService;
    }
    async receiveWebhookEvent(eventData, idempotencyKey) {
        return await this.eventsService.processWebhookEvent(eventData, idempotencyKey);
    }
    async receiveDeviceStatus(statusData) {
        return await this.eventsService.updateDeviceStatus(statusData);
    }
    async getEvents(filterDto) {
        return await this.eventsService.findAll(filterDto);
    }
    async getQuarantinedEvents() {
        return await this.eventsService.getQuarantinedEvents();
    }
    async resolveQuarantinedEvent(eventId, resolveDto) {
        return await this.eventsService.resolveQuarantinedEvent(eventId, resolveDto.employee_id, 'admin');
    }
};
exports.AttendanceEventsController = AttendanceEventsController;
__decorate([
    (0, common_1.Post)('events'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AttendanceEventsController.prototype, "receiveWebhookEvent", null);
__decorate([
    (0, common_1.Post)('device-status'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceEventsController.prototype, "receiveDeviceStatus", null);
__decorate([
    (0, common_1.Get)('events'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER, user_entity_1.UserRole.MANAGER),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendance_filter_dto_1.AttendanceFilterDto]),
    __metadata("design:returntype", Promise)
], AttendanceEventsController.prototype, "getEvents", null);
__decorate([
    (0, common_1.Get)('quarantine'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttendanceEventsController.prototype, "getQuarantinedEvents", null);
__decorate([
    (0, common_1.Post)('quarantine/:eventId/resolve'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    __param(0, (0, common_1.Param)('eventId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceEventsController.prototype, "resolveQuarantinedEvent", null);
exports.AttendanceEventsController = AttendanceEventsController = __decorate([
    (0, common_1.Controller)('terminals'),
    __metadata("design:paramtypes", [attendance_events_service_1.AttendanceEventsService])
], AttendanceEventsController);
//# sourceMappingURL=attendance-events.controller.js.map