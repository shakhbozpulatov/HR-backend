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
exports.AttendanceRecordsController = void 0;
const common_1 = require("@nestjs/common");
const attendance_1 = require("..");
const dto_1 = require("../dto");
const auth_guard_1 = require("../../../common/guards/auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const user_entity_1 = require("../../users/entities/user.entity");
let AttendanceRecordsController = class AttendanceRecordsController {
    constructor(recordsService) {
        this.recordsService = recordsService;
    }
    async getRecords(filterDto) {
        return await this.recordsService.findAll(filterDto);
    }
    async getTimesheet(filterDto) {
        const result = await this.recordsService.getTimesheetGrid(filterDto);
        return {
            success: true,
            data: result,
        };
    }
    async getAttendanceSummary(userId, from, to) {
        const summary = await this.recordsService.getAttendanceSummary(userId, new Date(from), new Date(to));
        return {
            success: true,
            data: summary,
        };
    }
    async getRecord(userId, date) {
        const record = await this.recordsService.findOne(userId, new Date(date));
        return {
            success: true,
            data: record,
        };
    }
    async createAdjustment(userId, date, adjustmentDto, actorId) {
        const record = await this.recordsService.createManualAdjustment(userId, new Date(date), adjustmentDto, actorId);
        return {
            success: true,
            data: record,
            message: 'Manual adjustment created successfully',
        };
    }
    async approveRecord(userId, date, approvalDto, actorId) {
        const record = await this.recordsService.approveRecord(userId, new Date(date), approvalDto, actorId);
        return {
            success: true,
            data: record,
            message: 'Record approved successfully',
        };
    }
    async unlockRecord(userId, date, actorId) {
        const record = await this.recordsService.unlockRecord(userId, new Date(date), actorId);
        return {
            success: true,
            data: record,
            message: 'Record unlocked successfully',
        };
    }
    async reprocessRecord(userId, date) {
        await this.recordsService.reprocessRecord(userId, new Date(date));
        return {
            success: true,
            message: 'Record queued for reprocessing',
        };
    }
    async exportRecords(filterDto) {
        const buffer = await this.recordsService.exportToExcel(filterDto);
        return {
            success: true,
            filename: `attendance-export-${Date.now()}.xlsx`,
            data: buffer.toString('base64'),
            message: 'Export generated successfully',
        };
    }
    async bulkApprove(data, actorId) {
        return {
            success: true,
            message: `${data.record_ids.length} records approved successfully`,
        };
    }
    async getPendingApprovals(filterDto) {
        const modifiedFilter = { ...filterDto, requires_approval: true };
        return await this.recordsService.findAll(modifiedFilter);
    }
};
exports.AttendanceRecordsController = AttendanceRecordsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER, user_entity_1.UserRole.PAYROLL, user_entity_1.UserRole.MANAGER),
    __param(0, (0, common_1.Query)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.AttendanceFilterDto]),
    __metadata("design:returntype", Promise)
], AttendanceRecordsController.prototype, "getRecords", null);
__decorate([
    (0, common_1.Get)('timesheet'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER, user_entity_1.UserRole.MANAGER),
    __param(0, (0, common_1.Query)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.AttendanceFilterDto]),
    __metadata("design:returntype", Promise)
], AttendanceRecordsController.prototype, "getTimesheet", null);
__decorate([
    (0, common_1.Get)(':userId/summary'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER, user_entity_1.UserRole.MANAGER),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AttendanceRecordsController.prototype, "getAttendanceSummary", null);
__decorate([
    (0, common_1.Get)(':userId/:date'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER, user_entity_1.UserRole.PAYROLL, user_entity_1.UserRole.MANAGER),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AttendanceRecordsController.prototype, "getRecord", null);
__decorate([
    (0, common_1.Post)(':userId/:date/adjustments'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('date')),
    __param(2, (0, common_1.Body)(common_1.ValidationPipe)),
    __param(3, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.ManualAdjustmentDto, String]),
    __metadata("design:returntype", Promise)
], AttendanceRecordsController.prototype, "createAdjustment", null);
__decorate([
    (0, common_1.Post)(':userId/:date/approve'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER, user_entity_1.UserRole.MANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('date')),
    __param(2, (0, common_1.Body)(common_1.ValidationPipe)),
    __param(3, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.ApprovalDto, String]),
    __metadata("design:returntype", Promise)
], AttendanceRecordsController.prototype, "approveRecord", null);
__decorate([
    (0, common_1.Post)(':userId/:date/unlock'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('date')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AttendanceRecordsController.prototype, "unlockRecord", null);
__decorate([
    (0, common_1.Post)(':userId/:date/reprocess'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AttendanceRecordsController.prototype, "reprocessRecord", null);
__decorate([
    (0, common_1.Post)('export'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER, user_entity_1.UserRole.PAYROLL),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.AttendanceFilterDto]),
    __metadata("design:returntype", Promise)
], AttendanceRecordsController.prototype, "exportRecords", null);
__decorate([
    (0, common_1.Post)('bulk-approve'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AttendanceRecordsController.prototype, "bulkApprove", null);
__decorate([
    (0, common_1.Get)('pending-approval'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER, user_entity_1.UserRole.MANAGER),
    __param(0, (0, common_1.Query)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.AttendanceFilterDto]),
    __metadata("design:returntype", Promise)
], AttendanceRecordsController.prototype, "getPendingApprovals", null);
exports.AttendanceRecordsController = AttendanceRecordsController = __decorate([
    (0, common_1.Controller)('attendance/records'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(common_1.ClassSerializerInterceptor),
    __metadata("design:paramtypes", [attendance_1.AttendanceRecordsService])
], AttendanceRecordsController);
//# sourceMappingURL=attendance-records.controller.js.map