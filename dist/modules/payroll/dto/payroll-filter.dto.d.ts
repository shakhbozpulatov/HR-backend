import { PeriodStatus } from '../entities/payroll-period.entity';
export declare class PayrollFilterDto {
    page?: number;
    limit?: number;
    employee_id?: string;
    status?: PeriodStatus;
    period_id?: string;
}
