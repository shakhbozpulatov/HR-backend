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
exports.CompanyService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const company_entity_1 = require("../../company/entities/company.entity");
const user_entity_1 = require("../../users/entities/user.entity");
let CompanyService = class CompanyService {
    constructor(companyRepository, userRepository) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }
    async generateUniqueCompanyCode() {
        const lastCompany = await this.companyRepository
            .createQueryBuilder('company')
            .where('company.code LIKE :prefix', { prefix: 'COM%' })
            .orderBy('company.code', 'DESC')
            .getOne();
        if (!lastCompany) {
            return 'COM001';
        }
        const match = lastCompany.code.match(/COM(\d+)/);
        if (!match) {
            return 'COM001';
        }
        const lastNumber = parseInt(match[1], 10);
        const newNumber = lastNumber + 1;
        return `COM${newNumber.toString().padStart(3, '0')}`;
    }
    async getCompanyStatistics(companyId) {
        const totalUsers = await this.userRepository.count({
            where: { company_id: companyId },
        });
        const activeUsers = await this.userRepository.count({
            where: {
                company_id: companyId,
                active: true,
                status: user_entity_1.UserStatus.ACTIVE,
            },
        });
        return {
            total_users: totalUsers,
            active_users: activeUsers,
            inactive_users: totalUsers - activeUsers,
        };
    }
};
exports.CompanyService = CompanyService;
exports.CompanyService = CompanyService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], CompanyService);
//# sourceMappingURL=company.service.js.map