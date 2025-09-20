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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_log_entity_1 = require("./entities/audit-log.entity");
let AuditService = class AuditService {
    constructor(auditRepository) {
        this.auditRepository = auditRepository;
    }
    async log(actor, action, targetType, targetId, before, after) {
        const log = this.auditRepository.create({
            actor,
            action,
            target_type: targetType,
            target_id: targetId,
            before,
            after,
        });
        return await this.auditRepository.save(log);
    }
    async logHttpRequest(data) {
        try {
            await this.log(data.actor, `HTTP_${data.method}`, 'HTTP_REQUEST', data.url, { body: data.body, duration: data.duration }, { response: data.response, error: data.error, status: data.status });
        }
        catch (error) {
            console.error('Failed to log audit entry:', error);
        }
    }
    async findAll(actor, targetType, startDate, endDate, page = 1, limit = 50) {
        const queryBuilder = this.auditRepository.createQueryBuilder('audit');
        if (actor) {
            queryBuilder.andWhere('audit.actor = :actor', { actor });
        }
        if (targetType) {
            queryBuilder.andWhere('audit.target_type = :targetType', { targetType });
        }
        if (startDate) {
            queryBuilder.andWhere('audit.created_at >= :startDate', { startDate });
        }
        if (endDate) {
            queryBuilder.andWhere('audit.created_at <= :endDate', { endDate });
        }
        const [data, total] = await queryBuilder
            .orderBy('audit.created_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return { data, total };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuditService);
//# sourceMappingURL=audit.service.js.map