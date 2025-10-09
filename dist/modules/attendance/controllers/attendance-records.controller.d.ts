import { AttendanceRecordsService } from '@/modules/attendance';
import { AttendanceFilterDto, ManualAdjustmentDto, ApprovalDto } from '../dto';
export declare class AttendanceRecordsController {
    private readonly recordsService;
    constructor(recordsService: AttendanceRecordsService);
    getRecords(filterDto: AttendanceFilterDto): Promise<import("@/modules/attendance").PaginatedResponseDto<import("@/modules/attendance").AttendanceRecord>>;
    getTimesheet(filterDto: AttendanceFilterDto): Promise<{
        success: boolean;
        data: {
            users: any[];
            dates: string[];
            records: Map<string, Map<string, import("@/modules/attendance").AttendanceRecord>>;
        };
    }>;
    getAttendanceSummary(userId: string, from: string, to: string): Promise<{
        success: boolean;
        data: import("@/modules/attendance").AttendanceSummaryDto;
    }>;
    getRecord(userId: string, date: string): Promise<{
        success: boolean;
        data: import("@/modules/attendance").AttendanceRecord;
    }>;
    createAdjustment(userId: string, date: string, adjustmentDto: ManualAdjustmentDto, actorId: string): Promise<{
        success: boolean;
        data: import("@/modules/attendance").AttendanceRecord;
        message: string;
    }>;
    approveRecord(userId: string, date: string, approvalDto: ApprovalDto, actorId: string): Promise<{
        success: boolean;
        data: import("@/modules/attendance").AttendanceRecord;
        message: string;
    }>;
    unlockRecord(userId: string, date: string, actorId: string): Promise<{
        success: boolean;
        data: import("@/modules/attendance").AttendanceRecord;
        message: string;
    }>;
    reprocessRecord(userId: string, date: string): Promise<{
        success: boolean;
        message: string;
    }>;
    exportRecords(filterDto: AttendanceFilterDto): Promise<{
        success: boolean;
        filename: string;
        data: string;
        message: string;
    }>;
    bulkApprove(data: {
        record_ids: string[];
        approval: ApprovalDto;
    }, actorId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getPendingApprovals(filterDto: AttendanceFilterDto): Promise<import("@/modules/attendance").PaginatedResponseDto<import("@/modules/attendance").AttendanceRecord>>;
}
