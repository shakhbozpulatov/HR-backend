# Attendance Module Documentation

## Umumiy Ma'lumot
Attendance moduli xodimlarning davomat ma'lumotlarini boshqarish, HC Cabinet'dan eventlarni olish, qayta ishlash va kunlik attendance recordlarini yaratish uchun mas'ul. Bu eng murakkab modullardan biri bo'lib, real-time event processing, background queue processing va kompleks business logikalarni o'z ichiga oladi.

## Arxitektura

### Module Tuzilmasi
```
attendance/
├── dto/
│   ├── attendance-filter.dto.ts          # Filtrlash uchun
│   ├── webhook-event.dto.ts              # HC webhook events
│   ├── enrollment.dto.ts                 # User enrollment
│   ├── manual-adjustment.dto.ts          # Manual tuzatishlar
│   ├── batch-process.dto.ts              # Batch processing
│   ├── resolve-quarantine.dto.ts         # Quarantine resolution
│   └── response.dto.ts                   # Response DTOs
├── entities/
│   ├── attendance-event.entity.ts        # Raw HC events
│   ├── attendance-record.entity.ts       # Kunlik attendance
│   ├── user-device-mapping.entity.ts     # User-device mapping
│   └── terminal-device.entity.ts         # Terminal info
├── services/
│   ├── attendance-events.service.ts      # Event management
│   ├── attendance-records.service.ts     # Record management
│   ├── attendance-processor.service.ts   # Business logic
│   ├── hc-attendance-fetch.service.ts    # HC data fetching
│   └── user-device-mapping.service.ts    # Mapping management
├── controllers/
│   ├── attendance-records.controller.ts   # Records API
│   ├── device-enrollment.controller.ts    # Enrollment API
│   ├── device-status.controller.ts        # Status API
│   └── batch-processing.controller.ts     # Batch operations
├── processors/
│   └── attendance-queue.processor.ts      # Background processing
├── cron/
│   └── attendance-cron.service.ts         # Scheduled tasks
└── attendance.module.ts                   # Module konfiguratsiyasi
```

## Attendance Event Entity

### Maydonlar
```typescript
{
  event_id: string (UUID)            // Asosiy identifikator
  company_id: string                 // Kompaniya ID

  // HC event data
  person_id: string                  // HC person ID
  person_code?: string               // HC person code
  device_id: string                  // Terminal ID
  device_name?: string               // Terminal nomi
  event_time: Date                   // Event vaqti
  event_type: EventType              // IN, OUT, BREAK_START, BREAK_END

  // Processing
  source: EventSource                // WEBHOOK, POLL, MANUAL
  processing_status: ProcessingStatus // PENDING, PROCESSING, COMPLETED, FAILED
  processed_at?: Date                // Qayta ishlangan vaqt
  error_message?: string             // Xatolik xabari

  // User mapping
  user_id?: string                   // Mapped user ID
  is_mapped: boolean                 // Mapping mavjudmi

  // Quarantine
  in_quarantine: boolean             // Quarantine'dami
  quarantine_reason?: string         // Sabab

  // Timestamps
  created_at: Date
  updated_at: Date

  // Relations
  user?: User
  company: Company
}
```

### EventType Enum
```typescript
enum EventType {
  IN = 'IN',                   // Kirishda
  OUT = 'OUT',                 // Chiqishda
  BREAK_START = 'BREAK_START', // Tanaffus boshi
  BREAK_END = 'BREAK_END'      // Tanaffus tugashi
}
```

### ProcessingStatus Enum
```typescript
enum ProcessingStatus {
  PENDING = 'PENDING',         // Kutilmoqda
  PROCESSING = 'PROCESSING',   // Qayta ishlanmoqda
  COMPLETED = 'COMPLETED',     // Tugallangan
  FAILED = 'FAILED',           // Xatolik
  QUARANTINED = 'QUARANTINED'  // Karantinda
}
```

### EventSource Enum
```typescript
enum EventSource {
  WEBHOOK = 'WEBHOOK',         // HC webhook orqali
  POLL = 'POLL',               // Polling orqali
  MANUAL = 'MANUAL'            // Qo'lda kiritilgan
}
```

## Attendance Record Entity

### Maydonlar
```typescript
{
  record_id: string (UUID)           // Asosiy identifikator
  user_id: string                    // Xodim ID
  company_id: string                 // Kompaniya ID
  date: Date                         // Ish kuni (YYYY-MM-DD)

  // Check-in/out times
  check_in_time?: Date               // Kelgan vaqt
  check_out_time?: Date              // Ketgan vaqt

  // Scheduled vs Actual
  scheduled_in?: string              // Rejalashtirilgan kirish ("09:00")
  scheduled_out?: string             // Rejalashtirilgan chiqish ("18:00")

  // Work hours calculation
  total_hours?: number               // Jami ish soatlari
  regular_hours?: number             // Oddiy soatlar
  overtime_hours?: number            // Ortiqcha soatlar
  break_hours?: number               // Tanaffus soatlari

  // Lateness tracking
  late_minutes?: number              // Kechikish daqiqalari
  early_departure_minutes?: number   // Erta ketish daqiqalari

  // Status
  status: AttendanceStatus           // OK, LATE, ABSENT, PARTIAL, etc.
  is_locked: boolean                 // Qulflangan (o'zgartirib bo'lmaydi)
  requires_approval: boolean         // Tasdiqlash kerakmi

  // Manual adjustments
  has_manual_adjustment: boolean     // Manual tuzatish mavjudmi
  adjustment_reason?: string         // Tuzatish sababi

  // Approval workflow
  approved_by?: string               // Kim tasdiqlagan
  approved_at?: Date                 // Qachon tasdiqlangan
  approval_notes?: string            // Tasdiqlash izoh

  // Source events
  source_events?: string[]           // Event IDs (JSONB array)

  // Timestamps
  created_at: Date
  updated_at: Date

  // Relations
  user: User
  company: Company
}
```

### AttendanceStatus Enum
```typescript
enum AttendanceStatus {
  OK = 'OK',                         // Normal davomat
  LATE = 'LATE',                     // Kech kelgan
  ABSENT = 'ABSENT',                 // Yo'q bo'lgan
  PARTIAL = 'PARTIAL',               // Qisman (faqat IN yoki OUT)
  EARLY_DEPARTURE = 'EARLY_DEPARTURE', // Erta ketgan
  PENDING = 'PENDING',               // Kutilmoqda
  HOLIDAY = 'HOLIDAY',               // Bayram
  DAYOFF = 'DAYOFF',                 // Dam olish kuni
  SICK_LEAVE = 'SICK_LEAVE',         // Kasallik ta'tili
  VACATION = 'VACATION'              // Tatil
}
```

## User Device Mapping Entity

### Maydonlar
```typescript
{
  mapping_id: string (UUID)          // Asosiy identifikator
  user_id: string                    // User ID
  hc_person_id: string               // HC person ID
  person_code?: string               // HC person code
  company_id: string                 // Kompaniya ID

  // Enrollment
  enrollment_status: EnrollmentStatus // ENROLLED, PENDING, FAILED
  enrolled_at?: Date                 // Enrollment sanasi

  // Metadata (JSONB)
  metadata?: {
    face_enrolled: boolean
    fingerprint_enrolled: boolean
    card_enrolled: boolean
    last_sync: Date
  }

  active: boolean                    // Faollik holati

  // Timestamps
  created_at: Date
  updated_at: Date

  // Relations
  user: User
  company: Company
}
```

## Asosiy Funksiyonallik

### 1. Event Processing Flow

#### A. HC Cabinet Event Fetching (Cron)
**Cron**: Har daqiqa ishlaydi
**Service**: `attendance-cron.service.ts`

```typescript
@Cron('*/1 * * * *') // Har daqiqa
async fetchAttendanceEvents() {
  // 1. HC'dan eventlarni olish
  const events = await hcService.getAllEvents(1000);

  // 2. Har bir eventni save qilish
  for (const event of events.data.events) {
    await attendanceEventsService.createEvent({
      person_id: event.personId,
      device_id: event.deviceId,
      event_time: event.eventTime,
      event_type: determineEventType(event),
      source: EventSource.POLL,
      processing_status: ProcessingStatus.PENDING
    });
  }

  // 3. Batch'ni complete qilish
  await hcService.completeEvent(events.data.batchId);

  // 4. Queue'ga qo'shish (background processing)
  await attendanceQueue.add('process-events', {
    eventIds: newEvents.map(e => e.event_id)
  });
}
```

#### B. Event Processing (Queue)
**Queue**: `attendance`
**Processor**: `attendance-queue.processor.ts`

```typescript
@Process('process-events')
async processEvents(job: Job) {
  const { eventIds } = job.data;

  for (const eventId of eventIds) {
    // 1. Get event
    const event = await eventRepository.findOne(eventId);

    // 2. Map person_id to user_id
    const mapping = await findUserMapping(event.person_id);

    if (!mapping) {
      // Quarantine'ga qo'yish
      event.in_quarantine = true;
      event.quarantine_reason = 'User not mapped';
      continue;
    }

    event.user_id = mapping.user_id;
    event.is_mapped = true;

    // 3. Create or update attendance record
    await createOrUpdateRecord(event);

    // 4. Mark as completed
    event.processing_status = ProcessingStatus.COMPLETED;
    event.processed_at = new Date();
  }
}
```

#### C. Attendance Record Creation
```typescript
async createOrUpdateRecord(event: AttendanceEvent) {
  const date = moment(event.event_time).format('YYYY-MM-DD');

  // Find or create record for the day
  let record = await recordRepository.findOne({
    where: { user_id: event.user_id, date }
  });

  if (!record) {
    record = recordRepository.create({
      user_id: event.user_id,
      company_id: event.company_id,
      date,
      status: AttendanceStatus.PENDING
    });
  }

  // Update based on event type
  if (event.event_type === EventType.IN) {
    // First IN or earliest IN
    if (!record.check_in_time ||
        event.event_time < record.check_in_time) {
      record.check_in_time = event.event_time;
    }
  } else if (event.event_type === EventType.OUT) {
    // Last OUT or latest OUT
    if (!record.check_out_time ||
        event.event_time > record.check_out_time) {
      record.check_out_time = event.event_time;
    }
  }

  // Calculate work hours and status
  await calculateWorkHours(record);
  await determineStatus(record);

  await recordRepository.save(record);
}
```

### 2. Work Hours Calculation
```typescript
async function calculateWorkHours(record: AttendanceRecord) {
  if (!record.check_in_time || !record.check_out_time) {
    record.status = AttendanceStatus.PARTIAL;
    return;
  }

  const checkIn = moment(record.check_in_time);
  const checkOut = moment(record.check_out_time);

  // Total hours
  const totalMinutes = checkOut.diff(checkIn, 'minutes');
  record.total_hours = totalMinutes / 60;

  // Get schedule
  const schedule = await getSchedule(record.user_id, record.date);

  // Scheduled hours
  const scheduledHours = schedule.work_hours.total_hours; // e.g., 9 hours

  // Break deduction
  const breakMinutes = schedule.work_hours.break_duration_minutes || 0;
  const workMinutes = totalMinutes - breakMinutes;

  record.regular_hours = Math.min(workMinutes / 60, scheduledHours);
  record.overtime_hours = Math.max(0, (workMinutes / 60) - scheduledHours);
  record.break_hours = breakMinutes / 60;

  // Lateness calculation
  const scheduledIn = moment(record.date + ' ' + schedule.work_hours.start_time);
  const lateMinutes = checkIn.diff(scheduledIn, 'minutes');

  if (lateMinutes > company.payroll_settings.grace_in_minutes) {
    record.late_minutes = lateMinutes - company.payroll_settings.grace_in_minutes;
  }

  // Early departure
  const scheduledOut = moment(record.date + ' ' + schedule.work_hours.end_time);
  const earlyMinutes = scheduledOut.diff(checkOut, 'minutes');

  if (earlyMinutes > company.payroll_settings.grace_out_minutes) {
    record.early_departure_minutes = earlyMinutes;
  }
}
```

### 3. Status Determination
```typescript
async function determineStatus(record: AttendanceRecord) {
  // Holiday check
  if (await isHoliday(record.date, user.location)) {
    record.status = AttendanceStatus.HOLIDAY;
    return;
  }

  // Weekend check
  const schedule = await getSchedule(record.user_id, record.date);
  if (!schedule.isWorkingDay(record.date)) {
    record.status = AttendanceStatus.DAYOFF;
    return;
  }

  // Absent (no check-in/out)
  if (!record.check_in_time && !record.check_out_time) {
    record.status = AttendanceStatus.ABSENT;
    return;
  }

  // Partial (only IN or only OUT)
  if (!record.check_in_time || !record.check_out_time) {
    record.status = AttendanceStatus.PARTIAL;
    return;
  }

  // Late
  if (record.late_minutes && record.late_minutes > 0) {
    record.status = AttendanceStatus.LATE;
    return;
  }

  // Early departure
  if (record.early_departure_minutes && record.early_departure_minutes > 0) {
    record.status = AttendanceStatus.EARLY_DEPARTURE;
    return;
  }

  // Normal
  record.status = AttendanceStatus.OK;
}
```

### 4. Manual Adjustments
**Endpoint**: `POST /attendance/records/:userId/:date/adjust`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN, HR_MANAGER

**Kirish ma'lumotlari**:
```json
{
  "check_in_time": "2024-11-29T09:00:00Z",
  "check_out_time": "2024-11-29T18:00:00Z",
  "reason": "System error - manual correction",
  "requires_approval": true
}
```

**Use case**: Terminal xatoligi yoki tizim muammolari

### 5. Quarantine Management

#### Get Quarantined Events
**Endpoint**: `GET /attendance/events/quarantine`

**Response**:
```json
{
  "data": [
    {
      "event_id": "uuid",
      "person_id": "HC-PERSON-123",
      "event_time": "2024-11-29T09:00:00Z",
      "quarantine_reason": "User not mapped",
      "device_name": "Main Entrance"
    }
  ]
}
```

#### Resolve Quarantine
**Endpoint**: `POST /attendance/events/quarantine/resolve`

**Kirish ma'lumotlari**:
```json
{
  "event_id": "uuid",
  "user_id": "user-uuid",
  "create_mapping": true
}
```

**Jarayon**:
1. Event'ni topish
2. User mapping yaratish (agar kerak bo'lsa)
3. Event'ni qayta ishlash
4. Quarantine'dan chiqarish

### 6. Batch Processing
**Endpoint**: `POST /attendance/batch/process-date-range`

**Kirish ma'lumotlari**:
```json
{
  "start_date": "2024-11-01",
  "end_date": "2024-11-30",
  "user_ids": ["user-1", "user-2"]
}
```

**Use case**: O'tgan kunlarni qayta hisoblash

### 7. Fetch from HC by Date Range
**Endpoint**: `POST /attendance/fetch/date-range`

**Kirish ma'lumotlari**:
```json
{
  "start_date": "2024-11-01",
  "end_date": "2024-11-30"
}
```

**Jarayon**:
HC Cabinet'dan `searchCertificateRecords` API orqali ma'lumotlarni olish

### 8. Get Events (with Arrival/Departure Time Differences)
**Endpoint**: `GET /attendance/events/get-events`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN, HR_MANAGER

**Query Parameters**:
```
?startTime=2024-11-01T00:00:00Z&endTime=2024-11-30T23:59:59Z&page=1&limit=20&userId=HC-PERSON-ID
```

**Response Structure**:
```json
{
  "employees": [
    {
      "id": "user-uuid",
      "name": "John Doe",
      "personId": "HC-PERSON-123",
      "phone": "+998901234567",
      "attendance": [
        {
          "date": "2024-11-29",
          "startTime": "09:15",
          "endTime": "18:30",
          "arrivalDifferenceSeconds": -900,
          "departureDifferenceSeconds": 1800
        },
        {
          "date": "2024-11-30",
          "startTime": "08:45",
          "endTime": "17:45",
          "arrivalDifferenceSeconds": 900,
          "departureDifferenceSeconds": -900
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

**Time Difference Calculations**:

#### `arrivalDifferenceSeconds` (Kelish farqi):
- **Negative (-)** = Kechikib kelgan
  - Misol: `-900` = 15 daqiqa kechikkan (09:15 keldi, 09:00 bo'lishi kerak edi)
  - Formula: `scheduled_start - actual_start` (09:00 - 09:15 = -900 seconds)
- **Positive (+)** = Erta kelgan
  - Misol: `+600` = 10 daqiqa erta kelgan (08:50 keldi, 09:00 bo'lishi kerak edi)
  - Formula: `scheduled_start - actual_start` (09:00 - 08:50 = +600 seconds)
- **null** = Schedule template yoki actual arrival mavjud emas

#### `departureDifferenceSeconds` (Ketish farqi):
- **Negative (-)** = Erta ketgan
  - Misol: `-1200` = 20 daqiqa erta ketgan (17:40 ketdi, 18:00 bo'lishi kerak edi)
  - Formula: `actual_end - scheduled_end` (17:40 - 18:00 = -1200 seconds)
- **Positive (+)** = Kech ketgan / Overtime
  - Misol: `+1800` = 30 daqiqa qo'shimcha ishlagan (18:30 ketdi, 18:00 bo'lishi kerak edi)
  - Formula: `actual_end - scheduled_end` (18:30 - 18:00 = +1800 seconds)
- **null** = Schedule template yoki actual departure mavjud emas

**Special Cases**:
1. Agar `check_out` event mavjud bo'lmasa, template'dagi `end_time` ishlatiladi
2. Agar user'da schedule template tayinlanmagan bo'lsa, farq hisoblash mumkin emas (null qaytariladi)
3. Barcha vaqtlar UTC+5 (Tashkent) timezone'ida ko'rsatiladi

**Use case**:
- Davomat hisobotlari yaratish
- Kechikishlarni tahlil qilish
- Overtime soatlarini hisoblash
- Excel/PDF hisobotlar generatsiya qilish

## User Device Enrollment

### Enroll User
**Endpoint**: `POST /attendance/enrollment`

**Kirish ma'lumotlari**:
```json
{
  "user_id": "user-uuid",
  "hc_person_id": "HC-PERSON-123",
  "access_level_ids": ["access-1", "access-2"]
}
```

**Jarayon**:
1. Mapping yaratish
2. HC'da terminal binding
3. Enrollment status yangilash

### Get Enrollment Status
**Endpoint**: `GET /attendance/enrollment/:userId`

**Response**:
```json
{
  "user_id": "user-uuid",
  "hc_person_id": "HC-PERSON-123",
  "enrollment_status": "ENROLLED",
  "metadata": {
    "face_enrolled": true,
    "fingerprint_enrolled": false,
    "card_enrolled": true
  }
}
```

## Analytics & Reporting

### Get User Attendance Summary
**Endpoint**: `GET /attendance/summary/:userId?from=2024-11-01&to=2024-11-30`

**Response**:
```json
{
  "period": {
    "from": "2024-11-01",
    "to": "2024-11-30"
  },
  "summary": {
    "total_days": 22,
    "present_days": 20,
    "absent_days": 1,
    "late_days": 5,
    "total_hours": 176,
    "overtime_hours": 8,
    "attendance_rate": 90.9
  }
}
```

## Best Practices

### 1. Event Processing
- Asynchronous processing (queue)
- Idempotency (duplicate event handling)
- Error recovery
- Quarantine unknown events

### 2. Data Integrity
- Transaction usage
- Locking mechanisms
- Validation before save

### 3. Performance
- Batch processing
- Indexing (user_id, date, company_id)
- Caching (schedules, holidays)
- Pagination

### 4. Monitoring
- Event processing metrics
- Queue health
- Failed event tracking
- Quarantine monitoring

## Future Enhancements

1. **Real-time Dashboard**: Live attendance tracking
2. **Mobile App**: Check-in via mobile
3. **Geolocation**: Location-based check-in
4. **Face Recognition**: Advanced biometric
5. **Anomaly Detection**: Suspicious patterns
6. **Shift Management**: Advanced shift support
7. **Leave Integration**: Absence management
8. **Notification System**: Late arrival alerts

## Timestamp Handling and Timezone Management

### Overview
Attendance module handles timestamps from HC Cabinet API with proper timezone conversion to ensure accurate local time representation.

### Timestamp Fields in AttendanceEvent
```typescript
{
  ts_utc: Date        // Event time in UTC (from HC API)
  ts_local: Date      // Event time in local timezone (Asia/Tashkent)
  source_payload: any // Raw HC API response (includes deviceTime)
}
```

### Timestamp Sources

#### 1. **deviceTime** (Primary Source - Most Accurate)
HC Cabinet returns multiple timestamp fields, but `deviceTime` is the most accurate:

```json
{
  "occurTime": "2025-12-06T11:23:35Z",        // ❌ UTC time (not accurate)
  "deviceTime": "2025-12-06T16:23:35+05:00",  // ✅ Device local time with timezone
  "recordTime": "2025-12-06T11:22:20Z"        // ❌ Processing time (not actual event time)
}
```

**Why deviceTime?**
- Contains actual device timezone offset (`+05:00` for Tashkent)
- Reflects the real time when event occurred at the terminal
- More accurate than `occurTime` which is converted to UTC

#### 2. Webhook Event Processing

When processing webhook events, the service prioritizes `deviceTime`:

```typescript
// attendance-events.service.ts:256-273
const deviceTime = eventData.metadata?.deviceTime || eventData.timestamp;

const timezone = eventData.timezone ||
  this.configService.get('DEFAULT_TIMEZONE', 'Asia/Tashkent');

// Parse deviceTime - it already contains timezone offset (+05:00)
const tsUtc = moment.utc(deviceTime).toDate();
const tsLocal = moment.tz(deviceTime, timezone).toDate();

this.logger.debug('Timestamp parsing:', {
  deviceTime,
  timestamp: eventData.timestamp,
  tsUtc: tsUtc.toISOString(),
  tsLocal: tsLocal.toISOString(),
  timezone,
});
```

**Flow**:
1. Extract `deviceTime` from `metadata` (if available)
2. Fallback to `timestamp` if `deviceTime` not present
3. Parse to UTC and local timezone
4. Store both in database
5. Log for debugging

### API Response Format

#### GET /attendance/events/user/:userId

Returns events with properly formatted timestamps:

```json
{
  "userId": "652589467101967360",
  "userName": "John Doe",
  "attendance": [
    {
      "eventId": "uuid",
      "eventType": "CLOCK_IN",
      "timestamp": "2025-12-06T11:23:35.000Z",        // UTC time
      "timestampLocal": "2025-12-06T16:23:35.000+05:00"  // Local time with timezone
    }
  ]
}
```

**Implementation** (`attendance-events.service.ts:827-829`):
```typescript
timestampLocal: moment(event.ts_local)
  .tz('Asia/Tashkent')
  .format('YYYY-MM-DDTHH:mm:ss.SSSZ')
```

### Timezone Configuration

Default timezone is configurable via environment variables:

```env
DEFAULT_TIMEZONE=Asia/Tashkent  # UTC+5
```

Supported timezone operations:
- Event parsing (from HC deviceTime)
- Event grouping by date
- Response formatting
- Excel report generation

### Common Pitfalls and Solutions

#### Problem 1: Wrong Local Time in Response
**Symptom**: `timestampLocal` shows UTC time instead of local time

**Cause**: Using `.toISOString()` which always returns UTC format

**Solution**: Use `moment.tz().format()` with timezone:
```typescript
// ❌ Wrong
timestampLocal: event.ts_local.toISOString()  // Returns UTC format

// ✅ Correct
timestampLocal: moment(event.ts_local)
  .tz('Asia/Tashkent')
  .format('YYYY-MM-DDTHH:mm:ss.SSSZ')
```

#### Problem 2: Date Grouping Issues
**Symptom**: Events grouped incorrectly across midnight

**Solution**: Convert to local timezone before date extraction:
```typescript
const dateStr = moment
  .utc(event.created_at)
  .utcOffset(5)  // +5 hours for Tashkent
  .format('YYYY-MM-DD');
```

#### Problem 3: Missing deviceTime in Webhook
**Symptom**: Webhook doesn't include `deviceTime` in metadata

**Solution**: Ensure webhook payload includes full HC response:
```typescript
// webhook-event.dto.ts:40-41
metadata?: {
  deviceTime?: string;  // Device local time
  [key: string]: any;   // Allow all HC fields
}
```

### Testing Timestamp Handling

#### Example Test Case:
```typescript
// Event occurs at 16:23 local time (Tashkent)
const hcEvent = {
  occurTime: "2025-12-06T11:23:35Z",        // UTC representation
  deviceTime: "2025-12-06T16:23:35+05:00",  // Local with timezone
};

// After processing:
expect(savedEvent.ts_utc).toEqual(new Date("2025-12-06T11:23:35.000Z"));
expect(savedEvent.ts_local).toEqual(new Date("2025-12-06T16:23:35.000Z"));

// In API response:
expect(response.timestampLocal).toBe("2025-12-06T16:23:35.000+05:00");
```

### Debugging Timestamp Issues

Enable debug logging to track timestamp conversions:

```typescript
this.logger.debug('Timestamp parsing:', {
  deviceTime,          // Input from HC
  timestamp,           // Fallback timestamp
  tsUtc: tsUtc.toISOString(),     // Stored UTC
  tsLocal: tsLocal.toISOString(), // Stored local
  timezone,            // Timezone used
});
```

### Best Practices

1. **Always use deviceTime** when available from HC API
2. **Store both UTC and local** timestamps in database
3. **Format responses** with timezone offset for clarity
4. **Test edge cases**: midnight transitions, DST changes
5. **Log timestamp conversions** for debugging

## Dependencies

### Internal
- Users module
- Schedules module
- Holidays module
- HC module
- Company module

### External
- TypeORM
- Bull (queue)
- moment-timezone (timestamp handling)
- ExcelJS (reporting)

## Environment Variables
```env
WEBHOOK_SECRET=your-webhook-secret
ATTENDANCE_QUEUE_CONCURRENCY=5
HC_POLL_INTERVAL=60000
DEFAULT_TIMEZONE=Asia/Tashkent
```
