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
exports.PayrollController = void 0;
const common_1 = require("@nestjs/common");
const payroll_service_1 = require("./payroll.service");
const create_period_dto_1 = require("./dto/create-period.dto");
const create_payroll_item_dto_1 = require("./dto/create-payroll-item.dto");
const payroll_filter_dto_1 = require("./dto/payroll-filter.dto");
const auth_guard_1 = require("../../common/guards/auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const user_entity_1 = require("../users/entities/user.entity");
let PayrollController = class PayrollController {
    constructor(payrollService) {
        this.payrollService = payrollService;
    }
    async createPeriod(createPeriodDto) {
        return await this.payrollService.createPeriod(createPeriodDto, 'admin');
    }
    async getPeriods(filterDto) {
        return await this.payrollService.findAllPeriods(filterDto);
    }
    async getPeriod(id) {
        return await this.payrollService.findOnePeriod(id);
    }
    async processPeriod(id) {
        return await this.payrollService.processPeriod(id, 'admin');
    }
    async lockPeriod(id) {
        return await this.payrollService.lockPeriod(id, 'admin');
    }
    async getPeriodItems(id, filterDto) {
        return await this.payrollService.findPeriodItems(id, filterDto);
    }
    async createPeriodItem(periodId, createItemDto) {
        return await this.payrollService.createPayrollItem(periodId, createItemDto, 'admin');
    }
    async getPeriodSummary(id) {
        return await this.payrollService.getPeriodSummary(id);
    }
    async exportPeriod(id, format = 'xlsx') {
        return await this.payrollService.exportPeriod(id, format);
    }
    async getPayslip(employeeId, periodId) {
        return await this.payrollService.getEmployeePayslip(employeeId, periodId);
    }
};
exports.PayrollController = PayrollController;
__decorate([
    (0, common_1.Post)('periods'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_period_dto_1.CreatePeriodDto]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "createPeriod", null);
__decorate([
    (0, common_1.Get)('periods'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER, user_entity_1.UserRole.PAYROLL),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payroll_filter_dto_1.PayrollFilterDto]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "getPeriods", null);
__decorate([
    (0, common_1.Get)('periods/:id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER, user_entity_1.UserRole.PAYROLL),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "getPeriod", null);
__decorate([
    (0, common_1.Post)('periods/:id/process'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "processPeriod", null);
__decorate([
    (0, common_1.Post)('periods/:id/lock'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "lockPeriod", null);
__decorate([
    (0, common_1.Get)('periods/:id/items'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER, user_entity_1.UserRole.PAYROLL),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payroll_filter_dto_1.PayrollFilterDto]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "getPeriodItems", null);
__decorate([
    (0, common_1.Post)('periods/:id/items'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER, user_entity_1.UserRole.PAYROLL),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_payroll_item_dto_1.CreatePayrollItemDto]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "createPeriodItem", null);
__decorate([
    (0, common_1.Get)('periods/:id/summary'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER, user_entity_1.UserRole.PAYROLL),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "getPeriodSummary", null);
__decorate([
    (0, common_1.Post)('periods/:id/export'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER, user_entity_1.UserRole.PAYROLL),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "exportPeriod", null);
__decorate([
    (0, common_1.Get)('employee/:employeeId/payslip/:periodId'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER, user_entity_1.UserRole.PAYROLL, user_entity_1.UserRole.EMPLOYEE),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Param)('periodId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "getPayslip", null);
exports.PayrollController = PayrollController = __decorate([
    (0, common_1.Controller)('payroll'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [payroll_service_1.PayrollService])
], PayrollController);
//# sourceMappingURL=payroll.controller.js.map