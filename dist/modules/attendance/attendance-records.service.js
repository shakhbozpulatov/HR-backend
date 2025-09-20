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
exports.AttendanceRecordsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const attendance_record_entity_1 = require("./entities/attendance-record.entity");
let AttendanceRecordsService = class AttendanceRecordsService {
    constructor(recordRepository) {
        this.recordRepository = recordRepository;
    }
    async findAll(filterDto) {
        const { page = 1, limit = 10, employee_id, from, to } = filterDto;
        const queryBuilder = this.recordRepository
            .createQueryBuilder('record')
            .leftJoinAndSelect('record.employee', 'employee');
        if (employee_id) {
            queryBuilder.andWhere('record.employee_id = :employee_id', {
                employee_id,
            });
        }
        if (from) {
            queryBuilder.andWhere('record.date >= :from', { from });
        }
        if (to) {
            queryBuilder.andWhere('record.date <= :to', { to });
        }
        const [data, total] = await queryBuilder
            .orderBy('record.date', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return { data, total };
    }
    async findOne(employeeId, date) {
        return await this.recordRepository.findOne({
            where: { employee_id: employeeId, date },
            relations: ['employee'],
        });
    }
    async createManualAdjustment(employeeId, date, adjustment, actorId) {
        const record = await this.findOne(employeeId, date);
        if (record) {
            if (!record.manual_adjustments) {
                record.manual_adjustments = [];
            }
            record.manual_adjustments.push({
                ...adjustment,
                id: Date.now().toString(),
                created_by: actorId,
                created_at: new Date(),
            });
            return await this.recordRepository.save(record);
        }
        return record;
    }
    async approveRecord(employeeId, date, actorId) {
        const record = await this.findOne(employeeId, date);
        if (record) {
            if (!record.approvals) {
                record.approvals = [];
            }
            record.approvals.push({
                approved_by: actorId,
                approved_at: new Date(),
                locked: true,
            });
            return await this.recordRepository.save(record);
        }
        return record;
    }
    async reprocessRecord(employeeId, date) {
        const record = await this.findOne(employeeId, date);
        return record;
    }
    async getTimesheetGrid(filterDto) {
        const records = await this.findAll(filterDto);
        return records;
    }
    async exportToExcel(filterDto) {
        const records = await this.findAll(filterDto);
        return Buffer.from('Excel export not implemented yet');
    }
};
exports.AttendanceRecordsService = AttendanceRecordsService;
exports.AttendanceRecordsService = AttendanceRecordsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attendance_record_entity_1.AttendanceRecord)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AttendanceRecordsService);
//# sourceMappingURL=attendance-records.service.js.map