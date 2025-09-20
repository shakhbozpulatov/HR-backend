import { Repository } from 'typeorm';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { AttendanceFilterDto } from './dto/attendance-filter.dto';
export declare class AttendanceRecordsService {
    private recordRepository;
    constructor(recordRepository: Repository<AttendanceRecord>);
    findAll(filterDto: AttendanceFilterDto): Promise<{
        data: AttendanceRecord[];
        total: number;
    }>;
    findOne(employeeId: string, date: Date): Promise<AttendanceRecord>;
    createManualAdjustment(employeeId: string, date: Date, adjustment: any, actorId: string): Promise<AttendanceRecord>;
    approveRecord(employeeId: string, date: Date, actorId: string): Promise<AttendanceRecord>;
    reprocessRecord(employeeId: string, date: Date): Promise<AttendanceRecord>;
    getTimesheetGrid(filterDto: AttendanceFilterDto): Promise<any>;
    exportToExcel(filterDto: AttendanceFilterDto): Promise<Buffer>;
}
