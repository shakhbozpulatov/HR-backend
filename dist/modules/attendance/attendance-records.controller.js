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
const attendance_records_service_1 = require("./attendance-records.service");
const attendance_filter_dto_1 = require("./dto/attendance-filter.dto");
const auth_guard_1 = require("../../common/guards/auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const user_entity_1 = require("../users/entities/user.entity");
let AttendanceRecordsController = class AttendanceRecordsController {
    constructor(recordsService) {
        this.recordsService = recordsService;
    }
    async getRecords(filterDto) {
        return await this.recordsService.findAll(filterDto);
    }
    async getRecord(employeeId, date) {
        return await this.recordsService.findOne(employeeId, new Date(date));
    }
    async createAdjustment(employeeId, date, adjustment) {
        return await this.recordsService.createManualAdjustment(employeeId, new Date(date), adjustment, 'admin');
    }
    async approveRecord(employeeId, date) {
        return await this.recordsService.approveRecord(employeeId, new Date(date), 'admin');
    }
    async getTimesheet(filterDto) {
        return await this.recordsService.getTimesheetGrid(filterDto);
    }
};
exports.AttendanceRecordsController = AttendanceRecordsController;
__decorate([
    (0, common_1.Get)('records'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER, user_entity_1.UserRole.PAYROLL, user_entity_1.UserRole.MANAGER),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendance_filter_dto_1.AttendanceFilterDto]),
    __metadata("design:returntype", Promise)
], AttendanceRecordsController.prototype, "getRecords", null);
__decorate([
    (0, common_1.Get)('records/:employeeId/:date'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER, user_entity_1.UserRole.PAYROLL, user_entity_1.UserRole.MANAGER),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Param)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AttendanceRecordsController.prototype, "getRecord", null);
__decorate([
    (0, common_1.Post)('records/:employeeId/:date/adjustments'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Param)('date')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceRecordsController.prototype, "createAdjustment", null);
__decorate([
    (0, common_1.Post)('records/:employeeId/:date/approve'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER, user_entity_1.UserRole.MANAGER),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Param)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AttendanceRecordsController.prototype, "approveRecord", null);
__decorate([
    (0, common_1.Get)('timesheet'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [attendance_filter_dto_1.AttendanceFilterDto]),
    __metadata("design:returntype", Promise)
], AttendanceRecordsController.prototype, "getTimesheet", null);
exports.AttendanceRecordsController = AttendanceRecordsController = __decorate([
    (0, common_1.Controller)('attendance'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [attendance_records_service_1.AttendanceRecordsService])
], AttendanceRecordsController);
//# sourceMappingURL=attendance-records.controller.js.map