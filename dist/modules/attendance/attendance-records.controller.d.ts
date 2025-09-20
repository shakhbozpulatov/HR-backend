import { AttendanceRecordsService } from './attendance-records.service';
import { AttendanceFilterDto } from './dto/attendance-filter.dto';
export declare class AttendanceRecordsController {
    private readonly recordsService;
    constructor(recordsService: AttendanceRecordsService);
    getRecords(filterDto: AttendanceFilterDto): Promise<{
        data: import("./entities/attendance-record.entity").AttendanceRecord[];
        total: number;
    }>;
    getRecord(employeeId: string, date: string): Promise<import("./entities/attendance-record.entity").AttendanceRecord>;
    createAdjustment(employeeId: string, date: string, adjustment: any): Promise<import("./entities/attendance-record.entity").AttendanceRecord>;
    approveRecord(employeeId: string, date: string): Promise<import("./entities/attendance-record.entity").AttendanceRecord>;
    getTimesheet(filterDto: AttendanceFilterDto): Promise<any>;
}
