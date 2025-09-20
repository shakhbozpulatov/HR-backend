## API Documentation Examples

### README.md
```markdown
# HR Back-Office System Backend

A comprehensive HR management system built with NestJS, PostgreSQL, and TypeORM, featuring attendance tracking, payroll processing, and employee management.

## Features

- **Employee Management**: Complete CRUD operations with bulk import/export
- **Dynamic Scheduling**: Flexible work schedules with templates and exceptions
- **Attendance Tracking**: Face recognition terminal integration with webhook processing
- **Payroll Processing**: Automated payroll calculation with multiple tariff types
- **Analytics Dashboard**: Essential HR metrics and reporting
- **Audit Trail**: Complete audit logging for compliance
- **Role-Based Access Control**: Fine-grained permissions system

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hr-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations:
```bash
npm run migration:run
```

5. Start the development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000/api/v1`

### Docker Setup

```bash
docker-compose up -d
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - User logout

### Employees
- `GET /api/v1/employees` - List employees with pagination
- `POST /api/v1/employees` - Create new employee
- `GET /api/v1/employees/:id` - Get employee details
- `PATCH /api/v1/employees/:id` - Update employee
- `DELETE /api/v1/employees/:id` - Archive employee
- `POST /api/v1/employees/import` - Bulk import employees

### Attendance
- `POST /api/v1/terminals/events` - Webhook endpoint for attendance events
- `GET /api/v1/attendance/records` - Get attendance records
- `POST /api/v1/attendance/records/:employeeId/:date/adjustments` - Manual corrections
- `POST /api/v1/attendance/records/:employeeId/:date/approve` - Approve attendance
- `GET /api/v1/attendance/timesheet` - Get timesheet grid view

### Payroll
- `POST /api/v1/payroll/periods` - Create payroll period
- `GET /api/v1/payroll/periods` - List payroll periods
- `POST /api/v1/payroll/periods/:id/process` - Process payroll
- `GET /api/v1/payroll/periods/:id/items` - Get payroll items
- `POST /api/v1/payroll/periods/:id/export` - Export payroll data

### Analytics
- `GET /api/v1/analytics/attendance` - Attendance metrics
- `GET /api/v1/analytics/payroll` - Payroll metrics
- `GET /api/v1/analytics/dashboard` - Dashboard summary

## Webhook Integration

### Terminal Events

The system accepts webhook events from face recognition terminals:

```json
POST /api/v1/terminals/events
Headers:
  X-Signature: sha256=<hmac-signature>
  X-Idempotency-Key: <unique-key>
  X-Timestamp: <iso-timestamp>

{
  "event_id": "vendor-event-123",
  "device_id": "device-001",
  "terminal_user_id": "terminal-user-456",
  "event_type": "clock_in",
  "timestamp": "2024-09-20T08:55:12Z",
  "metadata": {
    "confidence": 0.98
  }
}
```

### Security

- HMAC-SHA256 signature verification
- Idempotency key handling
- Timestamp validation (10-minute window)
- IP allowlist support

## Configuration

Key environment variables:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=hr_backend

# Security
JWT_SECRET=your-jwt-secret
WEBHOOK_SECRET=your-webhook-secret

# Attendance Rules
GRACE_IN_MINUTES=5
GRACE_OUT_MINUTES=0
ROUNDING_MINUTES=5
OVERTIME_THRESHOLD_MINUTES=15
OVERTIME_MULTIPLIER=1.5
```

## Business Logic

### Attendance Processing

1. **Event Ingestion**: Webhooks received from terminals
2. **Employee Resolution**: Map terminal_user_id to employee_id
3. **Event Pairing**: Match clock_in