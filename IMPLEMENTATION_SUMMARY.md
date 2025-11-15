# HC Attendance Events Implementation Summary

## Overview
This implementation adds comprehensive attendance tracking functionality that integrates with HC (Hikvision) biometric terminals to track employee face scan events, automatically determine clock-in/clock-out events, and provide formatted attendance data to the frontend.

## Key Features Implemented

### 1. User Entity Enhancement
**File**: `src/modules/users/entities/user.entity.ts`

Added two new fields to track attendance state:
- `last_event_type`: Stores whether the last event was 'clock_in' or 'clock_out'
- `last_event_date`: Stores the date of the last attendance event

### 2. HC API Integration
**Files**:
- `src/modules/hc/config/hc-api.config.ts`
- `src/modules/hc/interfaces/hc-api.interface.ts`
- `src/modules/hc/hc.service.ts`

Added HC certificate records search endpoint:
- Endpoint: `/acs/v1/event/certificaterecords/search`
- Method: `searchCertificateRecords()` in HcService
- Interfaces for request/response types

### 3. Request/Response DTOs
**File**: `src/modules/attendance/dto/fetch-attendance-events.dto.ts`

Created DTOs for:
- `FetchAttendanceEventsDto`: Request parameters (pagination, time range)
- `UserAttendanceSummaryDto`: User attendance summary
- `WorkSessionDto`: Entry/exit time intervals
- `PaginationMetadataDto`: Pagination information
- `FetchAttendanceEventsResponseDto`: Complete response structure

### 4. HC Attendance Fetch Service
**File**: `src/modules/attendance/services/hc-attendance-fetch.service.ts`

Core service implementing:
- Fetching events from HC with pagination
- Filtering successful events (eventType: 80093)
- Mapping HC personCode to platform users via hcPersonId
- Automatic clock-in/clock-out determination based on last event
- Event deduplication using idempotency keys
- Terminal device management
- Data transformation to required output format

**Key Methods**:
- `fetchAndProcessEvents()`: Main entry point
- `processAndSaveEvents()`: Process and save HC events
- `determineEventType()`: Determine if event is clock_in or clock_out
- `getOrCreateTerminalDevice()`: Manage terminal devices
- `transformToOutputFormat()`: Transform to frontend format

### 5. API Endpoint
**File**: `src/modules/attendance/controllers/attendance-events.controller.ts`

New endpoint: `GET /api/v1/attendance/events/fetch-hc-attendance`

**Parameters**:
- `maxNumberPerTime` (required): Number of records per page (1-100)
- `startTime` (optional): Start time (ISO 8601), defaults to 7 days ago
- `endTime` (optional): End time (ISO 8601), defaults to now
- `page` (optional): Page number, defaults to 1

**Response Format**:
```json
{
  "data": [
    {
      "userId": "uuid",
      "userName": "John Doe",
      "clockIn": "2025-11-01T09:00:00Z",
      "clockOut": "2025-11-01T18:00:00Z",
      "innerData": [
        {
          "entryTime": "2025-11-01T09:00:00Z",
          "exitTime": "2025-11-01T12:00:00Z"
        },
        {
          "entryTime": "2025-11-01T13:00:00Z",
          "exitTime": "2025-11-01T18:00:00Z"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

**Authorization**: Requires authentication and one of these roles:
- SUPER_ADMIN
- COMPANY_OWNER
- ADMIN
- HR_MANAGER

### 6. Automatic Clock-Out Cron Job
**File**: `src/modules/attendance/cron/attendance-cron.service.ts`

Added automatic clock-out functionality:
- **Schedule**: Daily at 11:00 PM (Asia/Tashkent timezone)
- **Purpose**: Automatically creates clock-out events for users who forgot to clock out
- **Logic**:
  1. Finds all users with `last_event_type = 'clock_in'` for today
  2. Retrieves user's schedule end time
  3. Creates automatic clock-out event at schedule end time (defaults to 18:00)
  4. Marks event as auto-generated in source_payload

**Configuration**:
- `AUTO_CLOCK_OUT_ENABLED`: Enable/disable auto clock-out (default: true)

### 7. Module Registration
**File**: `src/modules/attendance/attendance.module.ts`

Registered:
- `HcAttendanceFetchService` in providers
- `User` and `TerminalDevice` entities in TypeOrmModule
- `UserScheduleAssignment` for cron job

## Implementation Logic

### Clock-In/Clock-Out Determination Algorithm

1. **Fetch HC Events**: Query HC certificate records API with time range and pagination
2. **Filter Success Events**: Only process events with `eventType === 80093`
3. **Map to Users**: Match `personCode` from HC to `hcPersonId` in User table
4. **Determine Event Type**:
   ```
   IF user.last_event_type is NULL OR user.last_event_date != today
     THEN event_type = CLOCK_IN
   ELSE IF user.last_event_type == 'clock_in'
     THEN event_type = CLOCK_OUT
   ELSE
     THEN event_type = CLOCK_IN
   ```
5. **Save to Database**: Create AttendanceEvent with determined type
6. **Update User State**: Update `last_event_type` and `last_event_date` in User table

### Automatic Clock-Out Logic

1. **Daily Cron Job** runs at 11:00 PM
2. **Find Users**: Query users with `last_event_type = 'clock_in'` and `last_event_date = today`
3. **Get Schedule**: Retrieve user's schedule assignment and end time
4. **Create Event**: Generate automatic clock-out at schedule end time
5. **Mark as Auto**: Set `auto_generated: true` in source_payload
6. **Update User**: Update user's last event type to 'clock_out'

## Database Changes Required

### Migration Steps

1. Add columns to `users` table:
   ```sql
   ALTER TABLE users
   ADD COLUMN last_event_type VARCHAR CHECK (last_event_type IN ('clock_in', 'clock_out')),
   ADD COLUMN last_event_date DATE;
   ```

2. Create migration file:
   ```bash
   npm run migration:generate -- -n AddLastEventFieldsToUser
   npm run migration:run
   ```

## Configuration

### Environment Variables

Add to `.env`:
```env
# HC API Configuration (existing)
HC_API_URL=https://your-hc-api-url.com
HC_ACCESS_TOKEN=your-access-token

# Auto Clock-Out Configuration
AUTO_CLOCK_OUT_ENABLED=true

# Timezone
DEFAULT_TIMEZONE=Asia/Tashkent
```

## Testing the Implementation

### 1. Manual Testing

Test the new endpoint:
```bash
# Fetch events for the last 7 days
curl -X GET "http://localhost:3000/api/v1/attendance/events/fetch-hc-attendance?maxNumberPerTime=20&page=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Fetch events with specific time range
curl -X GET "http://localhost:3000/api/v1/attendance/events/fetch-hc-attendance?maxNumberPerTime=20&startTime=2025-11-01T00:00:00Z&endTime=2025-11-08T23:59:59Z&page=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Test Scenarios

1. **First Event of the Day**: Should be marked as CLOCK_IN
2. **Second Event**: Should be marked as CLOCK_OUT
3. **Multiple Events**: Should alternate correctly
4. **User Without Mapping**: Should be skipped with warning log
5. **Duplicate Events**: Should not be saved again (idempotency check)
6. **Automatic Clock-Out**: Users who don't clock out should get automatic clock-out at 11 PM

### 3. Verify Data

Check the database:
```sql
-- Check user's last event
SELECT id, first_name, last_name, last_event_type, last_event_date
FROM users
WHERE last_event_date = CURRENT_DATE;

-- Check attendance events
SELECT event_id, user_id, event_type, ts_local, source_payload
FROM attendance_events
WHERE DATE(ts_local) = CURRENT_DATE
ORDER BY ts_local;
```

## API Usage Examples

### Frontend Integration

```typescript
// Fetch attendance events
const fetchAttendanceEvents = async (page: number = 1) => {
  const response = await fetch(
    `/api/v1/attendance/events/fetch-hc-attendance?` +
    `maxNumberPerTime=20&page=${page}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();
  return data;
};

// With custom date range
const fetchEventsInRange = async (startDate: string, endDate: string) => {
  const response = await fetch(
    `/api/v1/attendance/events/fetch-hc-attendance?` +
    `maxNumberPerTime=50&startTime=${startDate}&endTime=${endDate}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  return response.json();
};
```

## Monitoring & Logging

The implementation includes comprehensive logging:
- Event fetching from HC
- User mapping results
- Event type determination
- Save operations
- Automatic clock-out processing
- Error handling

**Log Examples**:
```
[HcAttendanceFetchService] Fetching events from HC: 2025-11-01T00:00:00Z to 2025-11-08T23:59:59Z, page 1
[HcAttendanceFetchService] Received 45 records from HC
[HcAttendanceFetchService] Filtered 42 successful events (eventType: 80093)
[HcAttendanceFetchService] Saved CLOCK_IN event for user John Doe at 2025-11-01T09:00:00Z
[AttendanceCronService] Starting automatic clock-out for 2025-11-13
[AttendanceCronService] Found 15 users needing automatic clock-out
[AttendanceCronService] Created auto clock-out for user Jane Smith at 18:00:00
```

## Security Considerations

1. **Authentication Required**: All endpoints require valid JWT token
2. **Role-Based Access**: Only authorized roles can access attendance data
3. **Idempotency**: Prevents duplicate event processing
4. **Input Validation**: DTOs validate all input parameters
5. **Rate Limiting**: Existing throttling applies to endpoints

## Performance Considerations

1. **Pagination**: Supports large datasets via pagination
2. **Indexes**: Uses existing indexes on `user_id`, `event_type`, and `ts_local`
3. **Batch Processing**: Processes events in batches
4. **Caching**: HC API responses are processed once and stored
5. **Query Optimization**: Efficient database queries with proper relations

## Future Enhancements

1. **Schedule Integration**: Fetch actual end_time from user's schedule template
2. **Notifications**: Send notifications for missing clock-out
3. **Analytics**: Add analytics for attendance patterns
4. **Mobile App**: Support for mobile check-in/check-out
5. **Geofencing**: Validate location for clock-in/clock-out
6. **Biometric Verification**: Enhanced security with multi-factor biometrics

## Troubleshooting

### Common Issues

**Issue**: Events not being saved
- Check if user exists with matching `hcPersonId`
- Verify HC API connectivity
- Check logs for error messages

**Issue**: Wrong event type assigned
- Verify `last_event_type` and `last_event_date` in users table
- Check timezone settings

**Issue**: Automatic clock-out not working
- Verify `AUTO_CLOCK_OUT_ENABLED=true` in .env
- Check cron job is running: check logs at 11 PM
- Verify users have schedule assignments

## Files Modified/Created

### Created:
1. `src/modules/attendance/dto/fetch-attendance-events.dto.ts`
2. `src/modules/attendance/services/hc-attendance-fetch.service.ts`
3. `IMPLEMENTATION_SUMMARY.md`

### Modified:
1. `src/modules/users/entities/user.entity.ts`
2. `src/modules/hc/config/hc-api.config.ts`
3. `src/modules/hc/interfaces/hc-api.interface.ts`
4. `src/modules/hc/hc.service.ts`
5. `src/modules/attendance/attendance.module.ts`
6. `src/modules/attendance/controllers/attendance-events.controller.ts`
7. `src/modules/attendance/cron/attendance-cron.service.ts`

## Completion Checklist

- [x] Add `last_event_type` and `last_event_date` fields to User entity
- [x] Add HC certificate records API endpoint
- [x] Create DTOs for request/response
- [x] Implement HC attendance fetch service
- [x] Add API endpoint in controller
- [x] Implement automatic clock-out cron job
- [x] Update attendance module
- [ ] Create database migration
- [ ] Run migration on database
- [ ] Test endpoint with real data
- [ ] Update API documentation
- [ ] Deploy to staging environment

## Next Steps

1. **Create and Run Database Migration**:
   ```bash
   npm run migration:generate -- -n AddLastEventFieldsToUser
   npm run migration:run
   ```

2. **Test the Implementation**:
   - Test with HC system
   - Verify event processing
   - Check automatic clock-out

3. **Update Documentation**:
   - Add to API documentation
   - Update user guides

4. **Monitor in Production**:
   - Watch logs for errors
   - Monitor database performance
   - Track user feedback