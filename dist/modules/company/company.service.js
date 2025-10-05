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
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const company_entity_1 = require("./entities/company.entity");
const department_entity_1 = require("./entities/department.entity");
let CompaniesService = class CompaniesService {
    constructor(companyRepository, departmentRepository) {
        this.companyRepository = companyRepository;
        this.departmentRepository = departmentRepository;
    }
    async create(createCompanyDto) {
        const existingCompany = await this.companyRepository.findOne({
            where: [{ tax_id: createCompanyDto.tax_id }],
        });
        if (existingCompany) {
            throw new common_1.BadRequestException('Company code or tax ID already exists');
        }
        const company = this.companyRepository.create({
            ...createCompanyDto,
            settings: {
                timezone: createCompanyDto.timezone || 'Asia/Tashkent',
                currency: createCompanyDto.currency || 'UZS',
                date_format: 'YYYY-MM-DD',
                time_format: '24h',
                week_start: 'Monday',
                fiscal_year_start: '01-01',
                default_language: 'uz',
            },
            payroll_settings: {
                overtime_multiplier: 1.5,
                grace_in_minutes: 5,
                grace_out_minutes: 0,
                rounding_minutes: 5,
                overtime_threshold_minutes: 15,
            },
        });
        const savedCompany = await this.companyRepository.save(company);
        await this.createDefaultDepartments(savedCompany.id);
        return savedCompany;
    }
    async findAll(status) {
        const query = this.companyRepository.createQueryBuilder('company');
        if (status) {
            query.where('company.status = :status', { status });
        }
        return await query
            .leftJoinAndSelect('company.departments', 'departments')
            .orderBy('company.name', 'ASC')
            .getMany();
    }
    async findOne(id) {
        const company = await this.companyRepository.findOne({
            where: { id: id },
            relations: ['departments', 'users'],
        });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        return company;
    }
    async update(id, updateCompanyDto) {
        const company = await this.findOne(id);
        Object.assign(company, updateCompanyDto);
        return await this.companyRepository.save(company);
    }
    async updateStatus(id, status) {
        const company = await this.findOne(id);
        if (!Object.values(company_entity_1.CompanyStatus).includes(status)) {
            throw new common_1.BadRequestException('Invalid status');
        }
        company.status = status;
        return await this.companyRepository.save(company);
    }
    async updateSubscription(id, plan, startDate, endDate) {
        const company = await this.findOne(id);
        company.subscription_plan = plan;
        company.subscription_start_date = startDate;
        company.subscription_end_date = endDate;
        switch (plan) {
            case company_entity_1.SubscriptionPlan.FREE:
                company.max_employees = 10;
                break;
            case company_entity_1.SubscriptionPlan.BASIC:
                company.max_employees = 50;
                break;
            case company_entity_1.SubscriptionPlan.PROFESSIONAL:
                company.max_employees = 200;
                break;
            case company_entity_1.SubscriptionPlan.ENTERPRISE:
                company.max_employees = 9999;
                break;
        }
        return await this.companyRepository.save(company);
    }
    async getCompanyStats(companyId) {
        const company = await this.findOne(companyId);
        const stats = await this.companyRepository
            .createQueryBuilder('company')
            .leftJoin('company.users', 'user')
            .leftJoin('company.departments', 'department')
            .select([
            'COUNT(DISTINCT user.id) AS total_users',
            'COUNT(DISTINCT CASE WHEN user.active = true THEN user.id END) AS active_users',
            'COUNT(DISTINCT department.id) AS total_departments',
        ])
            .where('company.id = :companyId', { companyId })
            .getRawOne();
        return {
            company: {
                id: company.id,
                name: company.name,
                status: company.status,
                subscription_plan: company.subscription_plan,
                max_employees: company.max_employees,
            },
            stats: {
                total_users: parseInt(stats.total_users) || 0,
                active_users: parseInt(stats.active_users) || 0,
                total_departments: parseInt(stats.total_departments) || 0,
                employees_remaining: company.max_employees - (parseInt(stats.total_users) || 0),
            },
        };
    }
    async createDefaultDepartments(companyId) {
        const defaultDepartments = [
            { code: 'ADMIN', name: 'Administration' },
            { code: 'HR', name: 'Human Resources' },
            { code: 'IT', name: 'Information Technology' },
            { code: 'FIN', name: 'Finance' },
            { code: 'OPS', name: 'Operations' },
        ];
        for (const dept of defaultDepartments) {
            const department = this.departmentRepository.create({
                company_id: companyId,
                ...dept,
            });
            await this.departmentRepository.save(department);
        }
    }
    async createDepartment(companyId, createDepartmentDto) {
        await this.findOne(companyId);
        const department = this.departmentRepository.create({
            ...createDepartmentDto,
            company_id: companyId,
        });
        return await this.departmentRepository.save(department);
    }
    async getDepartments(companyId) {
        return await this.departmentRepository.find({
            where: { company_id: companyId, active: true },
            relations: ['users'],
            order: { name: 'ASC' },
        });
    }
    async updateDepartment(departmentId, updateDto) {
        const department = await this.departmentRepository.findOne({
            where: { id: departmentId },
        });
        if (!department) {
            throw new common_1.NotFoundException('Department not found');
        }
        Object.assign(department, updateDto);
        return await this.departmentRepository.save(department);
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __param(1, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], CompaniesService);
//# sourceMappingURL=company.service.js.map