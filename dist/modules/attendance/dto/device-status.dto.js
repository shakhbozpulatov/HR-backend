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
exports.DeviceStatusDto = exports.DeviceStatus = void 0;
const class_validator_1 = require("class-validator");
var DeviceStatus;
(function (DeviceStatus) {
    DeviceStatus["ONLINE"] = "online";
    DeviceStatus["OFFLINE"] = "offline";
    DeviceStatus["DISCONNECTED"] = "disconnected";
    DeviceStatus["MAINTENANCE"] = "maintenance";
    DeviceStatus["ERROR"] = "error";
})(DeviceStatus || (exports.DeviceStatus = DeviceStatus = {}));
class DeviceStatusDto {
}
exports.DeviceStatusDto = DeviceStatusDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], DeviceStatusDto.prototype, "device_id", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(DeviceStatus),
    __metadata("design:type", String)
], DeviceStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], DeviceStatusDto.prototype, "last_seen", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/),
    __metadata("design:type", String)
], DeviceStatusDto.prototype, "ip_address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeviceStatusDto.prototype, "firmware_version", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], DeviceStatusDto.prototype, "battery_level", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], DeviceStatusDto.prototype, "health_metrics", void 0);
//# sourceMappingURL=device-status.dto.js.map