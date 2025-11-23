// ============================================
// FILE: dto/index.ts
// Barrel Export - All DTOs
// ============================================

// Webhook & Device DTOs
export * from './webhook-event.dto';
export * from './device-status.dto';

// Filter & Query DTOs
export * from './attendance-filter.dto';
export * from './user-attendance.dto';

// Action DTOs
export * from './manual-adjustment.dto';
export * from './resolve-quarantine.dto';
export * from './enrollment.dto';
export * from './batch-process.dto';

// Response DTOs
export * from './response.dto';

// Re-export commonly used types for convenience
export type { AttendanceConfig } from '../config/attendance.config';
