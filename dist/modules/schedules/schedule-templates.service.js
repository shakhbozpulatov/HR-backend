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
exports.ScheduleTemplatesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_template_entity_1 = require("./entities/schedule-template.entity");
const user_entity_1 = require("../users/entities/user.entity");
let ScheduleTemplatesService = class ScheduleTemplatesService {
    constructor(templateRepository) {
        this.templateRepository = templateRepository;
    }
    async create(createTemplateDto, user) {
        if (!user.company_id && user.role !== user_entity_1.UserRole.SUPER_ADMIN) {
            throw new common_1.BadRequestException('User is not linked to any company');
        }
        const template = this.templateRepository.create({
            ...createTemplateDto,
            company_id: user.company_id,
        });
        return await this.templateRepository.save(template);
    }
    async findAll(user) {
        if (user.role === user_entity_1.UserRole.SUPER_ADMIN) {
            return await this.templateRepository.find({
                order: { name: 'ASC' },
            });
        }
        return await this.templateRepository.find({
            where: { company_id: user.company_id },
            order: { name: 'ASC' },
        });
    }
    async findOne(id, company) {
        const whereClause = company.role === user_entity_1.UserRole.SUPER_ADMIN
            ? { template_id: id }
            : { template_id: id, company_id: company.company_id };
        const template = await this.templateRepository.findOne({
            where: whereClause,
        });
        if (!template) {
            throw new common_1.NotFoundException('Schedule template not found');
        }
        return template;
    }
    async update(id, updateTemplateDto, company) {
        const template = await this.findOne(id, company);
        Object.assign(template, updateTemplateDto);
        return await this.templateRepository.save(template);
    }
    async remove(id, company) {
        const template = await this.findOne(id, company);
        await this.templateRepository.remove(template);
    }
};
exports.ScheduleTemplatesService = ScheduleTemplatesService;
exports.ScheduleTemplatesService = ScheduleTemplatesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(schedule_template_entity_1.ScheduleTemplate)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ScheduleTemplatesService);
//# sourceMappingURL=schedule-templates.service.js.map