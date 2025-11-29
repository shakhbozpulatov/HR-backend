# Audit Module Documentation

## Umumiy Ma'lumot
Audit moduli tizimda amalga oshirilgan barcha muhim operatsiyalarni kuzatish va loglash uchun mas'ul. Bu modul xavfsizlik, compliance va troubleshooting uchun zarur bo'lgan audit trail yaratadi.

## Arxitektura

### Module Tuzilmasi
```
audit/
├── entities/
│   └── audit-log.entity.ts          # Audit log entity
├── audit.controller.ts              # HTTP controller
├── audit.service.ts                 # Business logic
└── audit.module.ts                  # Module konfiguratsiyasi
```

## Audit Log Entity

### Maydonlar
```typescript
{
  log_id: string (UUID)              // Asosiy identifikator

  // Actor (Kim amalga oshirgan)
  actor: string                      // User ID yoki "SYSTEM"

  // Action (Qanday harakat)
  action: string                     // CREATE, UPDATE, DELETE, LOGIN, etc.

  // Target (Nimaga ta'sir qilgan)
  target_type: string                // USER, COMPANY, ATTENDANCE, etc.
  target_id: string                  // Target entity ID

  // Changes (O'zgarishlar)
  before?: any (JSONB)               // O'zgarishdan oldingi holat
  after?: any (JSONB)                // O'zgarishdan keyingi holat

  // Metadata
  ip_address?: string                // IP manzil
  user_agent?: string                // Browser/client info

  // Timestamp
  created_at: Date                   // Amalga oshirilgan vaqt
}
```

## Asosiy Funksiyonallik

### 1. Log Creation
**Method**: `log(actor, action, targetType, targetId, before?, after?)`

**Usage**:
```typescript
// User creation log
await auditService.log(
  adminUserId,
  'CREATE_USER',
  'USER',
  newUser.id,
  null,
  {
    email: newUser.email,
    role: newUser.role,
    company_id: newUser.company_id
  }
);

// User update log
await auditService.log(
  adminUserId,
  'UPDATE_USER',
  'USER',
  userId,
  { first_name: 'John', last_name: 'Doe' },
  { first_name: 'Jane', last_name: 'Doe' }
);

// User deletion log
await auditService.log(
  adminUserId,
  'DELETE_USER',
  'USER',
  userId,
  { active: true, status: 'ACTIVE' },
  { active: false, status: 'INACTIVE' }
);
```

### 2. HTTP Request Logging
**Method**: `logHttpRequest(data)`

**Usage**:
```typescript
await auditService.logHttpRequest({
  actor: userId,
  method: 'POST',
  url: '/api/users',
  body: { email: 'user@example.com' },
  response: { user_id: 'uuid' },
  error: null,
  duration: 245,
  status: 'SUCCESS'
});
```

**Request Interceptor**:
```typescript
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (response) => {
        const duration = Date.now() - startTime;

        await this.auditService.logHttpRequest({
          actor: request.user?.user_id || 'ANONYMOUS',
          method: request.method,
          url: request.url,
          body: request.body,
          response: response,
          duration: duration,
          status: 'SUCCESS'
        });
      }),
      catchError(async (error) => {
        const duration = Date.now() - startTime;

        await this.auditService.logHttpRequest({
          actor: request.user?.user_id || 'ANONYMOUS',
          method: request.method,
          url: request.url,
          body: request.body,
          error: error.message,
          duration: duration,
          status: 'ERROR'
        });

        throw error;
      })
    );
  }
}
```

### 3. Find All Logs
**Endpoint**: `GET /audit?actor=uuid&target_type=USER&page=1&limit=50`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER

**Query Parameters**:
- `actor`: Filter by actor (user ID)
- `target_type`: Filter by target type
- `start_date`: From date
- `end_date`: To date
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)

**Response**:
```json
{
  "data": [
    {
      "log_id": "uuid",
      "actor": "admin-user-id",
      "action": "CREATE_USER",
      "target_type": "USER",
      "target_id": "new-user-id",
      "after": {
        "email": "newuser@example.com",
        "role": "EMPLOYEE"
      },
      "created_at": "2024-11-29T10:30:00Z"
    }
  ],
  "total": 1250
}
```

## Action Types

### Authentication Actions
```typescript
const AUTH_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET: 'PASSWORD_RESET'
};
```

### User Management Actions
```typescript
const USER_ACTIONS = {
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  ACTIVATE_USER: 'ACTIVATE_USER',
  DEACTIVATE_USER: 'DEACTIVATE_USER'
};
```

### Attendance Actions
```typescript
const ATTENDANCE_ACTIONS = {
  CREATE_RECORD: 'CREATE_ATTENDANCE_RECORD',
  UPDATE_RECORD: 'UPDATE_ATTENDANCE_RECORD',
  MANUAL_ADJUSTMENT: 'MANUAL_ATTENDANCE_ADJUSTMENT',
  APPROVE_RECORD: 'APPROVE_ATTENDANCE_RECORD'
};
```

### Payroll Actions
```typescript
const PAYROLL_ACTIONS = {
  CREATE_PERIOD: 'CREATE_PAYROLL_PERIOD',
  PROCESS_PERIOD: 'PROCESS_PAYROLL_PERIOD',
  LOCK_PERIOD: 'LOCK_PAYROLL_PERIOD',
  UNLOCK_PERIOD: 'UNLOCK_PAYROLL_PERIOD',
  CREATE_ITEM: 'CREATE_PAYROLL_ITEM'
};
```

### Company Actions
```typescript
const COMPANY_ACTIONS = {
  CREATE_COMPANY: 'CREATE_COMPANY',
  UPDATE_COMPANY: 'UPDATE_COMPANY',
  SUSPEND_COMPANY: 'SUSPEND_COMPANY',
  UPDATE_SUBSCRIPTION: 'UPDATE_SUBSCRIPTION'
};
```

## Target Types

```typescript
enum TargetType {
  USER = 'USER',
  COMPANY = 'COMPANY',
  DEPARTMENT = 'DEPARTMENT',
  ATTENDANCE_RECORD = 'ATTENDANCE_RECORD',
  ATTENDANCE_EVENT = 'ATTENDANCE_EVENT',
  PAYROLL_PERIOD = 'PAYROLL_PERIOD',
  PAYROLL_ITEM = 'PAYROLL_ITEM',
  SCHEDULE_TEMPLATE = 'SCHEDULE_TEMPLATE',
  SCHEDULE_ASSIGNMENT = 'SCHEDULE_ASSIGNMENT',
  HOLIDAY = 'HOLIDAY',
  TERMINAL = 'TERMINAL',
  HTTP_REQUEST = 'HTTP_REQUEST',
  SYSTEM = 'SYSTEM'
}
```

## Usage Examples

### Example 1: User Creation
```typescript
// In AuthService.createUserByAdmin()
const savedUser = await this.userRepository.save(newUser);

// Log the action
await this.auditService.log(
  actorUserId,
  'CREATE_USER',
  'USER',
  savedUser.id,
  null,
  {
    email: savedUser.email,
    role: savedUser.role,
    company_id: savedUser.company_id,
    created_by: actorUserId
  }
);
```

### Example 2: Payroll Processing
```typescript
// In PayrollService.processPeriod()
const period = await this.periodRepository.findOne(periodId);

const beforeState = {
  status: period.status,
  processed_at: period.processed_at
};

// Process logic...
period.status = PeriodStatus.PROCESSED;
period.processed_at = new Date();

await this.periodRepository.save(period);

// Log the action
await this.auditService.log(
  actorUserId,
  'PROCESS_PAYROLL_PERIOD',
  'PAYROLL_PERIOD',
  periodId,
  beforeState,
  {
    status: period.status,
    processed_at: period.processed_at,
    total_items: processedItems.length
  }
);
```

### Example 3: Attendance Manual Adjustment
```typescript
// In AttendanceService.createManualAdjustment()
await this.auditService.log(
  adminUserId,
  'MANUAL_ATTENDANCE_ADJUSTMENT',
  'ATTENDANCE_RECORD',
  recordId,
  {
    check_in_time: oldRecord.check_in_time,
    check_out_time: oldRecord.check_out_time
  },
  {
    check_in_time: adjustment.check_in_time,
    check_out_time: adjustment.check_out_time,
    reason: adjustment.reason,
    adjusted_by: adminUserId
  }
);
```

## Audit Log Analysis

### Query Patterns

#### Get all actions by a user
```typescript
const userActions = await auditService.findAll(userId);
```

#### Get all changes to a specific entity
```typescript
const entityHistory = await auditService.findAll(
  null, // any actor
  'USER', // target type
  startDate,
  endDate
);

// Filter by specific entity
const userHistory = entityHistory.data.filter(
  log => log.target_id === specificUserId
);
```

#### Get all failed login attempts
```typescript
const failedLogins = await auditRepository.find({
  where: {
    action: 'LOGIN_FAILED',
    created_at: Between(startDate, endDate)
  },
  order: {
    created_at: 'DESC'
  }
});
```

#### Get all actions in last 24 hours
```typescript
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const recentActions = await auditService.findAll(
  null,
  null,
  yesterday,
  new Date()
);
```

## Compliance & Reporting

### GDPR Compliance
- User data access history
- Data modification tracking
- Data deletion logs
- Right to be forgotten audit

### Security Audit
- Failed login attempts
- Unauthorized access attempts
- Permission changes
- Sensitive data access

### Operational Audit
- System changes
- Configuration updates
- Batch operations
- Scheduled jobs

## Best Practices

### 1. What to Log
**DO log**:
- User authentication (login/logout)
- Create, Update, Delete operations
- Permission changes
- Sensitive data access
- Manual adjustments
- Approval actions
- System errors

**DON'T log**:
- Read-only queries (too many)
- Health check endpoints
- Static file requests
- Passwords (even hashed)

### 2. Performance Considerations
- Async logging (don't block main flow)
- Batch inserts for high-volume
- Index commonly queried fields
- Archive old logs periodically

### 3. Data Retention
```typescript
// Example retention policy
const RETENTION_PERIODS = {
  AUTH_LOGS: 90,        // 90 days
  USER_ACTIONS: 365,    // 1 year
  SYSTEM_LOGS: 30,      // 30 days
  SECURITY_LOGS: 730    // 2 years
};
```

### 4. Sensitive Data
- Mask sensitive fields in before/after
- Don't log full credit card numbers
- Don't log full passwords
- Redact PII when appropriate

```typescript
function maskSensitiveData(data: any): any {
  const masked = { ...data };

  if (masked.password_hash) {
    masked.password_hash = '***REDACTED***';
  }

  if (masked.credit_card) {
    masked.credit_card = masked.credit_card.replace(/\d(?=\d{4})/g, '*');
  }

  return masked;
}
```

## Monitoring & Alerts

### Alert Triggers
1. **Multiple failed logins**: Potential brute force
2. **Unauthorized access**: Permission denied errors
3. **Mass deletions**: Unusual delete operations
4. **Off-hours activity**: Activity outside business hours
5. **Privilege escalation**: Role changes

### Monitoring Metrics
- Logs per minute/hour
- Error rate
- Failed authentication rate
- Suspicious patterns

## Database Optimization

### Indexes
```sql
CREATE INDEX idx_audit_actor ON audit_logs(actor);
CREATE INDEX idx_audit_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);
```

### Partitioning
```sql
-- Partition by month
CREATE TABLE audit_logs_2024_11 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
```

### Archiving
```typescript
// Archive logs older than retention period
async archiveOldLogs() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 365);

  const oldLogs = await auditRepository.find({
    where: {
      created_at: LessThan(cutoffDate)
    }
  });

  // Move to archive table or export to file
  await archiveStorage.save(oldLogs);

  // Delete from main table
  await auditRepository.delete({
    created_at: LessThan(cutoffDate)
  });
}
```

## Future Enhancements

1. **Real-time Audit Dashboard**: Live audit monitoring
2. **Anomaly Detection**: ML-based suspicious activity detection
3. **Audit Reports**: Scheduled compliance reports
4. **Advanced Search**: Full-text search in logs
5. **Export Functionality**: CSV/PDF export
6. **Webhook Integration**: External SIEM integration
7. **Chain of Custody**: Cryptographic verification
8. **Tamper Detection**: Log integrity verification

## Testing

### Unit Tests
- Log creation
- Query filtering
- Date range filters
- Pagination

### Integration Tests
- HTTP request logging
- Interceptor integration
- End-to-end audit flow

## Dependencies

### External
- TypeORM: Database operations
- @nestjs/common: NestJS core

## Environment Variables
```env
AUDIT_RETENTION_DAYS=365
AUDIT_ARCHIVE_ENABLED=true
AUDIT_LOG_HTTP_REQUESTS=true
```

## Security Considerations

### Log Tampering Prevention
- Immutable logs (no update/delete)
- Digital signatures
- Hash chain verification
- Separate audit database

### Access Control
- Only SUPER_ADMIN and COMPANY_OWNER can view
- Company isolation
- Audit log for audit access

### Encryption
- Encrypt sensitive data in logs
- Secure log transmission
- Encrypted backups
