import { PeriodStatus } from '../entities/payroll-period.entity';
export declare class PayrollFilterDto {
    page?: number;
    limit?: number;
    user_id?: string;
    status?: PeriodStatus;
    period_id?: string;
}
