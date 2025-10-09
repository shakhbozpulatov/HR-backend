"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = exports.ADJUSTMENT_TYPES = exports.ENROLLMENT_STATUSES = exports.EVENT_TYPES = exports.PROCESSING_STATUSES = exports.ATTENDANCE_STATUSES = exports.attendanceConfig = void 0;
exports.validateAttendanceConfig = validateAttendanceConfig;
exports.getValidatedConfig = getValidatedConfig;
exports.printConfigSummary = printConfigSummary;
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('attendance', () => ({
    graceInMinutes: parseInt(process.env.GRACE_IN_MINUTES || '15', 10),
    graceOutMinutes: parseInt(process.env.GRACE_OUT_MINUTES || '15', 10),
    roundingMinutes: parseInt(process.env.ROUNDING_MINUTES || '5', 10),
    overtimeThresholdMinutes: parseInt(process.env.OVERTIME_THRESHOLD_MINUTES || '30', 10),
    nightShiftStartHour: parseInt(process.env.NIGHT_SHIFT_START_HOUR || '22', 10),
    nightShiftEndHour: parseInt(process.env.NIGHT_SHIFT_END_HOUR || '6', 10),
    defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Tashkent',
    webhookSecret: process.env.WEBHOOK_SECRET || '',
    queueConcurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5', 10),
    maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10),
    retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '2000', 10),
    maxEventsPerDay: parseInt(process.env.MAX_EVENTS_PER_DAY || '50', 10),
    maxWorkHoursPerDay: parseInt(process.env.MAX_WORK_HOURS_PER_DAY || '16', 10),
    autoApproveThresholdMinutes: parseInt(process.env.AUTO_APPROVE_THRESHOLD_MINUTES || '5', 10),
    requireApprovalOvertimeMinutes: parseInt(process.env.REQUIRE_APPROVAL_OVERTIME_MINUTES || '180', 10),
    enableDailyProcessing: process.env.ENABLE_DAILY_PROCESSING_CRON !== 'false',
    enableRetryFailed: process.env.ENABLE_RETRY_FAILED_CRON !== 'false',
    enableCleanup: process.env.ENABLE_CLEANUP_CRON !== 'false',
    autoApproveOldRecords: process.env.AUTO_APPROVE_OLD_RECORDS === 'true',
    autoApproveAfterDays: parseInt(process.env.AUTO_APPROVE_AFTER_DAYS || '7', 10),
    retentionProcessingLogs: parseInt(process.env.RETENTION_PROCESSING_LOGS_DAYS || '90', 10),
    retentionEvents: parseInt(process.env.RETENTION_EVENTS_DAYS || '180', 10),
    retentionRecords: parseInt(process.env.RETENTION_RECORDS_DAYS || '3650', 10),
    webhookRateLimit: parseInt(process.env.WEBHOOK_RATE_LIMIT || '100', 10),
    apiRateLimit: parseInt(process.env.API_RATE_LIMIT || '100', 10),
}));
function validateAttendanceConfig(config) {
    const errors = [];
    if (config.graceInMinutes < 0 || config.graceInMinutes > 60) {
        errors.push('GRACE_IN_MINUTES must be between 0 and 60');
    }
    if (config.graceOutMinutes < 0 || config.graceOutMinutes > 60) {
        errors.push('GRACE_OUT_MINUTES must be between 0 and 60');
    }
    if (config.roundingMinutes < 0 || config.roundingMinutes > 30) {
        errors.push('ROUNDING_MINUTES must be between 0 and 30');
    }
    if (config.overtimeThresholdMinutes < 0 ||
        config.overtimeThresholdMinutes > 120) {
        errors.push('OVERTIME_THRESHOLD_MINUTES must be between 0 and 120');
    }
    if (config.nightShiftStartHour < 0 || config.nightShiftStartHour > 23) {
        errors.push('NIGHT_SHIFT_START_HOUR must be between 0 and 23');
    }
    if (config.nightShiftEndHour < 0 || config.nightShiftEndHour > 23) {
        errors.push('NIGHT_SHIFT_END_HOUR must be between 0 and 23');
    }
    if (config.queueConcurrency < 1 || config.queueConcurrency > 20) {
        errors.push('QUEUE_CONCURRENCY must be between 1 and 20');
    }
    if (config.maxRetryAttempts < 0 || config.maxRetryAttempts > 10) {
        errors.push('MAX_RETRY_ATTEMPTS must be between 0 and 10');
    }
    if (config.retentionProcessingLogs < 7) {
        errors.push('RETENTION_PROCESSING_LOGS_DAYS must be at least 7');
    }
    if (config.retentionEvents < 30) {
        errors.push('RETENTION_EVENTS_DAYS must be at least 30');
    }
    if (config.retentionRecords < 365) {
        errors.push('RETENTION_RECORDS_DAYS must be at least 365');
    }
    if (errors.length > 0) {
        throw new Error(`Attendance configuration validation failed:\n${errors.join('\n')}`);
    }
}
const attendanceConfig = () => ({
    graceInMinutes: parseInt(process.env.GRACE_IN_MINUTES || '15', 10),
    graceOutMinutes: parseInt(process.env.GRACE_OUT_MINUTES || '15', 10),
    roundingMinutes: parseInt(process.env.ROUNDING_MINUTES || '5', 10),
    overtimeThresholdMinutes: parseInt(process.env.OVERTIME_THRESHOLD_MINUTES || '30', 10),
    nightShiftStartHour: parseInt(process.env.NIGHT_SHIFT_START_HOUR || '22', 10),
    nightShiftEndHour: parseInt(process.env.NIGHT_SHIFT_END_HOUR || '6', 10),
    defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Tashkent',
    webhookSecret: process.env.WEBHOOK_SECRET || '',
    queueConcurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5', 10),
    maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10),
    retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '2000', 10),
    maxEventsPerDay: parseInt(process.env.MAX_EVENTS_PER_DAY || '50', 10),
    maxWorkHoursPerDay: parseInt(process.env.MAX_WORK_HOURS_PER_DAY || '16', 10),
    autoApproveThresholdMinutes: parseInt(process.env.AUTO_APPROVE_THRESHOLD_MINUTES || '5', 10),
    requireApprovalOvertimeMinutes: parseInt(process.env.REQUIRE_APPROVAL_OVERTIME_MINUTES || '180', 10),
    enableDailyProcessing: process.env.ENABLE_DAILY_PROCESSING_CRON !== 'false',
    enableRetryFailed: process.env.ENABLE_RETRY_FAILED_CRON !== 'false',
    enableCleanup: process.env.ENABLE_CLEANUP_CRON !== 'false',
    autoApproveOldRecords: process.env.AUTO_APPROVE_OLD_RECORDS === 'true',
    autoApproveAfterDays: parseInt(process.env.AUTO_APPROVE_AFTER_DAYS || '7', 10),
    retentionProcessingLogs: parseInt(process.env.RETENTION_PROCESSING_LOGS_DAYS || '90', 10),
    retentionEvents: parseInt(process.env.RETENTION_EVENTS_DAYS || '180', 10),
    retentionRecords: parseInt(process.env.RETENTION_RECORDS_DAYS || '3650', 10),
    webhookRateLimit: parseInt(process.env.WEBHOOK_RATE_LIMIT || '100', 10),
    apiRateLimit: parseInt(process.env.API_RATE_LIMIT || '100', 10),
});
exports.attendanceConfig = attendanceConfig;
function getValidatedConfig() {
    const config = (0, exports.attendanceConfig)();
    validateAttendanceConfig(config);
    return config;
}
function printConfigSummary(config) {
    console.log('='.repeat(50));
    console.log('Attendance Module Configuration');
    console.log('='.repeat(50));
    console.log(`Grace Period (In):       ${config.graceInMinutes} minutes`);
    console.log(`Grace Period (Out):      ${config.graceOutMinutes} minutes`);
    console.log(`Rounding:                ${config.roundingMinutes} minutes`);
    console.log(`Overtime Threshold:      ${config.overtimeThresholdMinutes} minutes`);
    console.log(`Night Shift:             ${config.nightShiftStartHour}:00 - ${config.nightShiftEndHour}:00`);
    console.log(`Timezone:                ${config.defaultTimezone}`);
    console.log(`Queue Concurrency:       ${config.queueConcurrency}`);
    console.log(`Max Retry Attempts:      ${config.maxRetryAttempts}`);
    console.log(`Daily Processing:        ${config.enableDailyProcessing ? 'Enabled' : 'Disabled'}`);
    console.log(`Auto Approval:           ${config.autoApproveOldRecords ? 'Enabled' : 'Disabled'}`);
    console.log('='.repeat(50));
}
exports.ATTENDANCE_STATUSES = {
    OK: 'OK',
    MISSING: 'MISSING',
    INCOMPLETE: 'INCOMPLETE',
    ABSENT: 'ABSENT',
    HOLIDAY: 'HOLIDAY',
    LEAVE: 'LEAVE',
    WEEKEND: 'WEEKEND',
};
exports.PROCESSING_STATUSES = {
    PENDING: 'pending',
    PROCESSED: 'processed',
    FAILED: 'failed',
    QUARANTINED: 'quarantined',
};
exports.EVENT_TYPES = {
    CLOCK_IN: 'clock_in',
    CLOCK_OUT: 'clock_out',
};
exports.ENROLLMENT_STATUSES = {
    PENDING: 'pending',
    PENDING_BIOMETRIC: 'pending_biometric',
    COMPLETED: 'completed',
    FAILED: 'failed',
    DISABLED: 'disabled',
};
exports.ADJUSTMENT_TYPES = {
    CLOCK_TIME_EDIT: 'CLOCK_TIME_EDIT',
    MARK_ABSENT_PAID: 'MARK_ABSENT_PAID',
    MARK_ABSENT_UNPAID: 'MARK_ABSENT_UNPAID',
    OVERRIDE_STATUS: 'OVERRIDE_STATUS',
    ADD_MINUTES: 'ADD_MINUTES',
    REMOVE_MINUTES: 'REMOVE_MINUTES',
};
exports.DEFAULT_CONFIG = {
    graceInMinutes: 15,
    graceOutMinutes: 15,
    roundingMinutes: 5,
    overtimeThresholdMinutes: 30,
    nightShiftStartHour: 22,
    nightShiftEndHour: 6,
    defaultTimezone: 'Asia/Tashkent',
    webhookSecret: '',
    queueConcurrency: 5,
    maxRetryAttempts: 3,
    retryDelayMs: 2000,
    maxEventsPerDay: 50,
    maxWorkHoursPerDay: 16,
    autoApproveThresholdMinutes: 5,
    requireApprovalOvertimeMinutes: 180,
    enableDailyProcessing: true,
    enableRetryFailed: true,
    enableCleanup: true,
    autoApproveOldRecords: false,
    autoApproveAfterDays: 7,
    retentionProcessingLogs: 90,
    retentionEvents: 180,
    retentionRecords: 3650,
    webhookRateLimit: 100,
    apiRateLimit: 100,
};
//# sourceMappingURL=attendance.config.js.map