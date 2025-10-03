import { PayrollPeriod } from './payroll-period.entity';
import { User } from '@/modules/users/entities/user.entity';
export declare enum PayrollItemType {
    EARNING = "EARNING",
    DEDUCTION = "DEDUCTION"
}
export declare enum PayrollItemCode {
    BASE_HOURLY = "BASE_HOURLY",
    BASE_MONTHLY = "BASE_MONTHLY",
    OVERTIME = "OVERTIME",
    HOLIDAY_PREMIUM = "HOLIDAY_PREMIUM",
    PIECEWORK = "PIECEWORK",
    BONUS = "BONUS",
    PENALTY = "PENALTY"
}
export declare enum PayrollItemSource {
    AUTO = "AUTO",
    MANUAL = "MANUAL",
    IMPORT = "IMPORT"
}
export declare class PayrollItem {
    item_id: string;
    user_id: string;
    period_id: string;
    type: PayrollItemType;
    code: PayrollItemCode;
    quantity: number;
    rate: number;
    amount: number;
    note?: string;
    source: PayrollItemSource;
    created_at: Date;
    user: User;
    period: PayrollPeriod;
}
