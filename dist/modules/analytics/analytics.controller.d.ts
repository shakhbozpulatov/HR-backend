import { AnalyticsService } from './analytics.service';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getAttendanceMetrics(filterDto: AnalyticsFilterDto): Promise<{
        attendance_rate: number;
        total_records: number;
        ok_records: number;
        lateness_by_employee: any[];
        overtime_by_department: any[];
    }>;
    getPayrollMetrics(filterDto: AnalyticsFilterDto): Promise<{
        total_cost: any;
        overtime_cost: any;
        cost_by_department: any[];
        monthly_trend: any[];
    }>;
    getDashboardSummary(filterDto: AnalyticsFilterDto): Promise<{
        active_employees: number;
        attendance_rate: number;
        total_payroll_cost: any;
        overtime_cost: any;
        top_late_employees: any[];
        payroll_trend: any[];
    }>;
}
