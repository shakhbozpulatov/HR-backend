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
exports.HolidaysService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const holiday_entity_1 = require("./entities/holiday.entity");
let HolidaysService = class HolidaysService {
    constructor(holidayRepository) {
        this.holidayRepository = holidayRepository;
    }
    async create(createHolidayDto) {
        const holiday = this.holidayRepository.create(createHolidayDto);
        return await this.holidayRepository.save(holiday);
    }
    async findAll(year, location) {
        const queryBuilder = this.holidayRepository.createQueryBuilder('holiday');
        if (year) {
            queryBuilder.andWhere('EXTRACT(YEAR FROM holiday.date) = :year', {
                year,
            });
        }
        if (location) {
            queryBuilder.andWhere('(holiday.location_scope = :location OR holiday.location_scope = :global)', {
                location,
                global: 'global',
            });
        }
        return await queryBuilder.orderBy('holiday.date', 'ASC').getMany();
    }
    async findOne(id) {
        const holiday = await this.holidayRepository.findOne({
            where: { holiday_id: id },
        });
        if (!holiday) {
            throw new common_1.NotFoundException('Holiday not found');
        }
        return holiday;
    }
    async update(id, updateHolidayDto) {
        const holiday = await this.findOne(id);
        Object.assign(holiday, updateHolidayDto);
        return await this.holidayRepository.save(holiday);
    }
    async remove(id) {
        const holiday = await this.findOne(id);
        await this.holidayRepository.remove(holiday);
    }
    async isHoliday(date, location = 'global') {
        const holiday = await this.holidayRepository.findOne({
            where: {
                date,
                location_scope: location,
            },
        });
        if (!holiday) {
            const globalHoliday = await this.holidayRepository.findOne({
                where: {
                    date,
                    location_scope: 'global',
                },
            });
            return !!globalHoliday;
        }
        return !!holiday;
    }
    async getHolidaysForDateRange(startDate, endDate, location = 'global') {
        return await this.holidayRepository
            .createQueryBuilder('holiday')
            .where('holiday.date BETWEEN :startDate AND :endDate', {
            startDate,
            endDate,
        })
            .andWhere('(holiday.location_scope = :location OR holiday.location_scope = :global)', {
            location,
            global: 'global',
        })
            .orderBy('holiday.date', 'ASC')
            .getMany();
    }
};
exports.HolidaysService = HolidaysService;
exports.HolidaysService = HolidaysService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(holiday_entity_1.Holiday)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], HolidaysService);
//# sourceMappingURL=holidays.service.js.map