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
exports.ScheduleAssignmentsController = void 0;
const common_1 = require("@nestjs/common");
const schedule_assignments_service_1 = require("./schedule-assignments.service");
const create_assignment_dto_1 = require("./dto/create-assignment.dto");
const update_user_assignment_dto_1 = require("./dto/update-user-assignment.dto");
const create_exception_dto_1 = require("./dto/create-exception.dto");
const auth_guard_1 = require("../../common/guards/auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const user_entity_1 = require("../users/entities/user.entity");
let ScheduleAssignmentsController = class ScheduleAssignmentsController {
    constructor(assignmentsService) {
        this.assignmentsService = assignmentsService;
    }
    async createAssignment(createAssignmentDto, req) {
        return await this.assignmentsService.createAssignment(createAssignmentDto, req.user);
    }
    async getEmployeeAssignments(userId, req) {
        return await this.assignmentsService.findEmployeeAssignments(userId, req.user);
    }
    async updateTemplate(updateTemplateDto, req) {
        return await this.assignmentsService.updateTemplate(updateTemplateDto, req.user);
    }
    async addException(assignmentId, exception, req) {
        return await this.assignmentsService.addException(assignmentId, exception, req.user);
    }
};
exports.ScheduleAssignmentsController = ScheduleAssignmentsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_assignment_dto_1.CreateAssignmentDto, Object]),
    __metadata("design:returntype", Promise)
], ScheduleAssignmentsController.prototype, "createAssignment", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER, user_entity_1.UserRole.MANAGER),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ScheduleAssignmentsController.prototype, "getEmployeeAssignments", null);
__decorate([
    (0, common_1.Patch)('update-user-assignment'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_user_assignment_dto_1.UpdateUserAssignmentDto, Object]),
    __metadata("design:returntype", Promise)
], ScheduleAssignmentsController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Post)(':assignmentId/exceptions'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    __param(0, (0, common_1.Param)('assignmentId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_exception_dto_1.CreateExceptionDto, Object]),
    __metadata("design:returntype", Promise)
], ScheduleAssignmentsController.prototype, "addException", null);
exports.ScheduleAssignmentsController = ScheduleAssignmentsController = __decorate([
    (0, common_1.Controller)('schedule-assignments'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [schedule_assignments_service_1.ScheduleAssignmentsService])
], ScheduleAssignmentsController);
//# sourceMappingURL=schedule-assignments.controller.js.map