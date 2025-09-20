import { Employee } from '../../employees/entities/employee.entity';
import { PayrollPeriod } from './payroll-period.entity';
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
    employee_id: string;
    period_id: string;
    type: PayrollItemType;
    code: PayrollItemCode;
    quantity: number;
    rate: number;
    amount: number;
    note?: string;
    source: PayrollItemSource;
    created_at: Date;
    employee: Employee;
    period: PayrollPeriod;
}
