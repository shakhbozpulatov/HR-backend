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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const attendance_record_entity_1 = require("../attendance/entities/attendance-record.entity");
const payroll_item_entity_1 = require("../payroll/entities/payroll-item.entity");
const employee_entity_1 = require("../employees/entities/employee.entity");
let AnalyticsService = class AnalyticsService {
    constructor(attendanceRepository, payrollRepository, employeeRepository) {
        this.attendanceRepository = attendanceRepository;
        this.payrollRepository = payrollRepository;
        this.employeeRepository = employeeRepository;
    }
    async getAttendanceMetrics(filterDto) {
        const { start_date, end_date, department, location } = filterDto;
        const queryBuilder = this.attendanceRepository
            .createQueryBuilder('record')
            .leftJoin('record.employee', 'employee')
            .where('record.date BETWEEN :start_date AND :end_date', {
            start_date,
            end_date,
        });
        if (department) {
            queryBuilder.andWhere('employee.department = :department', {
                department,
            });
        }
        if (location) {
            queryBuilder.andWhere('employee.location = :location', { location });
        }
        const totalRecords = await queryBuilder.getCount();
        const okRecords = await queryBuilder
            .andWhere('record.status = :status', { status: attendance_record_entity_1.AttendanceStatus.OK })
            .getCount();
        const attendanceRate = totalRecords > 0 ? (okRecords / totalRecords) * 100 : 0;
        const latenessData = await queryBuilder
            .select([
            'employee.employee_id',
            'employee.first_name',
            'employee.last_name',
            'employee.department',
            'COUNT(record.record_id) as late_count',
            'SUM(record.late_minutes) as total_late_minutes',
        ])
            .where('record.late_minutes > 0')
            .groupBy('employee.employee_id, employee.first_name, employee.last_name, employee.department')
            .getRawMany();
        const overtimeData = await queryBuilder
            .select([
            'employee.department',
            'SUM(record.overtime_minutes) as total_overtime_minutes',
            'COUNT(CASE WHEN record.overtime_minutes > 0 THEN 1 END) as overtime_days',
        ])
            .groupBy('employee.department')
            .getRawMany();
        return {
            attendance_rate: attendanceRate,
            total_records: totalRecords,
            ok_records: okRecords,
            lateness_by_employee: latenessData,
            overtime_by_department: overtimeData,
        };
    }
    async getPayrollMetrics(filterDto) {
        const { start_date, end_date, department, location } = filterDto;
        const queryBuilder = this.payrollRepository
            .createQueryBuilder('item')
            .leftJoin('item.employee', 'employee')
            .leftJoin('item.period', 'period')
            .where('period.start_date >= :start_date AND period.end_date <= :end_date', {
            start_date,
            end_date,
        });
        if (department) {
            queryBuilder.andWhere('employee.department = :department', {
                department,
            });
        }
        if (location) {
            queryBuilder.andWhere('employee.location = :location', { location });
        }
        const totalCost = await queryBuilder
            .select('SUM(item.amount)', 'total')
            .where('item.type = :type', { type: payroll_item_entity_1.PayrollItemType.EARNING })
            .getRawOne();
        const costByDepartment = await queryBuilder
            .select([
            'employee.department',
            'SUM(item.amount) as total_cost',
            'COUNT(DISTINCT employee.employee_id) as employee_count',
        ])
            .where('item.type = :type', { type: payroll_item_entity_1.PayrollItemType.EARNING })
            .groupBy('employee.department')
            .getRawMany();
        const overtimeCost = await queryBuilder
            .select('SUM(item.amount)', 'total')
            .where('item.code = :code', { code: 'OVERTIME' })
            .getRawOne();
        const monthlyTrend = await queryBuilder
            .select([
            "DATE_TRUNC('month', period.start_date) as month",
            'SUM(item.amount) as total_cost',
        ])
            .where('item.type = :type', { type: payroll_item_entity_1.PayrollItemType.EARNING })
            .groupBy("DATE_TRUNC('month', period.start_date)")
            .orderBy('month', 'ASC')
            .getRawMany();
        return {
            total_cost: totalCost?.total || 0,
            overtime_cost: overtimeCost?.total || 0,
            cost_by_department: costByDepartment,
            monthly_trend: monthlyTrend,
        };
    }
    async getDashboardSummary(filterDto) {
        const [attendanceMetrics, payrollMetrics] = await Promise.all([
            this.getAttendanceMetrics(filterDto),
            this.getPayrollMetrics(filterDto),
        ]);
        const activeEmployees = await this.employeeRepository.count({
            where: { status: 'active' },
        });
        const topLateEmployees = attendanceMetrics.lateness_by_employee
            .sort((a, b) => b.total_late_minutes - a.total_late_minutes)
            .slice(0, 10);
        return {
            active_employees: activeEmployees,
            attendance_rate: attendanceMetrics.attendance_rate,
            total_payroll_cost: payrollMetrics.total_cost,
            overtime_cost: payrollMetrics.overtime_cost,
            top_late_employees: topLateEmployees,
            payroll_trend: payrollMetrics.monthly_trend,
        };
    }
    async exportAnalytics(filterDto, format = 'xlsx') {
        const [attendanceMetrics, payrollMetrics] = await Promise.all([
            this.getAttendanceMetrics(filterDto),
            this.getPayrollMetrics(filterDto),
        ]);
        const exportData = {
            summary: {
                attendance_rate: attendanceMetrics.attendance_rate,
                total_payroll_cost: payrollMetrics.total_cost,
                overtime_cost: payrollMetrics.overtime_cost,
            },
            lateness_details: attendanceMetrics.lateness_by_employee,
            overtime_by_department: attendanceMetrics.overtime_by_department,
            cost_by_department: payrollMetrics.cost_by_department,
            monthly_trend: payrollMetrics.monthly_trend,
        };
        if (format === 'csv') {
            return this.generateCsv(exportData);
        }
        else {
            return this.generateExcel(exportData);
        }
    }
    generateCsv(data) {
        const csvRows = [];
        csvRows.push('SUMMARY');
        csvRows.push(`Attendance Rate,${data.summary.attendance_rate.toFixed(2)}%`);
        csvRows.push(`Total Payroll Cost,${data.summary.total_payroll_cost}`);
        csvRows.push(`Overtime Cost,${data.summary.overtime_cost}`);
        csvRows.push('');
        csvRows.push('LATENESS BY EMPLOYEE');
        csvRows.push('Employee ID,First Name,Last Name,Department,Late Count,Total Late Minutes');
        data.lateness_details.forEach((emp) => {
            csvRows.push(`${emp.employee_id},${emp.first_name},${emp.last_name},${emp.department},${emp.late_count},${emp.total_late_minutes}`);
        });
        return csvRows.join('\n');
    }
    generateExcel(data) {
        const XLSX = require('xlsx');
        const workbook = XLSX.utils.book_new();
        const summaryData = [
            ['Metric', 'Value'],
            ['Attendance Rate', `${data.summary.attendance_rate.toFixed(2)}%`],
            ['Total Payroll Cost', data.summary.total_payroll_cost],
            ['Overtime Cost', data.summary.overtime_cost],
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
        const latenessData = [
            [
                'Employee ID',
                'First Name',
                'Last Name',
                'Department',
                'Late Count',
                'Total Late Minutes',
            ],
            ...data.lateness_details.map((emp) => [
                emp.employee_id,
                emp.first_name,
                emp.last_name,
                emp.department,
                emp.late_count,
                emp.total_late_minutes,
            ]),
        ];
        const latenessSheet = XLSX.utils.aoa_to_sheet(latenessData);
        XLSX.utils.book_append_sheet(workbook, latenessSheet, 'Lateness');
        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attendance_record_entity_1.AttendanceRecord)),
    __param(1, (0, typeorm_1.InjectRepository)(payroll_item_entity_1.PayrollItem)),
    __param(2, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map