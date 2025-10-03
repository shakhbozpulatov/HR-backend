import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PayrollPeriod } from './entities/payroll-period.entity';
import { PayrollItem } from './entities/payroll-item.entity';
import { WorkVolumeEntry } from './entities/work-volume-entry.entity';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity';
import { User } from '@/modules/users/entities/user.entity';
export declare class PayrollProcessorService {
    private periodRepository;
    private itemRepository;
    private attendanceRepository;
    private volumeRepository;
    private userRepository;
    private configService;
    private readonly overtimeMultiplier;
    constructor(periodRepository: Repository<PayrollPeriod>, itemRepository: Repository<PayrollItem>, attendanceRepository: Repository<AttendanceRecord>, volumeRepository: Repository<WorkVolumeEntry>, userRepository: Repository<User>, configService: ConfigService);
    processPayrollPeriod(periodId: string): Promise<void>;
    private processUserPayroll;
    private processHourlyUser;
    private processMonthlyEmployee;
    private processOvertime;
    private processHolidayPremium;
    private processPiecework;
    private calculateHourlyRateFromMonthlySalary;
    private createPayrollItem;
    getPeriodSummary(periodId: string): Promise<any>;
}
