import { Repository } from 'typeorm';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity';
import { PayrollItem } from '../payroll/entities/payroll-item.entity';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
import { User } from '@/modules/users/entities/user.entity';
export declare class AnalyticsService {
    private attendanceRepository;
    private payrollRepository;
    private userRepository;
    constructor(attendanceRepository: Repository<AttendanceRecord>, payrollRepository: Repository<PayrollItem>, userRepository: Repository<User>);
    getAttendanceMetrics(filterDto: AnalyticsFilterDto): Promise<{
        attendance_rate: number;
        total_records: number;
        ok_records: number;
        lateness_by_user: any[];
        overtime_by_department: any[];
    }>;
    getPayrollMetrics(filterDto: AnalyticsFilterDto): Promise<{
        total_cost: any;
        overtime_cost: any;
        cost_by_department: any[];
        monthly_trend: any[];
    }>;
    getDashboardSummary(filterDto: AnalyticsFilterDto): Promise<{
        active_users: number;
        attendance_rate: number;
        total_payroll_cost: any;
        overtime_cost: any;
        top_late_users: any[];
        payroll_trend: any[];
    }>;
    exportAnalytics(filterDto: AnalyticsFilterDto, format?: 'csv' | 'xlsx'): Promise<string | Buffer<ArrayBufferLike>>;
    private generateCsv;
    private generateExcel;
}
