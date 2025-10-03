import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AttendanceRecord,
  AttendanceStatus,
} from '../attendance/entities/attendance-record.entity';
import {
  PayrollItem,
  PayrollItemType,
} from '../payroll/entities/payroll-item.entity';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
import { User } from '@/modules/users/entities/user.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AttendanceRecord)
    private attendanceRepository: Repository<AttendanceRecord>,
    @InjectRepository(PayrollItem)
    private payrollRepository: Repository<PayrollItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getAttendanceMetrics(filterDto: AnalyticsFilterDto) {
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

    // Attendance rate calculation
    const totalRecords = await queryBuilder.getCount();
    const okRecords = await queryBuilder
      .andWhere('record.status = :status', { status: AttendanceStatus.OK })
      .getCount();

    const attendanceRate =
      totalRecords > 0 ? (okRecords / totalRecords) * 100 : 0;

    // Lateness metrics
    const latenessData = await queryBuilder
      .select([
        'user.id',
        'user.first_name',
        'user.last_name',
        'user.department',
        'COUNT(record.record_id) as late_count',
        'SUM(record.late_minutes) as total_late_minutes',
      ])
      .where('record.late_minutes > 0')
      .groupBy('user.user_id, user.first_name, user.last_name, user.department')
      .getRawMany();

    // Overtime metrics
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
      lateness_by_user: latenessData,
      overtime_by_department: overtimeData,
    };
  }

  async getPayrollMetrics(filterDto: AnalyticsFilterDto) {
    const { start_date, end_date, department, location } = filterDto;

    const queryBuilder = this.payrollRepository
      .createQueryBuilder('item')
      .leftJoin('item.employee', 'employee')
      .leftJoin('item.period', 'period')
      .where(
        'period.start_date >= :start_date AND period.end_date <= :end_date',
        {
          start_date,
          end_date,
        },
      );

    if (department) {
      queryBuilder.andWhere('employee.department = :department', {
        department,
      });
    }

    if (location) {
      queryBuilder.andWhere('employee.location = :location', { location });
    }

    // Total payroll cost
    const totalCost = await queryBuilder
      .select('SUM(item.amount)', 'total')
      .where('item.type = :type', { type: PayrollItemType.EARNING })
      .getRawOne();

    // Cost by department
    const costByDepartment = await queryBuilder
      .select([
        'user.department',
        'SUM(item.amount) as total_cost',
        'COUNT(DISTINCT user.user_id) as user_count',
      ])
      .where('item.type = :type', { type: PayrollItemType.EARNING })
      .groupBy('user.department')
      .getRawMany();

    // Overtime cost
    const overtimeCost = await queryBuilder
      .select('SUM(item.amount)', 'total')
      .where('item.code = :code', { code: 'OVERTIME' })
      .getRawOne();

    // Monthly trend
    const monthlyTrend = await queryBuilder
      .select([
        "DATE_TRUNC('month', period.start_date) as month",
        'SUM(item.amount) as total_cost',
      ])
      .where('item.type = :type', { type: PayrollItemType.EARNING })
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

  async getDashboardSummary(filterDto: AnalyticsFilterDto) {
    const [attendanceMetrics, payrollMetrics] = await Promise.all([
      this.getAttendanceMetrics(filterDto),
      this.getPayrollMetrics(filterDto),
    ]);

    // Active employees count
    const activeUsers = await this.userRepository.count({
      where: { status: 'active' as any },
    });

    // Top late employees
    const topLateUsers = attendanceMetrics.lateness_by_user
      .sort((a, b) => b.total_late_minutes - a.total_late_minutes)
      .slice(0, 10);

    return {
      active_users: activeUsers,
      attendance_rate: attendanceMetrics.attendance_rate,
      total_payroll_cost: payrollMetrics.total_cost,
      overtime_cost: payrollMetrics.overtime_cost,
      top_late_users: topLateUsers,
      payroll_trend: payrollMetrics.monthly_trend,
    };
  }

  async exportAnalytics(
    filterDto: AnalyticsFilterDto,
    format: 'csv' | 'xlsx' = 'xlsx',
  ) {
    const [attendanceMetrics, payrollMetrics] = await Promise.all([
      this.getAttendanceMetrics(filterDto),
      this.getPayrollMetrics(filterDto),
    ]);

    // Prepare data for export
    const exportData = {
      summary: {
        attendance_rate: attendanceMetrics.attendance_rate,
        total_payroll_cost: payrollMetrics.total_cost,
        overtime_cost: payrollMetrics.overtime_cost,
      },
      lateness_details: attendanceMetrics.lateness_by_user,
      overtime_by_department: attendanceMetrics.overtime_by_department,
      cost_by_department: payrollMetrics.cost_by_department,
      monthly_trend: payrollMetrics.monthly_trend,
    };

    if (format === 'csv') {
      return this.generateCsv(exportData);
    } else {
      return this.generateExcel(exportData);
    }
  }

  private generateCsv(data: any): string {
    // Implementation for CSV generation
    const csvRows = [];

    // Add summary section
    csvRows.push('SUMMARY');
    csvRows.push(`Attendance Rate,${data.summary.attendance_rate.toFixed(2)}%`);
    csvRows.push(`Total Payroll Cost,${data.summary.total_payroll_cost}`);
    csvRows.push(`Overtime Cost,${data.summary.overtime_cost}`);
    csvRows.push('');

    // Add lateness details
    csvRows.push('LATENESS BY EMPLOYEE');
    csvRows.push(
      'Employee ID,First Name,Last Name,Department,Late Count,Total Late Minutes',
    );
    data.lateness_details.forEach((emp: any) => {
      csvRows.push(
        `${emp.user_id},${emp.first_name},${emp.last_name},${emp.department},${emp.late_count},${emp.total_late_minutes}`,
      );
    });

    return csvRows.join('\n');
  }

  private generateExcel(data: any): Buffer {
    const XLSX = require('xlsx');

    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Attendance Rate', `${data.summary.attendance_rate.toFixed(2)}%`],
      ['Total Payroll Cost', data.summary.total_payroll_cost],
      ['Overtime Cost', data.summary.overtime_cost],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Lateness sheet
    const latenessData = [
      [
        'Employee ID',
        'First Name',
        'Last Name',
        'Department',
        'Late Count',
        'Total Late Minutes',
      ],
      ...data.lateness_details.map((emp: any) => [
        emp.user_id,
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
}
