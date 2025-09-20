import { PayrollItemType, PayrollItemCode, PayrollItemSource } from '../entities/payroll-item.entity';
export declare class CreatePayrollItemDto {
    employee_id: string;
    type: PayrollItemType;
    code: PayrollItemCode;
    quantity: number;
    rate: number;
    amount: number;
    note?: string;
    source?: PayrollItemSource;
}
