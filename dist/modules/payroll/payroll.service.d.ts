import { Repository } from 'typeorm';
import { PayrollPeriod } from './entities/payroll-period.entity';
import { PayrollItem } from './entities/payroll-item.entity';
import { WorkVolumeEntry } from './entities/work-volume-entry.entity';
import { CreatePeriodDto } from './dto/create-period.dto';
import { CreatePayrollItemDto } from './dto/create-payroll-item.dto';
import { PayrollFilterDto } from './dto/payroll-filter.dto';
export declare class PayrollService {
    private periodRepository;
    private itemRepository;
    private volumeRepository;
    constructor(periodRepository: Repository<PayrollPeriod>, itemRepository: Repository<PayrollItem>, volumeRepository: Repository<WorkVolumeEntry>);
    createPeriod(createPeriodDto: CreatePeriodDto, actorId: string): Promise<PayrollPeriod>;
    findAllPeriods(filterDto: PayrollFilterDto): Promise<{
        data: PayrollPeriod[];
        total: number;
    }>;
    findOnePeriod(id: string): Promise<PayrollPeriod>;
    processPeriod(id: string, actorId: string): Promise<PayrollPeriod>;
    lockPeriod(id: string, actorId: string): Promise<PayrollPeriod>;
    unlockPeriod(id: string, actorId: string): Promise<PayrollPeriod>;
    findPeriodItems(periodId: string, filterDto: PayrollFilterDto): Promise<{
        data: PayrollItem[];
        total: number;
    }>;
    createPayrollItem(periodId: string, createItemDto: CreatePayrollItemDto, actorId: string): Promise<PayrollItem>;
    getPeriodSummary(id: string): Promise<any>;
    exportPeriod(id: string, format: string): Promise<Buffer>;
    importVolumeEntries(file: any, actorId: string): Promise<any>;
    getEmployeePayslip(employeeId: string, periodId: string): Promise<any>;
}
