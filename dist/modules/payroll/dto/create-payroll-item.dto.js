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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePayrollItemDto = void 0;
const class_validator_1 = require("class-validator");
const payroll_item_entity_1 = require("../entities/payroll-item.entity");
class CreatePayrollItemDto {
}
exports.CreatePayrollItemDto = CreatePayrollItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePayrollItemDto.prototype, "employee_id", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(payroll_item_entity_1.PayrollItemType),
    __metadata("design:type", String)
], CreatePayrollItemDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(payroll_item_entity_1.PayrollItemCode),
    __metadata("design:type", String)
], CreatePayrollItemDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePayrollItemDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePayrollItemDto.prototype, "rate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePayrollItemDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePayrollItemDto.prototype, "note", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(payroll_item_entity_1.PayrollItemSource),
    __metadata("design:type", String)
], CreatePayrollItemDto.prototype, "source", void 0);
//# sourceMappingURL=create-payroll-item.dto.js.map