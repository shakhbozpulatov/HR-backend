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
var UserDeviceMappingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDeviceMappingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const attendance_1 = require("..");
let UserDeviceMappingService = UserDeviceMappingService_1 = class UserDeviceMappingService {
    constructor(mappingRepository) {
        this.mappingRepository = mappingRepository;
        this.logger = new common_1.Logger(UserDeviceMappingService_1.name);
    }
    async enrollUser(enrollDto, actorId) {
        const existingMapping = await this.mappingRepository.findOne({
            where: {
                user_id: enrollDto.user_id,
                device_id: enrollDto.device_id,
            },
        });
        if (existingMapping) {
            throw new common_1.ConflictException('User already enrolled on this device');
        }
        let terminalUserId = enrollDto.terminal_user_id;
        if (!terminalUserId && enrollDto.auto_generate_terminal_id) {
            terminalUserId = await this.generateTerminalUserId(enrollDto.device_id);
        }
        const mapping = this.mappingRepository.create({
            user_id: enrollDto.user_id,
            terminal_user_id: terminalUserId.toString(),
            device_id: enrollDto.device_id,
            card_number: enrollDto.card_number,
            pin_code: enrollDto.pin_code,
            enrollment_status: attendance_1.EnrollmentStatus.PENDING_BIOMETRIC,
            enrolled_by: actorId,
            enrolled_at: new Date(),
        });
        const saved = await this.mappingRepository.save(mapping);
        this.logger.log(`User ${enrollDto.user_id} enrolled to device ${enrollDto.device_id} with terminal_id: ${terminalUserId}`);
        return saved;
    }
    async generateTerminalUserId(deviceId) {
        const lastMapping = await this.mappingRepository
            .createQueryBuilder('mapping')
            .where('mapping.device_id = :deviceId', { deviceId })
            .andWhere("mapping.terminal_user_id ~ '^[0-9]+$'")
            .orderBy('CAST(mapping.terminal_user_id AS INTEGER)', 'DESC')
            .getOne();
        if (!lastMapping) {
            return 1;
        }
        const lastId = parseInt(lastMapping.terminal_user_id);
        return isNaN(lastId) ? 1 : lastId + 1;
    }
    async getMapping(terminalUserId, deviceId) {
        return await this.mappingRepository.findOne({
            where: {
                terminal_user_id: terminalUserId,
                device_id: deviceId,
                is_active: true,
            },
            relations: ['user', 'device'],
        });
    }
    async getUserMappings(userId) {
        return await this.mappingRepository.find({
            where: {
                user_id: userId,
                is_active: true,
            },
            relations: ['device'],
            order: {
                created_at: 'DESC',
            },
        });
    }
    async getDeviceMappings(deviceId) {
        return await this.mappingRepository.find({
            where: {
                device_id: deviceId,
                is_active: true,
            },
            relations: ['user'],
            order: {
                terminal_user_id: 'ASC',
            },
        });
    }
    async updateEnrollmentStatus(mappingId, status, metadata) {
        const mapping = await this.mappingRepository.findOne({
            where: { mapping_id: mappingId },
        });
        if (!mapping) {
            throw new common_1.NotFoundException('Mapping not found');
        }
        mapping.enrollment_status = status;
        mapping.last_sync_at = new Date();
        if (metadata) {
            mapping.sync_metadata = {
                ...mapping.sync_metadata,
                ...metadata,
                updated_at: new Date(),
            };
        }
        const saved = await this.mappingRepository.save(mapping);
        this.logger.log(`Mapping ${mappingId} status updated to ${status}`);
        return saved;
    }
    async updateBiometric(mappingId, data) {
        const mapping = await this.mappingRepository.findOne({
            where: { mapping_id: mappingId },
        });
        if (!mapping) {
            throw new common_1.NotFoundException('Mapping not found');
        }
        if (data.fingerprint_enrolled !== undefined) {
            mapping.fingerprint_enrolled = data.fingerprint_enrolled;
        }
        if (data.fingerprint_count !== undefined) {
            mapping.fingerprint_count = data.fingerprint_count;
        }
        if (data.face_enrolled !== undefined) {
            mapping.face_enrolled = data.face_enrolled;
        }
        if ((mapping.fingerprint_enrolled || mapping.face_enrolled) &&
            mapping.enrollment_status === attendance_1.EnrollmentStatus.PENDING_BIOMETRIC) {
            mapping.enrollment_status = attendance_1.EnrollmentStatus.COMPLETED;
        }
        mapping.last_sync_at = new Date();
        const saved = await this.mappingRepository.save(mapping);
        this.logger.log(`Biometric data updated for mapping ${mappingId}`);
        return saved;
    }
    async deactivateMapping(mappingId) {
        const mapping = await this.mappingRepository.findOne({
            where: { mapping_id: mappingId },
        });
        if (!mapping) {
            throw new common_1.NotFoundException('Mapping not found');
        }
        mapping.is_active = false;
        await this.mappingRepository.save(mapping);
        this.logger.log(`Mapping ${mappingId} deactivated`);
    }
    async reactivateMapping(mappingId) {
        const mapping = await this.mappingRepository.findOne({
            where: { mapping_id: mappingId },
        });
        if (!mapping) {
            throw new common_1.NotFoundException('Mapping not found');
        }
        mapping.is_active = true;
        const saved = await this.mappingRepository.save(mapping);
        this.logger.log(`Mapping ${mappingId} reactivated`);
        return saved;
    }
    async updateSyncStatus(mappingId, metadata) {
        const mapping = await this.mappingRepository.findOne({
            where: { mapping_id: mappingId },
        });
        if (!mapping) {
            throw new common_1.NotFoundException('Mapping not found');
        }
        mapping.last_sync_at = new Date();
        if (metadata) {
            mapping.sync_metadata = {
                ...mapping.sync_metadata,
                ...metadata,
                last_sync: new Date().toISOString(),
            };
        }
        const saved = await this.mappingRepository.save(mapping);
        this.logger.log(`Sync status updated for mapping ${mappingId}`);
        return saved;
    }
    async bulkEnroll(deviceId, userIds, actorId, autoGenerateTerminalId = true) {
        const success = [];
        const failed = [];
        for (const userId of userIds) {
            try {
                const mapping = await this.enrollUser({
                    user_id: userId,
                    device_id: deviceId,
                    auto_generate_terminal_id: autoGenerateTerminalId,
                }, actorId);
                success.push(mapping);
            }
            catch (error) {
                failed.push({
                    user_id: userId,
                    error: error.message,
                });
                this.logger.warn(`Failed to enroll user ${userId} to device ${deviceId}: ${error.message}`);
            }
        }
        this.logger.log(`Bulk enrollment completed. Success: ${success.length}, Failed: ${failed.length}`);
        return { success, failed };
    }
    async deleteMapping(mappingId) {
        const result = await this.mappingRepository.delete({
            mapping_id: mappingId,
        });
        if (result.affected === 0) {
            throw new common_1.NotFoundException('Mapping not found');
        }
        this.logger.log(`Mapping ${mappingId} deleted permanently`);
    }
    async getMappingById(mappingId) {
        const mapping = await this.mappingRepository.findOne({
            where: { mapping_id: mappingId },
            relations: ['user', 'device'],
        });
        if (!mapping) {
            throw new common_1.NotFoundException('Mapping not found');
        }
        return mapping;
    }
    async isUserEnrolled(userId, deviceId) {
        const count = await this.mappingRepository.count({
            where: {
                user_id: userId,
                device_id: deviceId,
                is_active: true,
            },
        });
        return count > 0;
    }
    async getDeviceEnrollmentStats(deviceId) {
        const mappings = await this.mappingRepository.find({
            where: { device_id: deviceId },
        });
        return {
            total: mappings.length,
            active: mappings.filter((m) => m.is_active).length,
            inactive: mappings.filter((m) => !m.is_active).length,
            pending: mappings.filter((m) => m.enrollment_status === attendance_1.EnrollmentStatus.PENDING ||
                m.enrollment_status === attendance_1.EnrollmentStatus.PENDING_BIOMETRIC).length,
            completed: mappings.filter((m) => m.enrollment_status === attendance_1.EnrollmentStatus.COMPLETED).length,
            failed: mappings.filter((m) => m.enrollment_status === attendance_1.EnrollmentStatus.FAILED).length,
        };
    }
    async getUserEnrollmentStats(userId) {
        const mappings = await this.mappingRepository.find({
            where: { user_id: userId },
        });
        return {
            total_devices: mappings.length,
            active_devices: mappings.filter((m) => m.is_active).length,
            pending_devices: mappings.filter((m) => m.is_active &&
                (m.enrollment_status === attendance_1.EnrollmentStatus.PENDING ||
                    m.enrollment_status === attendance_1.EnrollmentStatus.PENDING_BIOMETRIC)).length,
        };
    }
};
exports.UserDeviceMappingService = UserDeviceMappingService;
exports.UserDeviceMappingService = UserDeviceMappingService = UserDeviceMappingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attendance_1.UserDeviceMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UserDeviceMappingService);
//# sourceMappingURL=user-device-mapping.service.js.map