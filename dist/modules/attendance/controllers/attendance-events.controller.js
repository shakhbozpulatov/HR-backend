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
const throttler_1 = require("@nestjs/throttler");
const attendance_1 = require("..");
const dto_1 = require("../dto");
const auth_guard_1 = require("../../../common/guards/auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const user_entity_1 = require("../../users/entities/user.entity");
let AttendanceEventsController = class AttendanceEventsController {
    constructor(eventsService) {
        this.eventsService = eventsService;
    }
    async receiveWebhookEvent(eventData, idempotencyKey, signature) {
        if (!idempotencyKey) {
            return {
                success: false,
                error: 'x-idempotency-key header is required',
            };
        }
        const event = await this.eventsService.processWebhookEvent(eventData, idempotencyKey, signature);
        return {
            success: true,
            data: event,
            message: event.user_id
                ? 'Event processed successfully'
                : 'Event quarantined - unknown user',
        };
    }
    async getEvents(filterDto) {
        return await this.eventsService.findAll(filterDto);
    }
    async getQuarantinedEvents() {
        const events = await this.eventsService.getQuarantinedEvents();
        return {
            success: true,
            data: events,
            total: events.length,
        };
    }
    async resolveQuarantinedEvent(eventId, resolveDto, actorId) {
        const event = await this.eventsService.resolveQuarantinedEvent(eventId, resolveDto, actorId);
        return {
            success: true,
            data: event,
            message: 'Event resolved and mapped successfully',
        };
    }
    async retryFailedEvents() {
        await this.eventsService.retryFailedEvents();
        return {
            success: true,
            message: 'Failed events queued for retry',
        };
    }
    async getEventById(eventId) {
        const event = await this.eventsService.findOne(eventId);
        return {
            success: true,
            data: event,
        };
    }
};
exports.AttendanceEventsController = AttendanceEventsController;
__decorate([
    (0, common_1.Post)(),
    (0, public_decorator_1.Public)(),
    (0, throttler_1.Throttle)({ short: { limit: 100, ttl: 60000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __param(1, (0, common_1.Headers)('x-idempotency-key')),
    __param(2, (0, common_1.Headers)('x-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.WebhookEventDto, String, String]),
    __metadata("design:returntype", Promise)
], AttendanceEventsController.prototype, "receiveWebhookEvent", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER, user_entity_1.UserRole.MANAGER),
    __param(0, (0, common_1.Query)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.AttendanceFilterDto]),
    __metadata("design:returntype", Promise)
], AttendanceEventsController.prototype, "getEvents", null);
__decorate([
    (0, common_1.Get)('quarantine'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttendanceEventsController.prototype, "getQuarantinedEvents", null);
__decorate([
    (0, common_1.Post)('quarantine/:eventId/resolve'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('eventId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __param(2, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.ResolveQuarantineDto, String]),
    __metadata("design:returntype", Promise)
], AttendanceEventsController.prototype, "resolveQuarantinedEvent", null);
__decorate([
    (0, common_1.Post)('retry-failed'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttendanceEventsController.prototype, "retryFailedEvents", null);
__decorate([
    (0, common_1.Get)(':eventId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    __param(0, (0, common_1.Param)('eventId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AttendanceEventsController.prototype, "getEventById", null);
exports.AttendanceEventsController = AttendanceEventsController = __decorate([
    (0, common_1.Controller)('attendance/events'),
    (0, common_1.UseInterceptors)(common_1.ClassSerializerInterceptor),
    __metadata("design:paramtypes", [attendance_1.AttendanceEventsService])
], AttendanceEventsController);
//# sourceMappingURL=attendance-events.controller.js.map