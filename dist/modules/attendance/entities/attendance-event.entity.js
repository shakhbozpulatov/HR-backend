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
exports.AttendanceEvent = exports.ProcessingStatus = exports.EventSource = exports.EventType = void 0;
const typeorm_1 = require("typeorm");
const terminal_device_entity_1 = require("../../terminals/entities/terminal-device.entity");
const user_entity_1 = require("../../users/entities/user.entity");
var EventType;
(function (EventType) {
    EventType["CLOCK_IN"] = "clock_in";
    EventType["CLOCK_OUT"] = "clock_out";
})(EventType || (exports.EventType = EventType = {}));
var EventSource;
(function (EventSource) {
    EventSource["BIOMETRIC_DEVICE"] = "biometric_device";
    EventSource["MOBILE_APP"] = "mobile_app";
    EventSource["WEB_APP"] = "web_app";
    EventSource["MANUAL_ENTRY"] = "manual_entry";
    EventSource["IMPORTED"] = "imported";
})(EventSource || (exports.EventSource = EventSource = {}));
var ProcessingStatus;
(function (ProcessingStatus) {
    ProcessingStatus["PENDING"] = "pending";
    ProcessingStatus["PROCESSED"] = "processed";
    ProcessingStatus["FAILED"] = "failed";
    ProcessingStatus["QUARANTINED"] = "quarantined";
})(ProcessingStatus || (exports.ProcessingStatus = ProcessingStatus = {}));
let AttendanceEvent = class AttendanceEvent {
};
exports.AttendanceEvent = AttendanceEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AttendanceEvent.prototype, "event_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], AttendanceEvent.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AttendanceEvent.prototype, "terminal_user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], AttendanceEvent.prototype, "device_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: EventType }),
    __metadata("design:type", String)
], AttendanceEvent.prototype, "event_type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: EventSource,
        default: EventSource.BIOMETRIC_DEVICE,
    }),
    __metadata("design:type", String)
], AttendanceEvent.prototype, "event_source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], AttendanceEvent.prototype, "ts_utc", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], AttendanceEvent.prototype, "ts_local", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], AttendanceEvent.prototype, "source_payload", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], AttendanceEvent.prototype, "ingestion_idempotency_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], AttendanceEvent.prototype, "signature_valid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AttendanceEvent.prototype, "signature_hash", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ProcessingStatus,
        default: ProcessingStatus.PENDING,
    }),
    __metadata("design:type", String)
], AttendanceEvent.prototype, "processing_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], AttendanceEvent.prototype, "processed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AttendanceEvent.prototype, "processing_error", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], AttendanceEvent.prototype, "retry_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], AttendanceEvent.prototype, "resolved_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], AttendanceEvent.prototype, "resolved_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AttendanceEvent.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AttendanceEvent.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.attendance_events, {
        nullable: true,
        onDelete: 'SET NULL',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], AttendanceEvent.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => terminal_device_entity_1.TerminalDevice, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'device_id' }),
    __metadata("design:type", terminal_device_entity_1.TerminalDevice)
], AttendanceEvent.prototype, "device", void 0);
exports.AttendanceEvent = AttendanceEvent = __decorate([
    (0, typeorm_1.Entity)('attendance_events'),
    (0, typeorm_1.Index)(['ingestion_idempotency_key'], { unique: true }),
    (0, typeorm_1.Index)(['user_id', 'ts_local']),
    (0, typeorm_1.Index)(['device_id', 'ts_local']),
    (0, typeorm_1.Index)(['processing_status', 'created_at']),
    (0, typeorm_1.Index)(['terminal_user_id', 'device_id'])
], AttendanceEvent);
//# sourceMappingURL=attendance-event.entity.js.map