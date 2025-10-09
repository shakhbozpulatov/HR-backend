// ============================================
// FILE: entities/index.ts
// Barrel Export - All Entities
// ============================================

// Main Entities
export * from './attendance-event.entity';
export * from './attendance-record.entity';
export * from './user-device-mapping.entity';
export * from './attendance-processing-log.entity';

// Re-export commonly used enums for convenience
export {
  EventType,
  EventSource,
  ProcessingStatus,
} from './attendance-event.entity';

export {
  AttendanceStatus,
  type ManualAdjustment,
  type Approval,
  type WorkSession,
} from './attendance-record.entity';

export { EnrollmentStatus } from './user-device-mapping.entity';

export { ProcessingType } from './attendance-processing-log.entity';
