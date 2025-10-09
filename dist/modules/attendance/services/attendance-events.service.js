"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AttendanceEventsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceEventsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const bull_1 = require("@nestjs/bull");
const crypto = __importStar(require("crypto"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const attendance_1 = require("..");
let AttendanceEventsService = AttendanceEventsService_1 = class AttendanceEventsService {
    constructor(eventRepository, mappingRepository, attendanceQueue, configService, dataSource) {
        this.eventRepository = eventRepository;
        this.mappingRepository = mappingRepository;
        this.attendanceQueue = attendanceQueue;
        this.configService = configService;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(AttendanceEventsService_1.name);
        this.webhookSecret = this.configService.get('WEBHOOK_SECRET', '');
    }
    async processWebhookEvent(eventData, idempotencyKey, signature) {
        if (signature && !this.validateSignature(eventData, signature)) {
            this.logger.warn(`Invalid signature for idempotency key: ${idempotencyKey}`);
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
        const existingEvent = await this.eventRepository.findOne({
            where: { ingestion_idempotency_key: idempotencyKey },
        });
        if (existingEvent) {
            this.logger.log(`Duplicate event detected: ${idempotencyKey}`);
            return existingEvent;
        }
        let userId = null;
        let processingStatus = attendance_1.ProcessingStatus.PENDING;
        if (eventData.terminal_user_id) {
            const mapping = await this.mappingRepository.findOne({
                where: {
                    terminal_user_id: eventData.terminal_user_id,
                    device_id: eventData.device_id,
                    is_active: true,
                },
            });
            if (mapping) {
                userId = mapping.user_id;
                processingStatus = attendance_1.ProcessingStatus.PROCESSED;
            }
            else {
                this.logger.warn(`Unknown terminal_user_id: ${eventData.terminal_user_id} on device: ${eventData.device_id}`);
                processingStatus = attendance_1.ProcessingStatus.QUARANTINED;
            }
        }
        const timezone = eventData.timezone ||
            this.configService.get('DEFAULT_TIMEZONE', 'Asia/Tashkent');
        const tsUtc = moment_timezone_1.default.utc(eventData.timestamp).toDate();
        const tsLocal = moment_timezone_1.default.tz(eventData.timestamp, timezone).toDate();
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const event = this.eventRepository.create({
                user_id: userId,
                terminal_user_id: eventData.terminal_user_id,
                device_id: eventData.device_id,
                event_type: eventData.event_type,
                event_source: attendance_1.EventSource.BIOMETRIC_DEVICE,
                ts_utc: tsUtc,
                ts_local: tsLocal,
                source_payload: eventData.metadata,
                ingestion_idempotency_key: idempotencyKey,
                signature_valid: signature
                    ? this.validateSignature(eventData, signature)
                    : true,
                signature_hash: signature || null,
                processing_status: processingStatus,
                processed_at: processingStatus === attendance_1.ProcessingStatus.PROCESSED ? new Date() : null,
            });
            const savedEvent = await queryRunner.manager.save(event);
            if (userId) {
                await this.queueEventProcessing(savedEvent);
            }
            await queryRunner.commitTransaction();
            this.logger.log(`Event ${savedEvent.event_id} ingested successfully. Status: ${processingStatus}`);
            return savedEvent;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            if (error.code === '23505') {
                const existingEvent = await this.eventRepository.findOne({
                    where: { ingestion_idempotency_key: idempotencyKey },
                });
                if (existingEvent) {
                    this.logger.log(`Race condition: event already exists ${idempotencyKey}`);
                    return existingEvent;
                }
            }
            this.logger.error(`Failed to process webhook event: ${error.message}`, error.stack);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async findOne(eventId) {
        const event = await this.eventRepository.findOne({
            where: { event_id: eventId },
            relations: ['user', 'device'],
        });
        if (!event) {
            throw new common_1.NotFoundException(`Event with ID ${eventId} not found`);
        }
        return event;
    }
    async findByUserId(userId, options) {
        const queryBuilder = this.eventRepository
            .createQueryBuilder('event')
            .where('event.user_id = :userId', { userId })
            .orderBy('event.ts_local', 'DESC');
        if (options?.from) {
            queryBuilder.andWhere('event.ts_local >= :from', { from: options.from });
        }
        if (options?.to) {
            queryBuilder.andWhere('event.ts_local <= :to', { to: options.to });
        }
        if (options?.limit) {
            queryBuilder.take(options.limit);
        }
        return await queryBuilder.getMany();
    }
    async findByDeviceId(deviceId, options) {
        const queryBuilder = this.eventRepository
            .createQueryBuilder('event')
            .where('event.device_id = :deviceId', { deviceId })
            .orderBy('event.ts_local', 'DESC');
        if (options?.from) {
            queryBuilder.andWhere('event.ts_local >= :from', { from: options.from });
        }
        if (options?.to) {
            queryBuilder.andWhere('event.ts_local <= :to', { to: options.to });
        }
        if (options?.limit) {
            queryBuilder.take(options.limit);
        }
        return await queryBuilder.getMany();
    }
    async deleteEvent(eventId) {
        const result = await this.eventRepository.delete({ event_id: eventId });
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Event with ID ${eventId} not found`);
        }
        this.logger.log(`Event ${eventId} deleted`);
    }
    async getEventStatistics(filters) {
        const queryBuilder = this.eventRepository.createQueryBuilder('event');
        if (filters.userId) {
            queryBuilder.andWhere('event.user_id = :userId', {
                userId: filters.userId,
            });
        }
        if (filters.deviceId) {
            queryBuilder.andWhere('event.device_id = :deviceId', {
                deviceId: filters.deviceId,
            });
        }
        if (filters.from) {
            queryBuilder.andWhere('event.ts_local >= :from', { from: filters.from });
        }
        if (filters.to) {
            queryBuilder.andWhere('event.ts_local <= :to', { to: filters.to });
        }
        const events = await queryBuilder.getMany();
        return {
            total: events.length,
            clockIn: events.filter((e) => e.event_type === attendance_1.EventType.CLOCK_IN).length,
            clockOut: events.filter((e) => e.event_type === attendance_1.EventType.CLOCK_OUT)
                .length,
            processed: events.filter((e) => e.processing_status === attendance_1.ProcessingStatus.PROCESSED).length,
            pending: events.filter((e) => e.processing_status === attendance_1.ProcessingStatus.PENDING).length,
            failed: events.filter((e) => e.processing_status === attendance_1.ProcessingStatus.FAILED).length,
            quarantined: events.filter((e) => e.processing_status === attendance_1.ProcessingStatus.QUARANTINED).length,
        };
    }
    async updateDeviceStatus(statusData) {
        this.logger.log('Device status updated:', statusData);
        return { success: true };
    }
    async getIncompleteEvents(userId, date) {
        const queryBuilder = this.eventRepository
            .createQueryBuilder('event')
            .where('event.user_id = :userId', { userId })
            .andWhere('event.event_type = :eventType', {
            eventType: attendance_1.EventType.CLOCK_IN,
        })
            .orderBy('event.ts_local', 'ASC');
        if (date) {
            const startOfDay = (0, moment_timezone_1.default)(date).startOf('day').toDate();
            const endOfDay = (0, moment_timezone_1.default)(date).endOf('day').toDate();
            queryBuilder.andWhere('event.ts_local BETWEEN :start AND :end', {
                start: startOfDay,
                end: endOfDay,
            });
        }
        const clockInEvents = await queryBuilder.getMany();
        const incompleteEvents = [];
        for (const clockIn of clockInEvents) {
            const clockOut = await this.eventRepository.findOne({
                where: {
                    user_id: userId,
                    event_type: attendance_1.EventType.CLOCK_OUT,
                    ts_local: (0, typeorm_2.Between)(clockIn.ts_local, (0, moment_timezone_1.default)(clockIn.ts_local).add(24, 'hours').toDate()),
                },
                order: { ts_local: 'ASC' },
            });
            if (!clockOut) {
                incompleteEvents.push(clockIn);
            }
        }
        return incompleteEvents;
    }
    validateSignature(eventData, signature) {
        if (!this.webhookSecret) {
            return true;
        }
        const payload = JSON.stringify(eventData);
        const expectedSignature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(payload)
            .digest('hex');
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
    async queueEventProcessing(event) {
        const dateStr = (0, moment_timezone_1.default)(event.ts_local).format('YYYY-MM-DD');
        await this.attendanceQueue.add('process-employee-day', {
            employeeId: event.user_id,
            date: dateStr,
        }, {
            jobId: `process-${event.user_id}-${dateStr}`,
            removeOnComplete: true,
            removeOnFail: false,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        });
    }
    async getQuarantinedEvents() {
        return await this.eventRepository.find({
            where: { processing_status: attendance_1.ProcessingStatus.QUARANTINED },
            relations: ['device'],
            order: { created_at: 'DESC' },
            take: 100,
        });
    }
    async resolveQuarantinedEvent(eventId, resolveDto, actorId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const event = await queryRunner.manager.findOne(attendance_1.AttendanceEvent, {
                where: { event_id: eventId },
            });
            if (!event) {
                throw new common_1.NotFoundException('Event not found');
            }
            if (event.processing_status !== attendance_1.ProcessingStatus.QUARANTINED) {
                throw new common_1.BadRequestException('Event is not in quarantine');
            }
            event.user_id = resolveDto.user_id;
            event.processing_status = attendance_1.ProcessingStatus.PROCESSED;
            event.processed_at = new Date();
            event.resolved_by = actorId;
            event.resolved_at = new Date();
            await queryRunner.manager.save(event);
            if (resolveDto.create_mapping && event.terminal_user_id) {
                const existingMapping = await queryRunner.manager.findOne(attendance_1.UserDeviceMapping, {
                    where: {
                        terminal_user_id: event.terminal_user_id,
                        device_id: event.device_id,
                    },
                });
                if (!existingMapping) {
                    const mapping = queryRunner.manager.create(attendance_1.UserDeviceMapping, {
                        user_id: resolveDto.user_id,
                        terminal_user_id: event.terminal_user_id,
                        device_id: event.device_id,
                        enrollment_status: attendance_1.EnrollmentStatus.COMPLETED,
                        fingerprint_enrolled: true,
                        enrolled_by: actorId,
                        enrolled_at: new Date(),
                    });
                    await queryRunner.manager.save(mapping);
                    this.logger.log(`Mapping created for terminal_user_id: ${event.terminal_user_id}`);
                }
            }
            if (resolveDto.reprocess_record) {
                const dateStr = (0, moment_timezone_1.default)(event.ts_local).format('YYYY-MM-DD');
                await this.attendanceQueue.add('process-employee-day', {
                    employeeId: resolveDto.user_id,
                    date: dateStr,
                });
            }
            await queryRunner.commitTransaction();
            this.logger.log(`Event ${eventId} resolved successfully`);
            return event;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed to resolve quarantined event: ${error.message}`);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async retryFailedEvents() {
        const failedEvents = await this.eventRepository.find({
            where: {
                processing_status: attendance_1.ProcessingStatus.FAILED,
                retry_count: (0, typeorm_2.Between)(0, 2),
            },
            take: 50,
        });
        for (const event of failedEvents) {
            if (event.user_id) {
                event.retry_count++;
                event.processing_status = attendance_1.ProcessingStatus.PENDING;
                await this.eventRepository.save(event);
                await this.queueEventProcessing(event);
            }
        }
        this.logger.log(`Retrying ${failedEvents.length} failed events`);
    }
    async findAll(filterDto) {
        const { page = 1, limit = 10, user_id, device_id, from, to, processing_status, } = filterDto;
        const queryBuilder = this.eventRepository
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.user', 'user')
            .leftJoinAndSelect('event.device', 'device');
        if (user_id) {
            queryBuilder.andWhere('event.user_id = :user_id', { user_id });
        }
        if (device_id) {
            queryBuilder.andWhere('event.device_id = :device_id', { device_id });
        }
        if (from) {
            queryBuilder.andWhere('event.ts_local >= :from', {
                from: new Date(from),
            });
        }
        if (to) {
            queryBuilder.andWhere('event.ts_local <= :to', { to: new Date(to) });
        }
        if (processing_status) {
            queryBuilder.andWhere('event.processing_status = :processing_status', {
                processing_status,
            });
        }
        const [data, total] = await queryBuilder
            .orderBy('event.ts_local', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return { data, total };
    }
};
exports.AttendanceEventsService = AttendanceEventsService;
exports.AttendanceEventsService = AttendanceEventsService = AttendanceEventsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attendance_1.AttendanceEvent)),
    __param(1, (0, typeorm_1.InjectRepository)(attendance_1.UserDeviceMapping)),
    __param(2, (0, bull_1.InjectQueue)('attendance')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository, Object, config_1.ConfigService,
        typeorm_2.DataSource])
], AttendanceEventsService);
//# sourceMappingURL=attendance-events.service.js.map