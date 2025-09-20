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
exports.PayrollService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payroll_period_entity_1 = require("./entities/payroll-period.entity");
const payroll_item_entity_1 = require("./entities/payroll-item.entity");
const work_volume_entry_entity_1 = require("./entities/work-volume-entry.entity");
let PayrollService = class PayrollService {
    constructor(periodRepository, itemRepository, volumeRepository) {
        this.periodRepository = periodRepository;
        this.itemRepository = itemRepository;
        this.volumeRepository = volumeRepository;
    }
    async createPeriod(createPeriodDto, actorId) {
        const period = this.periodRepository.create(createPeriodDto);
        return await this.periodRepository.save(period);
    }
    async findAllPeriods(filterDto) {
        const { page = 1, limit = 10, status } = filterDto;
        const queryBuilder = this.periodRepository.createQueryBuilder('period');
        if (status) {
            queryBuilder.andWhere('period.status = :status', { status });
        }
        const [data, total] = await queryBuilder
            .orderBy('period.start_date', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return { data, total };
    }
    async findOnePeriod(id) {
        const period = await this.periodRepository.findOne({
            where: { period_id: id },
            relations: ['items', 'items.employee'],
        });
        if (!period) {
            throw new common_1.NotFoundException('Payroll period not found');
        }
        return period;
    }
    async processPeriod(id, actorId) {
        const period = await this.findOnePeriod(id);
        if (period.status !== payroll_period_entity_1.PeriodStatus.OPEN) {
            throw new Error('Period is not open for processing');
        }
        period.status = payroll_period_entity_1.PeriodStatus.PROCESSED;
        period.close_date = new Date();
        return await this.periodRepository.save(period);
    }
    async lockPeriod(id, actorId) {
        const period = await this.findOnePeriod(id);
        period.status = payroll_period_entity_1.PeriodStatus.LOCKED;
        return await this.periodRepository.save(period);
    }
    async unlockPeriod(id, actorId) {
        const period = await this.findOnePeriod(id);
        period.status = payroll_period_entity_1.PeriodStatus.OPEN;
        return await this.periodRepository.save(period);
    }
    async findPeriodItems(periodId, filterDto) {
        const { page = 1, limit = 10, employee_id } = filterDto;
        const queryBuilder = this.itemRepository
            .createQueryBuilder('item')
            .leftJoinAndSelect('item.employee', 'employee')
            .where('item.period_id = :periodId', { periodId });
        if (employee_id) {
            queryBuilder.andWhere('item.employee_id = :employee_id', { employee_id });
        }
        const [data, total] = await queryBuilder
            .orderBy('employee.last_name', 'ASC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return { data, total };
    }
    async createPayrollItem(periodId, createItemDto, actorId) {
        const item = this.itemRepository.create({
            ...createItemDto,
            period_id: periodId,
        });
        return await this.itemRepository.save(item);
    }
    async getPeriodSummary(id) {
        const period = await this.findOnePeriod(id);
        const items = period.items || [];
        const summary = {
            total_employees: new Set(items.map((item) => item.employee_id)).size,
            total_earnings: items
                .filter((item) => item.type === 'EARNING')
                .reduce((sum, item) => sum + Number(item.amount), 0),
            total_deductions: items
                .filter((item) => item.type === 'DEDUCTION')
                .reduce((sum, item) => sum + Number(item.amount), 0),
            by_department: {},
        };
        return summary;
    }
    async exportPeriod(id, format) {
        const period = await this.findOnePeriod(id);
        return Buffer.from(`Export for period ${period.period_id} in ${format} format`);
    }
    async importVolumeEntries(file, actorId) {
        return { success: true, imported: 0 };
    }
    async getEmployeePayslip(employeeId, periodId) {
        const items = await this.itemRepository.find({
            where: { employee_id: employeeId, period_id: periodId },
            relations: ['employee', 'period'],
        });
        return {
            employee: items[0]?.employee,
            period: items[0]?.period,
            items: items,
            summary: {
                total_earnings: items
                    .filter((item) => item.type === 'EARNING')
                    .reduce((sum, item) => sum + Number(item.amount), 0),
                total_deductions: items
                    .filter((item) => item.type === 'DEDUCTION')
                    .reduce((sum, item) => sum + Number(item.amount), 0),
            },
        };
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payroll_period_entity_1.PayrollPeriod)),
    __param(1, (0, typeorm_1.InjectRepository)(payroll_item_entity_1.PayrollItem)),
    __param(2, (0, typeorm_1.InjectRepository)(work_volume_entry_entity_1.WorkVolumeEntry)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PayrollService);
//# sourceMappingURL=payroll.service.js.map