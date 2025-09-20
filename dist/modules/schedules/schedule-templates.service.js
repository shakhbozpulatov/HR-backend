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
let ScheduleTemplatesService = class ScheduleTemplatesService {
    constructor(templateRepository) {
        this.templateRepository = templateRepository;
    }
    async create(createTemplateDto) {
        const template = this.templateRepository.create(createTemplateDto);
        return await this.templateRepository.save(template);
    }
    async findAll() {
        return await this.templateRepository.find({
            order: { name: 'ASC' },
        });
    }
    async findOne(id) {
        const template = await this.templateRepository.findOne({
            where: { template_id: id },
        });
        if (!template) {
            throw new common_1.NotFoundException('Schedule template not found');
        }
        return template;
    }
    async update(id, updateTemplateDto) {
        const template = await this.findOne(id);
        Object.assign(template, updateTemplateDto);
        return await this.templateRepository.save(template);
    }
    async remove(id) {
        const template = await this.findOne(id);
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