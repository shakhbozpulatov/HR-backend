import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PayrollPeriod, PeriodStatus } from './entities/payroll-period.entity';
import {
  PayrollItem,
  PayrollItemType,
  PayrollItemCode,
  PayrollItemSource,
} from './entities/payroll-item.entity';
import { WorkVolumeEntry } from './entities/work-volume-entry.entity';
import {
  AttendanceRecord,
  AttendanceStatus,
} from '../attendance/entities/attendance-record.entity';
import { Employee, TariffType } from '../employees/entities/employee.entity';
import * as moment from 'moment';

@Injectable()
export class PayrollProcessorService {
  private readonly overtimeMultiplier: number;

  constructor(
    @InjectRepository(PayrollPeriod)
    private periodRepository: Repository<PayrollPeriod>,
    @InjectRepository(PayrollItem)
    private itemRepository: Repository<PayrollItem>,
    @InjectRepository(AttendanceRecord)
    private attendanceRepository: Repository<AttendanceRecord>,
    @InjectRepository(WorkVolumeEntry)
    private volumeRepository: Repository<WorkVolumeEntry>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private configService: ConfigService,
  ) {
    this.overtimeMultiplier = this.configService.get(
      'OVERTIME_MULTIPLIER',
      1.5,
    );
  }

  async processPayrollPeriod(periodId: string): Promise<void> {
    const period = await this.periodRepository.findOne({
      where: { period_id: periodId },
    });

    if (!period || period.status !== PeriodStatus.OPEN) {
      throw new Error('Period not found or not open for processing');
    }

    // Get all active employees
    const employees = await this.employeeRepository.find({
      where: { status: 'active' as any },
    });

    // Clear existing auto-generated items for this period
    await this.itemRepository.delete({
      period_id: periodId,
      source: PayrollItemSource.AUTO,
    });

    // Process each employee
    for (const employee of employees) {
      await this.processEmployeePayroll(employee, period);
    }
  }

  private async processEmployeePayroll(
    employee: Employee,
    period: PayrollPeriod,
  ): Promise<void> {
    // Get attendance records for the period
    const attendanceRecords = await this.attendanceRepository.find({
      where: {
        employee_id: employee.employee_id,
        date: Between(period.start_date, period.end_date),
      },
    });

    // Calculate base pay
    if (employee.tariff_type === TariffType.HOURLY) {
      await this.processHourlyEmployee(employee, period, attendanceRecords);
    } else {
      await this.processMonthlyEmployee(employee, period, attendanceRecords);
    }

    // Process overtime
    await this.processOvertime(employee, period, attendanceRecords);

    // Process holiday premium (if configured)
    await this.processHolidayPremium(employee, period, attendanceRecords);

    // Process piecework
    await this.processPiecework(employee, period);
  }

  private async processHourlyEmployee(
    employee: Employee,
    period: PayrollPeriod,
    records: AttendanceRecord[],
  ): Promise<void> {
    const approvedRecords = records.filter(
      (r) =>
        r.status === AttendanceStatus.OK &&
        r.approvals?.some((a) => a.approved_at),
    );

    const totalWorkedHours = approvedRecords.reduce((sum, record) => {
      return sum + record.worked_minutes / 60;
    }, 0);

    if (totalWorkedHours > 0 && employee.hourly_rate) {
      await this.createPayrollItem({
        employee_id: employee.employee_id,
        period_id: period.period_id,
        type: PayrollItemType.EARNING,
        code: PayrollItemCode.BASE_HOURLY,
        quantity: totalWorkedHours,
        rate: employee.hourly_rate,
        amount: totalWorkedHours * Number(employee.hourly_rate),
        source: PayrollItemSource.AUTO,
      });
    }
  }

  private async processMonthlyEmployee(
    employee: Employee,
    period: PayrollPeriod,
    records: AttendanceRecord[],
  ): Promise<void> {
    if (!employee.monthly_salary) return;

    const scheduledRecords = records.filter(
      (r) => r.scheduled_start && r.scheduled_end,
    );

    const totalScheduledMinutes = scheduledRecords.reduce((sum, record) => {
      const start = moment(record.scheduled_start, 'HH:mm');
      const end = moment(record.scheduled_end, 'HH:mm');
      if (end.isBefore(start)) end.add(1, 'day'); // Handle cross-midnight
      return sum + end.diff(start, 'minutes');
    }, 0);

    const absentRecords = records.filter(
      (r) =>
        r.status === AttendanceStatus.ABSENT &&
        r.scheduled_start &&
        r.scheduled_end,
    );

    const unpaidAbsentMinutes = absentRecords.reduce((sum, record) => {
      if (
        record.manual_adjustments?.some(
          (adj) => adj.type === 'MARK_ABSENT_PAID',
        )
      ) {
        return sum; // This absence is paid
      }
      const start = moment(record.scheduled_start, 'HH:mm');
      const end = moment(record.scheduled_end, 'HH:mm');
      if (end.isBefore(start)) end.add(1, 'day');
      return sum + end.diff(start, 'minutes');
    }, 0);

    // Calculate proration
    let baseSalary = Number(employee.monthly_salary);
    if (totalScheduledMinutes > 0 && unpaidAbsentMinutes > 0) {
      const prorationRatio = 1 - unpaidAbsentMinutes / totalScheduledMinutes;
      baseSalary = baseSalary * prorationRatio;
    }

    await this.createPayrollItem({
      employee_id: employee.employee_id,
      period_id: period.period_id,
      type: PayrollItemType.EARNING,
      code: PayrollItemCode.BASE_MONTHLY,
      quantity: 1,
      rate: baseSalary,
      amount: baseSalary,
      source: PayrollItemSource.AUTO,
    });
  }

  private async processOvertime(
    employee: Employee,
    period: PayrollPeriod,
    records: AttendanceRecord[],
  ): Promise<void> {
    const approvedRecords = records.filter(
      (r) =>
        r.status === AttendanceStatus.OK &&
        r.approvals?.some((a) => a.approved_at),
    );

    const totalOvertimeHours = approvedRecords.reduce((sum, record) => {
      return sum + record.overtime_minutes / 60;
    }, 0);

    if (totalOvertimeHours > 0) {
      const baseRate =
        employee.tariff_type === TariffType.HOURLY
          ? Number(employee.hourly_rate)
          : this.calculateHourlyRateFromMonthlySalary(
              Number(employee.monthly_salary),
            );

      const overtimeRate = baseRate * this.overtimeMultiplier;

      await this.createPayrollItem({
        employee_id: employee.employee_id,
        period_id: period.period_id,
        type: PayrollItemType.EARNING,
        code: PayrollItemCode.OVERTIME,
        quantity: totalOvertimeHours,
        rate: overtimeRate,
        amount: totalOvertimeHours * overtimeRate,
        source: PayrollItemSource.AUTO,
      });
    }
  }

  private async processHolidayPremium(
    employee: Employee,
    period: PayrollPeriod,
    records: AttendanceRecord[],
  ): Promise<void> {
    const holidayRecords = records.filter(
      (r) => r.status === AttendanceStatus.HOLIDAY && r.worked_minutes > 0,
    );

    const totalHolidayHours = holidayRecords.reduce((sum, record) => {
      return sum + record.worked_minutes / 60;
    }, 0);

    if (totalHolidayHours > 0) {
      const baseRate =
        employee.tariff_type === TariffType.HOURLY
          ? Number(employee.hourly_rate)
          : this.calculateHourlyRateFromMonthlySalary(
              Number(employee.monthly_salary),
            );

      // Holiday premium could be configurable (e.g., 2.0x)
      const holidayMultiplier = this.configService.get(
        'HOLIDAY_MULTIPLIER',
        2.0,
      );
      const holidayRate = baseRate * holidayMultiplier;

      await this.createPayrollItem({
        employee_id: employee.employee_id,
        period_id: period.period_id,
        type: PayrollItemType.EARNING,
        code: PayrollItemCode.HOLIDAY_PREMIUM,
        quantity: totalHolidayHours,
        rate: holidayRate,
        amount: totalHolidayHours * holidayRate,
        source: PayrollItemSource.AUTO,
      });
    }
  }

  private async processPiecework(
    employee: Employee,
    period: PayrollPeriod,
  ): Promise<void> {
    const volumeEntries = await this.volumeRepository.find({
      where: {
        employee_id: employee.employee_id,
        date: Between(period.start_date, period.end_date),
        approved: true,
      },
    });

    const totalAmount = volumeEntries.reduce((sum, entry) => {
      return sum + Number(entry.quantity) * Number(entry.unit_rate);
    }, 0);

    if (totalAmount > 0) {
      await this.createPayrollItem({
        employee_id: employee.employee_id,
        period_id: period.period_id,
        type: PayrollItemType.EARNING,
        code: PayrollItemCode.PIECEWORK,
        quantity: volumeEntries.length,
        rate: totalAmount / volumeEntries.length,
        amount: totalAmount,
        source: PayrollItemSource.AUTO,
        note: `${volumeEntries.length} piecework entries`,
      });
    }
  }

  private calculateHourlyRateFromMonthlySalary(monthlySalary: number): number {
    // Assume 22 working days per month, 8 hours per day
    const standardMonthlyHours = 22 * 8;
    return monthlySalary / standardMonthlyHours;
  }

  private async createPayrollItem(
    itemData: Partial<PayrollItem>,
  ): Promise<PayrollItem> {
    const item = this.itemRepository.create(itemData);
    return await this.itemRepository.save(item);
  }

  async getPeriodSummary(periodId: string): Promise<any> {
    const items = await this.itemRepository.find({
      where: { period_id: periodId },
      relations: ['employee'],
    });

    const summary = {
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      employeeCount: 0,
      byDepartment: {},
      byLocation: {},
    };

    const employeeMap = new Map();

    for (const item of items) {
      if (!employeeMap.has(item.employee_id)) {
        employeeMap.set(item.employee_id, {
          employee: item.employee,
          earnings: 0,
          deductions: 0,
          net: 0,
        });
      }

      const emp = employeeMap.get(item.employee_id);

      if (item.type === PayrollItemType.EARNING) {
        emp.earnings += Number(item.amount);
        summary.totalGross += Number(item.amount);
      } else {
        emp.deductions += Number(item.amount);
        summary.totalDeductions += Number(item.amount);
      }

      emp.net = emp.earnings - emp.deductions;
    }

    summary.employeeCount = employeeMap.size;
    summary.totalNet = summary.totalGross - summary.totalDeductions;

    // Group by department and location
    for (const [employeeId, emp] of employeeMap) {
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
}
