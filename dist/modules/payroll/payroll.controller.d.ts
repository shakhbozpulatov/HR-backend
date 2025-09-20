import { PayrollService } from './payroll.service';
import { CreatePeriodDto } from './dto/create-period.dto';
import { CreatePayrollItemDto } from './dto/create-payroll-item.dto';
import { PayrollFilterDto } from './dto/payroll-filter.dto';
export declare class PayrollController {
    private readonly payrollService;
    constructor(payrollService: PayrollService);
    createPeriod(createPeriodDto: CreatePeriodDto): Promise<import("./entities/payroll-period.entity").PayrollPeriod>;
    getPeriods(filterDto: PayrollFilterDto): Promise<{
        data: import("./entities/payroll-period.entity").PayrollPeriod[];
        total: number;
    }>;
    getPeriod(id: string): Promise<import("./entities/payroll-period.entity").PayrollPeriod>;
    processPeriod(id: string): Promise<import("./entities/payroll-period.entity").PayrollPeriod>;
    lockPeriod(id: string): Promise<import("./entities/payroll-period.entity").PayrollPeriod>;
    getPeriodItems(id: string, filterDto: PayrollFilterDto): Promise<{
        data: import("./entities/payroll-item.entity").PayrollItem[];
        total: number;
    }>;
    createPeriodItem(periodId: string, createItemDto: CreatePayrollItemDto): Promise<import("./entities/payroll-item.entity").PayrollItem>;
    getPeriodSummary(id: string): Promise<any>;
    exportPeriod(id: string, format?: string): Promise<Buffer<ArrayBufferLike>>;
    getPayslip(employeeId: string, periodId: string): Promise<any>;
}
