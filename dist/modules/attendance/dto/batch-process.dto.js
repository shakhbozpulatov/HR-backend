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
exports.ApprovalDto = exports.ReprocessDateRangeDto = exports.BatchProcessDto = void 0;
const class_validator_1 = require("class-validator");
class BatchProcessDto {
    constructor() {
        this.force_reprocess = false;
        this.include_locked = false;
    }
}
exports.BatchProcessDto = BatchProcessDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], BatchProcessDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], BatchProcessDto.prototype, "user_ids", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BatchProcessDto.prototype, "force_reprocess", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BatchProcessDto.prototype, "include_locked", void 0);
class ReprocessDateRangeDto {
    constructor() {
        this.force = false;
    }
}
exports.ReprocessDateRangeDto = ReprocessDateRangeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ReprocessDateRangeDto.prototype, "user_id", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ReprocessDateRangeDto.prototype, "start_date", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ReprocessDateRangeDto.prototype, "end_date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ReprocessDateRangeDto.prototype, "force", void 0);
class ApprovalDto {
    constructor() {
        this.level = 1;
        this.lock_record = false;
    }
}
exports.ApprovalDto = ApprovalDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], ApprovalDto.prototype, "level", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 500),
    __metadata("design:type", String)
], ApprovalDto.prototype, "comments", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ApprovalDto.prototype, "lock_record", void 0);
//# sourceMappingURL=batch-process.dto.js.map