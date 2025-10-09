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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollProcessorService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const payroll_period_entity_1 = require("./entities/payroll-period.entity");
const payroll_item_entity_1 = require("./entities/payroll-item.entity");
const work_volume_entry_entity_1 = require("./entities/work-volume-entry.entity");
const attendance_record_entity_1 = require("../attendance/entities/attendance-record.entity");
const moment_1 = __importDefault(require("moment"));
const user_entity_1 = require("../users/entities/user.entity");
let PayrollProcessorService = class PayrollProcessorService {
    constructor(periodRepository, itemRepository, attendanceRepository, volumeRepository, userRepository, configService) {
        this.periodRepository = periodRepository;
        this.itemRepository = itemRepository;
        this.attendanceRepository = attendanceRepository;
        this.volumeRepository = volumeRepository;
        this.userRepository = userRepository;
        this.configService = configService;
        this.overtimeMultiplier = this.configService.get('OVERTIME_MULTIPLIER', 1.5);
    }
    async processPayrollPeriod(periodId) {
        const period = await this.periodRepository.findOne({
            where: { period_id: periodId },
        });
        if (!period || period.status !== payroll_period_entity_1.PeriodStatus.OPEN) {
            throw new Error('Period not found or not open for processing');
        }
        const users = await this.userRepository.find({
            where: { status: 'active' },
        });
        await this.itemRepository.delete({
            period_id: periodId,
            source: payroll_item_entity_1.PayrollItemSource.AUTO,
        });
        for (const user of users) {
            await this.processUserPayroll(user, period);
        }
    }
    async processUserPayroll(user, period) {
        const attendanceRecords = await this.attendanceRepository.find({
            where: {
                user_id: user.id,
                date: (0, typeorm_2.Between)(period.start_date, period.end_date),
            },
        });
        if (user.tariff_type === user_entity_1.TariffType.HOURLY) {
            await this.processHourlyUser(user, period, attendanceRecords);
        }
        else {
            await this.processMonthlyEmployee(user, period, attendanceRecords);
        }
        await this.processOvertime(user, period, attendanceRecords);
        await this.processHolidayPremium(user, period, attendanceRecords);
        await this.processPiecework(user, period);
    }
    async processHourlyUser(user, period, records) {
        const approvedRecords = records.filter((r) => r.status === attendance_record_entity_1.AttendanceStatus.OK &&
            r.approvals?.some((a) => a.approved_at));
        const totalWorkedHours = approvedRecords.reduce((sum, record) => {
            return sum + record.worked_minutes / 60;
        }, 0);
        if (totalWorkedHours > 0 && user.hourly_rate) {
            await this.createPayrollItem({
                user_id: user.id,
                period_id: period.period_id,
                type: payroll_item_entity_1.PayrollItemType.EARNING,
                code: payroll_item_entity_1.PayrollItemCode.BASE_HOURLY,
                quantity: totalWorkedHours,
                rate: user.hourly_rate,
                amount: totalWorkedHours * Number(user.hourly_rate),
                source: payroll_item_entity_1.PayrollItemSource.AUTO,
            });
        }
    }
    async processMonthlyEmployee(user, period, records) {
        if (!user.monthly_salary)
            return;
        const scheduledRecords = records.filter((r) => r.scheduled_start && r.scheduled_end);
        const totalScheduledMinutes = scheduledRecords.reduce((sum, record) => {
            const start = (0, moment_1.default)(record.scheduled_start, 'HH:mm');
            const end = (0, moment_1.default)(record.scheduled_end, 'HH:mm');
            if (end.isBefore(start))
                end.add(1, 'day');
            return sum + end.diff(start, 'minutes');
        }, 0);
        const absentRecords = records.filter((r) => r.status === attendance_record_entity_1.AttendanceStatus.ABSENT &&
            r.scheduled_start &&
            r.scheduled_end);
        const unpaidAbsentMinutes = absentRecords.reduce((sum, record) => {
            if (record.manual_adjustments?.some((adj) => adj.type === 'MARK_ABSENT_PAID')) {
                return sum;
            }
            const start = (0, moment_1.default)(record.scheduled_start, 'HH:mm');
            const end = (0, moment_1.default)(record.scheduled_end, 'HH:mm');
            if (end.isBefore(start))
                end.add(1, 'day');
            return sum + end.diff(start, 'minutes');
        }, 0);
        let baseSalary = Number(user.monthly_salary);
        if (totalScheduledMinutes > 0 && unpaidAbsentMinutes > 0) {
            const prorationRatio = 1 - unpaidAbsentMinutes / totalScheduledMinutes;
            baseSalary = baseSalary * prorationRatio;
        }
        await this.createPayrollItem({
            user_id: user.id,
            period_id: period.period_id,
            type: payroll_item_entity_1.PayrollItemType.EARNING,
            code: payroll_item_entity_1.PayrollItemCode.BASE_MONTHLY,
            quantity: 1,
            rate: baseSalary,
            amount: baseSalary,
            source: payroll_item_entity_1.PayrollItemSource.AUTO,
        });
    }
    async processOvertime(user, period, records) {
        const approvedRecords = records.filter((r) => r.status === attendance_record_entity_1.AttendanceStatus.OK &&
            r.approvals?.some((a) => a.approved_at));
        const totalOvertimeHours = approvedRecords.reduce((sum, record) => {
            return sum + record.overtime_minutes / 60;
        }, 0);
        if (totalOvertimeHours > 0) {
            const baseRate = user.tariff_type === user_entity_1.TariffType.HOURLY
                ? Number(user.hourly_rate)
                : this.calculateHourlyRateFromMonthlySalary(Number(user.monthly_salary));
            const overtimeRate = baseRate * this.overtimeMultiplier;
            await this.createPayrollItem({
                user_id: user.id,
                period_id: period.period_id,
                type: payroll_item_entity_1.PayrollItemType.EARNING,
                code: payroll_item_entity_1.PayrollItemCode.OVERTIME,
                quantity: totalOvertimeHours,
                rate: overtimeRate,
                amount: totalOvertimeHours * overtimeRate,
                source: payroll_item_entity_1.PayrollItemSource.AUTO,
            });
        }
    }
    async processHolidayPremium(user, period, records) {
        const holidayRecords = records.filter((r) => r.status === attendance_record_entity_1.AttendanceStatus.HOLIDAY && r.worked_minutes > 0);
        const totalHolidayHours = holidayRecords.reduce((sum, record) => {
            return sum + record.worked_minutes / 60;
        }, 0);
        if (totalHolidayHours > 0) {
            const baseRate = user.tariff_type === user_entity_1.TariffType.HOURLY
                ? Number(user.hourly_rate)
                : this.calculateHourlyRateFromMonthlySalary(Number(user.monthly_salary));
            const holidayMultiplier = this.configService.get('HOLIDAY_MULTIPLIER', 2.0);
            const holidayRate = baseRate * holidayMultiplier;
            await this.createPayrollItem({
                user_id: user.id,
                period_id: period.period_id,
                type: payroll_item_entity_1.PayrollItemType.EARNING,
                code: payroll_item_entity_1.PayrollItemCode.HOLIDAY_PREMIUM,
                quantity: totalHolidayHours,
                rate: holidayRate,
                amount: totalHolidayHours * holidayRate,
                source: payroll_item_entity_1.PayrollItemSource.AUTO,
            });
        }
    }
    async processPiecework(user, period) {
        const volumeEntries = await this.volumeRepository.find({
            where: {
                user_id: user.id,
                date: (0, typeorm_2.Between)(period.start_date, period.end_date),
                approved: true,
            },
        });
        const totalAmount = volumeEntries.reduce((sum, entry) => {
            return sum + Number(entry.quantity) * Number(entry.unit_rate);
        }, 0);
        if (totalAmount > 0) {
            await this.createPayrollItem({
                user_id: user.id,
                period_id: period.period_id,
                type: payroll_item_entity_1.PayrollItemType.EARNING,
                code: payroll_item_entity_1.PayrollItemCode.PIECEWORK,
                quantity: volumeEntries.length,
                rate: totalAmount / volumeEntries.length,
                amount: totalAmount,
                source: payroll_item_entity_1.PayrollItemSource.AUTO,
                note: `${volumeEntries.length} piecework entries`,
            });
        }
    }
    calculateHourlyRateFromMonthlySalary(monthlySalary) {
        const standardMonthlyHours = 22 * 8;
        return monthlySalary / standardMonthlyHours;
    }
    async createPayrollItem(itemData) {
        const item = this.itemRepository.create(itemData);
        return await this.itemRepository.save(item);
    }
    async getPeriodSummary(periodId) {
        const items = await this.itemRepository.find({
            where: { period_id: periodId },
            relations: ['employee'],
        });
        const summary = {
            totalGross: 0,
            totalDeductions: 0,
            totalNet: 0,
            userCount: 0,
            byDepartment: {},
            byLocation: {},
        };
        const userMap = new Map();
        for (const item of items) {
            if (!userMap.has(item.user_id)) {
                userMap.set(item.user_id, {
                    user: item.user,
                    earnings: 0,
                    deductions: 0,
                    net: 0,
                });
            }
            const emp = userMap.get(item.user_id);
            if (item.type === payroll_item_entity_1.PayrollItemType.EARNING) {
                emp.earnings += Number(item.amount);
                summary.totalGross += Number(item.amount);
            }
            else {
                emp.deductions += Number(item.amount);
                summary.totalDeductions += Number(item.amount);
            }
            emp.net = emp.earnings - emp.deductions;
        }
        summary.userCount = userMap.size;
        summary.totalNet = summary.totalGross - summary.totalDeductions;
        for (const [_userId, emp] of userMap) {
            const dept = emp.employee.department || 'Unknown';
            const loc = emp.employee.location || 'Unknown';
            if (!summary.byDepartment[dept]) {
                summary.byDepartment[dept] = { gross: 0, net: 0, count: 0 };
            }
            if (!summary.byLocation[loc]) {
                summary.byLocation[loc] = { gross: 0, net: 0, count: 0 };
            }
            summary.byDepartment[dept].gross += emp.earnings;
            summary.byDepartment[dept].net += emp.net;
            summary.byDepartment[dept].count++;
            summary.byLocation[loc].gross += emp.earnings;
            summary.byLocation[loc].net += emp.net;
            summary.byLocation[loc].count++;
        }
        return summary;
    }
};
exports.PayrollProcessorService = PayrollProcessorService;
exports.PayrollProcessorService = PayrollProcessorService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payroll_period_entity_1.PayrollPeriod)),
    __param(1, (0, typeorm_1.InjectRepository)(payroll_item_entity_1.PayrollItem)),
    __param(2, (0, typeorm_1.InjectRepository)(attendance_record_entity_1.AttendanceRecord)),
    __param(3, (0, typeorm_1.InjectRepository)(work_volume_entry_entity_1.WorkVolumeEntry)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], PayrollProcessorService);
//# sourceMappingURL=payroll-processor.service.js.map