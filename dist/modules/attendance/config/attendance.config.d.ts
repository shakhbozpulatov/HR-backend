export interface AttendanceConfig {
    graceInMinutes: number;
    graceOutMinutes: number;
    roundingMinutes: number;
    overtimeThresholdMinutes: number;
    nightShiftStartHour: number;
    nightShiftEndHour: number;
    defaultTimezone: string;
    webhookSecret: string;
    queueConcurrency: number;
    maxRetryAttempts: number;
    retryDelayMs: number;
    maxEventsPerDay: number;
    maxWorkHoursPerDay: number;
    autoApproveThresholdMinutes: number;
    requireApprovalOvertimeMinutes: number;
    enableDailyProcessing: boolean;
    enableRetryFailed: boolean;
    enableCleanup: boolean;
    autoApproveOldRecords: boolean;
    autoApproveAfterDays: number;
    retentionProcessingLogs: number;
    retentionEvents: number;
    retentionRecords: number;
    webhookRateLimit: number;
    apiRateLimit: number;
}
declare const _default: (() => AttendanceConfig) & import("@nestjs/config").ConfigFactoryKeyHost<AttendanceConfig>;
export default _default;
export declare function validateAttendanceConfig(config: AttendanceConfig): void;
export declare const attendanceConfig: () => AttendanceConfig;
export declare function getValidatedConfig(): AttendanceConfig;
export declare function printConfigSummary(config: AttendanceConfig): void;
export declare const ATTENDANCE_STATUSES: {
    readonly OK: "OK";
    readonly MISSING: "MISSING";
    readonly INCOMPLETE: "INCOMPLETE";
    readonly ABSENT: "ABSENT";
    readonly HOLIDAY: "HOLIDAY";
    readonly LEAVE: "LEAVE";
    readonly WEEKEND: "WEEKEND";
};
export declare const PROCESSING_STATUSES: {
    readonly PENDING: "pending";
    readonly PROCESSED: "processed";
    readonly FAILED: "failed";
    readonly QUARANTINED: "quarantined";
};
export declare const EVENT_TYPES: {
    readonly CLOCK_IN: "clock_in";
    readonly CLOCK_OUT: "clock_out";
};
export declare const ENROLLMENT_STATUSES: {
    readonly PENDING: "pending";
    readonly PENDING_BIOMETRIC: "pending_biometric";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly DISABLED: "disabled";
};
export declare const ADJUSTMENT_TYPES: {
    readonly CLOCK_TIME_EDIT: "CLOCK_TIME_EDIT";
    readonly MARK_ABSENT_PAID: "MARK_ABSENT_PAID";
    readonly MARK_ABSENT_UNPAID: "MARK_ABSENT_UNPAID";
    readonly OVERRIDE_STATUS: "OVERRIDE_STATUS";
    readonly ADD_MINUTES: "ADD_MINUTES";
    readonly REMOVE_MINUTES: "REMOVE_MINUTES";
};
export declare const DEFAULT_CONFIG: AttendanceConfig;
