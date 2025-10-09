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
exports.AttendanceProcessingLog = exports.ProcessingType = void 0;
const typeorm_1 = require("typeorm");
var ProcessingType;
(function (ProcessingType) {
    ProcessingType["DAILY_BATCH"] = "daily_batch";
    ProcessingType["SINGLE_RECORD"] = "single_record";
    ProcessingType["RANGE_REPROCESS"] = "range_reprocess";
    ProcessingType["MANUAL_TRIGGER"] = "manual_trigger";
})(ProcessingType || (exports.ProcessingType = ProcessingType = {}));
let AttendanceProcessingLog = class AttendanceProcessingLog {
};
exports.AttendanceProcessingLog = AttendanceProcessingLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AttendanceProcessingLog.prototype, "log_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], AttendanceProcessingLog.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], AttendanceProcessingLog.prototype, "processing_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ProcessingType }),
    __metadata("design:type", String)
], AttendanceProcessingLog.prototype, "processing_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], AttendanceProcessingLog.prototype, "events_processed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], AttendanceProcessingLog.prototype, "records_created", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], AttendanceProcessingLog.prototype, "records_updated", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], AttendanceProcessingLog.prototype, "success", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AttendanceProcessingLog.prototype, "error_message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], AttendanceProcessingLog.prototype, "duration_ms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AttendanceProcessingLog.prototype, "triggered_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], AttendanceProcessingLog.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AttendanceProcessingLog.prototype, "created_at", void 0);
exports.AttendanceProcessingLog = AttendanceProcessingLog = __decorate([
    (0, typeorm_1.Entity)('attendance_processing_logs'),
    (0, typeorm_1.Index)(['processing_date', 'processing_type']),
    (0, typeorm_1.Index)(['user_id', 'processing_date'])
], AttendanceProcessingLog);
//# sourceMappingURL=attendance-processing-log.entity.js.map