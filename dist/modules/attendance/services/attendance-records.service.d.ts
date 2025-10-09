import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { ApprovalDto, AttendanceFilterDto, AttendanceRecord, AttendanceSummaryDto, ManualAdjustmentDto, PaginatedResponseDto } from '@/modules/attendance';
export declare class AttendanceRecordsService {
    private recordRepository;
    private attendanceQueue;
    private readonly logger;
    constructor(recordRepository: Repository<AttendanceRecord>, attendanceQueue: Queue);
    findAll(filterDto: AttendanceFilterDto): Promise<PaginatedResponseDto<AttendanceRecord>>;
    findOne(userId: string, date: Date): Promise<AttendanceRecord>;
    createManualAdjustment(userId: string, date: Date, adjustmentDto: ManualAdjustmentDto, actorId: string): Promise<AttendanceRecord>;
    private captureBeforeValue;
    private captureAfterValue;
    private applyAdjustment;
    approveRecord(userId: string, date: Date, approvalDto: ApprovalDto, actorId: string): Promise<AttendanceRecord>;
    unlockRecord(userId: string, date: Date, actorId: string): Promise<AttendanceRecord>;
    reprocessRecord(userId: string, date: Date): Promise<AttendanceRecord>;
    getTimesheetGrid(filterDto: AttendanceFilterDto): Promise<{
        users: any[];
        dates: string[];
        records: Map<string, Map<string, AttendanceRecord>>;
    }>;
    getAttendanceSummary(userId: string, startDate: Date, endDate: Date): Promise<AttendanceSummaryDto>;
    exportToExcel(filterDto: AttendanceFilterDto): Promise<Buffer>;
}
