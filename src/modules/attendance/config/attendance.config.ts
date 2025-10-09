// ============================================
// FILE: config/attendance.config.ts
// Configuration Constants and Settings
// ============================================

import { registerAs } from '@nestjs/config';

export interface AttendanceConfig {
  // Grace Periods (minutes)
  graceInMinutes: number;
  graceOutMinutes: number;

  // Rounding
  roundingMinutes: number;

  // Overtime
  overtimeThresholdMinutes: number;

  // Night Shift Hours (24-hour format)
  nightShiftStartHour: number;
  nightShiftEndHour: number;

  // Timezone
  defaultTimezone: string;

  // Webhook Security
  webhookSecret: string;

  // Queue Settings
  queueConcurrency: number;
  maxRetryAttempts: number;
  retryDelayMs: number;

  // Processing Limits
  maxEventsPerDay: number;
  maxWorkHoursPerDay: number;

  // Approval Requirements
  autoApproveThresholdMinutes: number;
  requireApprovalOvertimeMinutes: number;

  // Cron Jobs
  enableDailyProcessing: boolean;
  enableRetryFailed: boolean;
  enableCleanup: boolean;

  // Auto Approval
  autoApproveOldRecords: boolean;
  autoApproveAfterDays: number;

  // Data Retention (days)
  retentionProcessingLogs: number;
  retentionEvents: number;
  retentionRecords: number;

  // Rate Limiting
  webhookRateLimit: number;
  apiRateLimit: number;
}

export default registerAs(
  'attendance',
  (): AttendanceConfig => ({
    // Grace periods - allows flexibility for clock in/out times
    graceInMinutes: parseInt(process.env.GRACE_IN_MINUTES || '15', 10),
    graceOutMinutes: parseInt(process.env.GRACE_OUT_MINUTES || '15', 10),

    // Rounding - rounds worked minutes to nearest X minutes
    roundingMinutes: parseInt(process.env.ROUNDING_MINUTES || '5', 10),

    // Overtime - minimum extra minutes to count as overtime
    overtimeThresholdMinutes: parseInt(
      process.env.OVERTIME_THRESHOLD_MINUTES || '30',
      10,
    ),

    // Night shift definition (22:00 - 06:00 by default)
    nightShiftStartHour: parseInt(
      process.env.NIGHT_SHIFT_START_HOUR || '22',
      10,
    ),
    nightShiftEndHour: parseInt(process.env.NIGHT_SHIFT_END_HOUR || '6', 10),

    // Default timezone for the system
    defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Tashkent',

    // Webhook signature verification secret
    webhookSecret: process.env.WEBHOOK_SECRET || '',

    // Queue processing settings
    queueConcurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5', 10),
    maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10),
    retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '2000', 10),

    // Alert thresholds
    maxEventsPerDay: parseInt(process.env.MAX_EVENTS_PER_DAY || '50', 10),
    maxWorkHoursPerDay: parseInt(
      process.env.MAX_WORK_HOURS_PER_DAY || '16',
      10,
    ),

    // Approval automation
    autoApproveThresholdMinutes: parseInt(
      process.env.AUTO_APPROVE_THRESHOLD_MINUTES || '5',
      10,
    ),
    requireApprovalOvertimeMinutes: parseInt(
      process.env.REQUIRE_APPROVAL_OVERTIME_MINUTES || '180',
      10,
    ),

    // Cron job toggles
    enableDailyProcessing: process.env.ENABLE_DAILY_PROCESSING_CRON !== 'false',
    enableRetryFailed: process.env.ENABLE_RETRY_FAILED_CRON !== 'false',
    enableCleanup: process.env.ENABLE_CLEANUP_CRON !== 'false',

    // Auto approval settings
    autoApproveOldRecords: process.env.AUTO_APPROVE_OLD_RECORDS === 'true',
    autoApproveAfterDays: parseInt(
      process.env.AUTO_APPROVE_AFTER_DAYS || '7',
      10,
    ),

    // Data retention policies
    retentionProcessingLogs: parseInt(
      process.env.RETENTION_PROCESSING_LOGS_DAYS || '90',
      10,
    ),
    retentionEvents: parseInt(process.env.RETENTION_EVENTS_DAYS || '180', 10),
    retentionRecords: parseInt(
      process.env.RETENTION_RECORDS_DAYS || '3650',
      10,
    ), // 10 years

    // Rate limiting
    webhookRateLimit: parseInt(process.env.WEBHOOK_RATE_LIMIT || '100', 10),
    apiRateLimit: parseInt(process.env.API_RATE_LIMIT || '100', 10),
  }),
);

// ============================================
// Configuration Validation
// ============================================

export function validateAttendanceConfig(config: AttendanceConfig): void {
  const errors: string[] = [];

  // Validate grace periods
  if (config.graceInMinutes < 0 || config.graceInMinutes > 60) {
    errors.push('GRACE_IN_MINUTES must be between 0 and 60');
  }

  if (config.graceOutMinutes < 0 || config.graceOutMinutes > 60) {
    errors.push('GRACE_OUT_MINUTES must be between 0 and 60');
  }

  // Validate rounding
  if (config.roundingMinutes < 0 || config.roundingMinutes > 30) {
    errors.push('ROUNDING_MINUTES must be between 0 and 30');
  }

  // Validate overtime threshold
  if (
    config.overtimeThresholdMinutes < 0 ||
    config.overtimeThresholdMinutes > 120
  ) {
    errors.push('OVERTIME_THRESHOLD_MINUTES must be between 0 and 120');
  }

  // Validate night shift hours
  if (config.nightShiftStartHour < 0 || config.nightShiftStartHour > 23) {
    errors.push('NIGHT_SHIFT_START_HOUR must be between 0 and 23');
  }

  if (config.nightShiftEndHour < 0 || config.nightShiftEndHour > 23) {
    errors.push('NIGHT_SHIFT_END_HOUR must be between 0 and 23');
  }

  // Validate queue settings
  if (config.queueConcurrency < 1 || config.queueConcurrency > 20) {
    errors.push('QUEUE_CONCURRENCY must be between 1 and 20');
  }

  if (config.maxRetryAttempts < 0 || config.maxRetryAttempts > 10) {
    errors.push('MAX_RETRY_ATTEMPTS must be between 0 and 10');
  }

  // Validate retention periods
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
    throw new Error(
      `Attendance configuration validation failed:\n${errors.join('\n')}`,
    );
  }
}

/**
 * Main configuration factory
 * Used by NestJS ConfigModule
 */
export const attendanceConfig = (): AttendanceConfig => ({
  // Grace periods - allows flexibility for clock in/out times
  graceInMinutes: parseInt(process.env.GRACE_IN_MINUTES || '15', 10),
  graceOutMinutes: parseInt(process.env.GRACE_OUT_MINUTES || '15', 10),

  // Rounding - rounds worked minutes to nearest X minutes
  roundingMinutes: parseInt(process.env.ROUNDING_MINUTES || '5', 10),

  // Overtime - minimum extra minutes to count as overtime
  overtimeThresholdMinutes: parseInt(
    process.env.OVERTIME_THRESHOLD_MINUTES || '30',
    10,
  ),

  // Night shift definition (22:00 - 06:00 by default)
  nightShiftStartHour: parseInt(process.env.NIGHT_SHIFT_START_HOUR || '22', 10),
  nightShiftEndHour: parseInt(process.env.NIGHT_SHIFT_END_HOUR || '6', 10),

  // Default timezone for the system
  defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Tashkent',

  // Webhook signature verification secret
  webhookSecret: process.env.WEBHOOK_SECRET || '',

  // Queue processing settings
  queueConcurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5', 10),
  maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10),
  retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '2000', 10),

  // Alert thresholds
  maxEventsPerDay: parseInt(process.env.MAX_EVENTS_PER_DAY || '50', 10),
  maxWorkHoursPerDay: parseInt(process.env.MAX_WORK_HOURS_PER_DAY || '16', 10),

  // Approval automation
  autoApproveThresholdMinutes: parseInt(
    process.env.AUTO_APPROVE_THRESHOLD_MINUTES || '5',
    10,
  ),
  requireApprovalOvertimeMinutes: parseInt(
    process.env.REQUIRE_APPROVAL_OVERTIME_MINUTES || '180',
    10,
  ),

  // Cron job toggles
  enableDailyProcessing: process.env.ENABLE_DAILY_PROCESSING_CRON !== 'false',
  enableRetryFailed: process.env.ENABLE_RETRY_FAILED_CRON !== 'false',
  enableCleanup: process.env.ENABLE_CLEANUP_CRON !== 'false',

  // Auto approval settings
  autoApproveOldRecords: process.env.AUTO_APPROVE_OLD_RECORDS === 'true',
  autoApproveAfterDays: parseInt(
    process.env.AUTO_APPROVE_AFTER_DAYS || '7',
    10,
  ),

  // Data retention policies
  retentionProcessingLogs: parseInt(
    process.env.RETENTION_PROCESSING_LOGS_DAYS || '90',
    10,
  ),
  retentionEvents: parseInt(process.env.RETENTION_EVENTS_DAYS || '180', 10),
  retentionRecords: parseInt(process.env.RETENTION_RECORDS_DAYS || '3650', 10), // 10 years

  // Rate limiting
  webhookRateLimit: parseInt(process.env.WEBHOOK_RATE_LIMIT || '100', 10),
  apiRateLimit: parseInt(process.env.API_RATE_LIMIT || '100', 10),
});

// ============================================
// Helper Functions
// ============================================

/**
 * Get configuration with validation
 */
export function getValidatedConfig(): AttendanceConfig {
  const config = attendanceConfig();
  validateAttendanceConfig(config);
  return config;
}

/**
 * Print configuration summary
 */
export function printConfigSummary(config: AttendanceConfig): void {
  console.log('='.repeat(50));
  console.log('Attendance Module Configuration');
  console.log('='.repeat(50));
  console.log(`Grace Period (In):       ${config.graceInMinutes} minutes`);
  console.log(`Grace Period (Out):      ${config.graceOutMinutes} minutes`);
  console.log(`Rounding:                ${config.roundingMinutes} minutes`);
  console.log(
    `Overtime Threshold:      ${config.overtimeThresholdMinutes} minutes`,
  );
  console.log(
    `Night Shift:             ${config.nightShiftStartHour}:00 - ${config.nightShiftEndHour}:00`,
  );
  console.log(`Timezone:                ${config.defaultTimezone}`);
  console.log(`Queue Concurrency:       ${config.queueConcurrency}`);
  console.log(`Max Retry Attempts:      ${config.maxRetryAttempts}`);
  console.log(
    `Daily Processing:        ${config.enableDailyProcessing ? 'Enabled' : 'Disabled'}`,
  );
  console.log(
    `Auto Approval:           ${config.autoApproveOldRecords ? 'Enabled' : 'Disabled'}`,
  );
  console.log('='.repeat(50));
}

// ============================================
// Constants Export
// ============================================

export const ATTENDANCE_STATUSES = {
  OK: 'OK',
  MISSING: 'MISSING',
  INCOMPLETE: 'INCOMPLETE',
  ABSENT: 'ABSENT',
  HOLIDAY: 'HOLIDAY',
  LEAVE: 'LEAVE',
  WEEKEND: 'WEEKEND',
} as const;

export const PROCESSING_STATUSES = {
  PENDING: 'pending',
  PROCESSED: 'processed',
  FAILED: 'failed',
  QUARANTINED: 'quarantined',
} as const;

export const EVENT_TYPES = {
  CLOCK_IN: 'clock_in',
  CLOCK_OUT: 'clock_out',
} as const;

export const ENROLLMENT_STATUSES = {
  PENDING: 'pending',
  PENDING_BIOMETRIC: 'pending_biometric',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DISABLED: 'disabled',
} as const;

export const ADJUSTMENT_TYPES = {
  CLOCK_TIME_EDIT: 'CLOCK_TIME_EDIT',
  MARK_ABSENT_PAID: 'MARK_ABSENT_PAID',
  MARK_ABSENT_UNPAID: 'MARK_ABSENT_UNPAID',
  OVERRIDE_STATUS: 'OVERRIDE_STATUS',
  ADD_MINUTES: 'ADD_MINUTES',
  REMOVE_MINUTES: 'REMOVE_MINUTES',
} as const;

// ============================================
// Default Values
// ============================================

export const DEFAULT_CONFIG: AttendanceConfig = {
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
