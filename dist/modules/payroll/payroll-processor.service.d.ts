import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PayrollPeriod } from './entities/payroll-period.entity';
import { PayrollItem } from './entities/payroll-item.entity';
import { WorkVolumeEntry } from './entities/work-volume-entry.entity';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity';
import { Employee } from '../employees/entities/employee.entity';
export declare class PayrollProcessorService {
    private periodRepository;
    private itemRepository;
    private attendanceRepository;
    private volumeRepository;
    private employeeRepository;
    private configService;
    private readonly overtimeMultiplier;
    constructor(periodRepository: Repository<PayrollPeriod>, itemRepository: Repository<PayrollItem>, attendanceRepository: Repository<AttendanceRecord>, volumeRepository: Repository<WorkVolumeEntry>, employeeRepository: Repository<Employee>, configService: ConfigService);
    processPayrollPeriod(periodId: string): Promise<void>;
    private processEmployeePayroll;
    private processHourlyEmployee;
    private processMonthlyEmployee;
    private processOvertime;
    private processHolidayPremium;
    private processPiecework;
    private calculateHourlyRateFromMonthlySalary;
    private createPayrollItem;
    getPeriodSummary(periodId: string): Promise<any>;
}
