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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const terminal_device_entity_1 = require("./entities/terminal-device.entity");
let TerminalsService = class TerminalsService {
    constructor(deviceRepository) {
        this.deviceRepository = deviceRepository;
    }
    async findAll() {
        return await this.deviceRepository.find({
            order: { name: 'ASC' },
        });
    }
    async findOne(id) {
        const device = await this.deviceRepository.findOne({
            where: { id: id },
        });
        if (!device) {
            throw new common_1.NotFoundException('Terminal device not found');
        }
        return device;
    }
    async create(deviceData) {
        const device = this.deviceRepository.create(deviceData);
        return await this.deviceRepository.save(device);
    }
    async updateStatus(deviceId, status) {
        const device = await this.findOne(deviceId);
        device.status = status;
        device.last_seen_at = new Date();
        return await this.deviceRepository.save(device);
    }
    async getOnlineDevices() {
        return await this.deviceRepository.find({
            where: { status: terminal_device_entity_1.DeviceStatus.ONLINE },
        });
    }
    async getOfflineDevices() {
        return await this.deviceRepository.find({
            where: { status: terminal_device_entity_1.DeviceStatus.OFFLINE },
        });
    }
};
exports.TerminalsService = TerminalsService;
exports.TerminalsService = TerminalsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(terminal_device_entity_1.TerminalDevice)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TerminalsService);
//# sourceMappingURL=terminals.service.js.map