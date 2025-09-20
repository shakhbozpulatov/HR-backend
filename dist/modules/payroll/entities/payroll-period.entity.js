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
exports.PayrollPeriod = exports.PeriodStatus = void 0;
const typeorm_1 = require("typeorm");
const payroll_item_entity_1 = require("./payroll-item.entity");
var PeriodStatus;
(function (PeriodStatus) {
    PeriodStatus["OPEN"] = "OPEN";
    PeriodStatus["LOCKED"] = "LOCKED";
    PeriodStatus["PROCESSED"] = "PROCESSED";
})(PeriodStatus || (exports.PeriodStatus = PeriodStatus = {}));
let PayrollPeriod = class PayrollPeriod {
};
exports.PayrollPeriod = PayrollPeriod;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PayrollPeriod.prototype, "period_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], PayrollPeriod.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], PayrollPeriod.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PeriodStatus, default: PeriodStatus.OPEN }),
    __metadata("design:type", String)
], PayrollPeriod.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], PayrollPeriod.prototype, "close_date", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PayrollPeriod.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PayrollPeriod.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => payroll_item_entity_1.PayrollItem, (item) => item.period),
    __metadata("design:type", Array)
], PayrollPeriod.prototype, "items", void 0);
exports.PayrollPeriod = PayrollPeriod = __decorate([
    (0, typeorm_1.Entity)('payroll_periods'),
    (0, typeorm_1.Index)(['start_date', 'end_date'], { unique: true })
], PayrollPeriod);
//# sourceMappingURL=payroll-period.entity.js.map