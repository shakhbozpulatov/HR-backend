import { PayrollItem } from './payroll-item.entity';
export declare enum PeriodStatus {
    OPEN = "OPEN",
    LOCKED = "LOCKED",
    PROCESSED = "PROCESSED"
}
export declare class PayrollPeriod {
    period_id: string;
    start_date: Date;
    end_date: Date;
    status: PeriodStatus;
    close_date?: Date;
    created_at: Date;
    updated_at: Date;
    items: PayrollItem[];
}
