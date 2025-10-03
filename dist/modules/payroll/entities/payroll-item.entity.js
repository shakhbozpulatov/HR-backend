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
exports.PayrollItem = exports.PayrollItemSource = exports.PayrollItemCode = exports.PayrollItemType = void 0;
const typeorm_1 = require("typeorm");
const payroll_period_entity_1 = require("./payroll-period.entity");
const user_entity_1 = require("../../users/entities/user.entity");
var PayrollItemType;
(function (PayrollItemType) {
    PayrollItemType["EARNING"] = "EARNING";
    PayrollItemType["DEDUCTION"] = "DEDUCTION";
})(PayrollItemType || (exports.PayrollItemType = PayrollItemType = {}));
var PayrollItemCode;
(function (PayrollItemCode) {
    PayrollItemCode["BASE_HOURLY"] = "BASE_HOURLY";
    PayrollItemCode["BASE_MONTHLY"] = "BASE_MONTHLY";
    PayrollItemCode["OVERTIME"] = "OVERTIME";
    PayrollItemCode["HOLIDAY_PREMIUM"] = "HOLIDAY_PREMIUM";
    PayrollItemCode["PIECEWORK"] = "PIECEWORK";
    PayrollItemCode["BONUS"] = "BONUS";
    PayrollItemCode["PENALTY"] = "PENALTY";
})(PayrollItemCode || (exports.PayrollItemCode = PayrollItemCode = {}));
var PayrollItemSource;
(function (PayrollItemSource) {
    PayrollItemSource["AUTO"] = "AUTO";
    PayrollItemSource["MANUAL"] = "MANUAL";
    PayrollItemSource["IMPORT"] = "IMPORT";
})(PayrollItemSource || (exports.PayrollItemSource = PayrollItemSource = {}));
let PayrollItem = class PayrollItem {
};
exports.PayrollItem = PayrollItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PayrollItem.prototype, "item_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], PayrollItem.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], PayrollItem.prototype, "period_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PayrollItemType }),
    __metadata("design:type", String)
], PayrollItem.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PayrollItemCode }),
    __metadata("design:type", String)
], PayrollItem.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PayrollItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PayrollItem.prototype, "rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PayrollItem.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PayrollItem.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PayrollItemSource,
        default: PayrollItemSource.AUTO,
    }),
    __metadata("design:type", String)
], PayrollItem.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PayrollItem.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.payroll_items),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], PayrollItem.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => payroll_period_entity_1.PayrollPeriod, (period) => period.items),
    (0, typeorm_1.JoinColumn)({ name: 'period_id' }),
    __metadata("design:type", payroll_period_entity_1.PayrollPeriod)
], PayrollItem.prototype, "period", void 0);
exports.PayrollItem = PayrollItem = __decorate([
    (0, typeorm_1.Entity)('payroll_items'),
    (0, typeorm_1.Index)(['user_id', 'period_id', 'code'])
], PayrollItem);
//# sourceMappingURL=payroll-item.entity.js.map