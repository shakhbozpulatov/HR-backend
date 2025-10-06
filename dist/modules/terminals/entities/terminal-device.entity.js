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
exports.TerminalDevice = exports.DeviceStatus = void 0;
const typeorm_1 = require("typeorm");
const attendance_event_entity_1 = require("../../attendance/entities/attendance-event.entity");
const company_entity_1 = require("../../company/entities/company.entity");
var DeviceStatus;
(function (DeviceStatus) {
    DeviceStatus["ONLINE"] = "ONLINE";
    DeviceStatus["OFFLINE"] = "OFFLINE";
    DeviceStatus["MAINTENANCE"] = "MAINTENANCE";
})(DeviceStatus || (exports.DeviceStatus = DeviceStatus = {}));
let TerminalDevice = class TerminalDevice {
};
exports.TerminalDevice = TerminalDevice;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TerminalDevice.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TerminalDevice.prototype, "company_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TerminalDevice.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TerminalDevice.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DeviceStatus, default: DeviceStatus.OFFLINE }),
    __metadata("design:type", String)
], TerminalDevice.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], TerminalDevice.prototype, "last_seen_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TerminalDevice.prototype, "vendor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], TerminalDevice.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TerminalDevice.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TerminalDevice.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => company_entity_1.Company),
    (0, typeorm_1.JoinColumn)({ name: 'company_id' }),
    __metadata("design:type", company_entity_1.Company)
], TerminalDevice.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => attendance_event_entity_1.AttendanceEvent, (event) => event.device),
    __metadata("design:type", Array)
], TerminalDevice.prototype, "events", void 0);
exports.TerminalDevice = TerminalDevice = __decorate([
    (0, typeorm_1.Entity)('terminal_devices')
], TerminalDevice);
//# sourceMappingURL=terminal-device.entity.js.map