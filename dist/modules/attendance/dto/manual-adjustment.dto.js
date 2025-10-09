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
exports.ManualAdjustmentDto = exports.AdjustmentType = void 0;
const class_validator_1 = require("class-validator");
const attendance_record_entity_1 = require("../entities/attendance-record.entity");
var AdjustmentType;
(function (AdjustmentType) {
    AdjustmentType["CLOCK_TIME_EDIT"] = "CLOCK_TIME_EDIT";
    AdjustmentType["MARK_ABSENT_PAID"] = "MARK_ABSENT_PAID";
    AdjustmentType["MARK_ABSENT_UNPAID"] = "MARK_ABSENT_UNPAID";
    AdjustmentType["OVERRIDE_STATUS"] = "OVERRIDE_STATUS";
    AdjustmentType["ADD_MINUTES"] = "ADD_MINUTES";
    AdjustmentType["REMOVE_MINUTES"] = "REMOVE_MINUTES";
})(AdjustmentType || (exports.AdjustmentType = AdjustmentType = {}));
class ManualAdjustmentDto {
}
exports.ManualAdjustmentDto = ManualAdjustmentDto;
__decorate([
    (0, class_validator_1.IsEnum)(AdjustmentType),
    __metadata("design:type", String)
], ManualAdjustmentDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(10, 500),
    __metadata("design:type", String)
], ManualAdjustmentDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ManualAdjustmentDto.prototype, "clock_in_time", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ManualAdjustmentDto.prototype, "clock_out_time", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ManualAdjustmentDto.prototype, "minutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(attendance_record_entity_1.AttendanceStatus),
    __metadata("design:type", String)
], ManualAdjustmentDto.prototype, "new_status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ManualAdjustmentDto.prototype, "metadata", void 0);
//# sourceMappingURL=manual-adjustment.dto.js.map