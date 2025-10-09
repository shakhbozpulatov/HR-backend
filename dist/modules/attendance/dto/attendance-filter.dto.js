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
exports.ExportAttendanceDto = exports.AttendanceFilterDto = exports.ExportFormat = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const attendance_record_entity_1 = require("../entities/attendance-record.entity");
const attendance_event_entity_1 = require("../entities/attendance-event.entity");
var ExportFormat;
(function (ExportFormat) {
    ExportFormat["EXCEL"] = "excel";
    ExportFormat["CSV"] = "csv";
    ExportFormat["PDF"] = "pdf";
    ExportFormat["JSON"] = "json";
})(ExportFormat || (exports.ExportFormat = ExportFormat = {}));
class AttendanceFilterDto {
    constructor() {
        this.page = 1;
        this.limit = 10;
        this.sort_by = 'date';
        this.sort_order = 'DESC';
    }
}
exports.AttendanceFilterDto = AttendanceFilterDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AttendanceFilterDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], AttendanceFilterDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AttendanceFilterDto.prototype, "user_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    (0, class_transformer_1.Transform)(({ value }) => (Array.isArray(value) ? value : [value])),
    __metadata("design:type", Array)
], AttendanceFilterDto.prototype, "user_ids", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AttendanceFilterDto.prototype, "device_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AttendanceFilterDto.prototype, "from", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AttendanceFilterDto.prototype, "to", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(attendance_record_entity_1.AttendanceStatus),
    __metadata("design:type", String)
], AttendanceFilterDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(attendance_record_entity_1.AttendanceStatus, { each: true }),
    (0, class_transformer_1.Transform)(({ value }) => (Array.isArray(value) ? value : [value])),
    __metadata("design:type", Array)
], AttendanceFilterDto.prototype, "statuses", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], AttendanceFilterDto.prototype, "is_locked", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], AttendanceFilterDto.prototype, "requires_approval", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AttendanceFilterDto.prototype, "department", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(attendance_event_entity_1.ProcessingStatus),
    __metadata("design:type", String)
], AttendanceFilterDto.prototype, "processing_status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AttendanceFilterDto.prototype, "sort_by", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['ASC', 'DESC']),
    __metadata("design:type", String)
], AttendanceFilterDto.prototype, "sort_order", void 0);
class ExportAttendanceDto extends AttendanceFilterDto {
    constructor() {
        super(...arguments);
        this.include_summary = true;
    }
}
exports.ExportAttendanceDto = ExportAttendanceDto;
__decorate([
    (0, class_validator_1.IsEnum)(ExportFormat),
    __metadata("design:type", String)
], ExportAttendanceDto.prototype, "format", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ExportAttendanceDto.prototype, "columns", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ExportAttendanceDto.prototype, "include_summary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExportAttendanceDto.prototype, "timezone", void 0);
//# sourceMappingURL=attendance-filter.dto.js.map