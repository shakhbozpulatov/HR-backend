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
exports.AttendanceEventsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const attendance_event_entity_1 = require("./entities/attendance-event.entity");
let AttendanceEventsService = class AttendanceEventsService {
    constructor(eventRepository) {
        this.eventRepository = eventRepository;
    }
    async processWebhookEvent(eventData, idempotencyKey) {
        const event = this.eventRepository.create({
            ...eventData,
            ingestion_idempotency_key: idempotencyKey,
            ts_utc: new Date(eventData.timestamp),
            ts_local: new Date(eventData.timestamp),
        });
        return await this.eventRepository.save(event);
    }
    async findAll(filterDto) {
        const { page = 1, limit = 10, employee_id, from, to } = filterDto;
        const queryBuilder = this.eventRepository
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.employee', 'employee')
            .leftJoinAndSelect('event.device', 'device');
        if (employee_id) {
            queryBuilder.andWhere('event.employee_id = :employee_id', {
                employee_id,
            });
        }
        if (from) {
            queryBuilder.andWhere('event.ts_local >= :from', { from });
        }
        if (to) {
            queryBuilder.andWhere('event.ts_local <= :to', { to });
        }
        const [data, total] = await queryBuilder
            .orderBy('event.ts_local', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return { data, total };
    }
    async updateDeviceStatus(statusData) {
        console.log('Device status updated:', statusData);
        return { success: true };
    }
    async getQuarantinedEvents() {
        return await this.eventRepository.find({
            where: { employee_id: null },
            relations: ['device'],
            order: { created_at: 'DESC' },
        });
    }
    async resolveQuarantinedEvent(eventId, employeeId, _actorId) {
        const event = await this.eventRepository.findOne({
            where: { event_id: eventId },
        });
        if (event) {
            event.employee_id = employeeId;
            return await this.eventRepository.save(event);
        }
        return event;
    }
};
exports.AttendanceEventsService = AttendanceEventsService;
exports.AttendanceEventsService = AttendanceEventsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attendance_event_entity_1.AttendanceEvent)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AttendanceEventsService);
//# sourceMappingURL=attendance-events.service.js.map