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
exports.UserDeviceMapping = exports.EnrollmentStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const terminal_device_entity_1 = require("../../terminals/entities/terminal-device.entity");
var EnrollmentStatus;
(function (EnrollmentStatus) {
    EnrollmentStatus["PENDING"] = "pending";
    EnrollmentStatus["PENDING_BIOMETRIC"] = "pending_biometric";
    EnrollmentStatus["COMPLETED"] = "completed";
    EnrollmentStatus["FAILED"] = "failed";
    EnrollmentStatus["DISABLED"] = "disabled";
})(EnrollmentStatus || (exports.EnrollmentStatus = EnrollmentStatus = {}));
let UserDeviceMapping = class UserDeviceMapping {
};
exports.UserDeviceMapping = UserDeviceMapping;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserDeviceMapping.prototype, "mapping_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], UserDeviceMapping.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], UserDeviceMapping.prototype, "terminal_user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], UserDeviceMapping.prototype, "device_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: EnrollmentStatus,
        default: EnrollmentStatus.PENDING,
    }),
    __metadata("design:type", String)
], UserDeviceMapping.prototype, "enrollment_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], UserDeviceMapping.prototype, "fingerprint_enrolled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], UserDeviceMapping.prototype, "fingerprint_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], UserDeviceMapping.prototype, "face_enrolled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], UserDeviceMapping.prototype, "card_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], UserDeviceMapping.prototype, "pin_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], UserDeviceMapping.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], UserDeviceMapping.prototype, "enrolled_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], UserDeviceMapping.prototype, "enrolled_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], UserDeviceMapping.prototype, "last_sync_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], UserDeviceMapping.prototype, "sync_metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], UserDeviceMapping.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], UserDeviceMapping.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserDeviceMapping.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => terminal_device_entity_1.TerminalDevice, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'device_id' }),
    __metadata("design:type", terminal_device_entity_1.TerminalDevice)
], UserDeviceMapping.prototype, "device", void 0);
exports.UserDeviceMapping = UserDeviceMapping = __decorate([
    (0, typeorm_1.Entity)('user_device_mappings'),
    (0, typeorm_1.Index)(['terminal_user_id', 'device_id'], { unique: true }),
    (0, typeorm_1.Index)(['user_id', 'device_id']),
    (0, typeorm_1.Index)(['device_id', 'enrollment_status'])
], UserDeviceMapping);
//# sourceMappingURL=user-device-mapping.entity.js.map