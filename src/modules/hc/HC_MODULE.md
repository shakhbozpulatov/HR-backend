# HC (HC Cabinet) Module Documentation

## Umumiy Ma'lumot
HC Module - bu HC Cabinet (Hikvision Control) bilan integratsiya qilish uchun yaratilgan modul. HC Cabinet biometrik davomat tizimi bo'lib, yuz tanish, barmoq izi va RFID orqali xodimlarning kirib-chiqishini kuzatadi. Bu modul SOLID prinsiplariga asoslangan va barcha HC API operatsiyalarini boshqaradi.

## Arxitektura

### Module Tuzilmasi
```
hc/
├── dto/
│   └── hc-user.dto.ts              # HC API uchun DTOs
├── services/
│   ├── hc-api-client.service.ts    # HTTP client wrapper
│   └── hc-auth.service.ts          # Authentication service
├── config/
│   └── hc-api.config.ts            # API konfiguratsiya
├── utils/
│   └── hc-date.util.ts             # Sana formatlash
├── interfaces/
│   └── hc-api.interface.ts         # TypeScript interfeyslari
├── hc.service.ts                   # Asosiy HC service
├── hc.controller.ts                # HTTP controller (if needed)
└── hc.module.ts                    # Module konfiguratsiyasi
```

## SOLID Printsiplari

### 1. Single Responsibility Principle
Har bir service o'zining bitta vazifasiga ega:
- **HcService**: Business logic, HC operatsiyalari
- **HcApiClient**: HTTP requests, error handling
- **HcAuthService**: Authentication, token management
- **HcApiConfig**: Configuration management

### 2. Dependency Inversion
```typescript
constructor(
  private readonly apiClient: HcApiClient,
  private readonly config: HcApiConfig,
) {}
```

### 3. Open/Closed Principle
Yangi HC API methodlarini qo'shish oson, mavjud kodni o'zgartirmasdan.

## HcService - Asosiy Funksiyalar

### 1. Create User on HC Cabinet
**Method**: `createUserOnCabinet(dto: CreateHCUserDto)`

**Kirish ma'lumotlari**:
```typescript
{
  groupId: string,           // HC group ID (default: '1')
  personCode: string,        // Unique person code
  firstName: string,
  lastName: string,
  gender: 'MALE' | 'FEMALE',
  startDate: Date,
  phone?: string,            // Optional
  endDate?: Date             // Optional
}
```

**Jarayon**:
1. Ma'lumotlarni HC formatga o'tkazish (date formatting)
2. Optional fieldlarni tekshirish (HC null qabul qilmaydi)
3. HC API'ga POST request
4. Response parsing va validation
5. HC Person ID qaytarish

**Response**:
```typescript
{
  errorCode: 0,
  errorMsg: 'success',
  data: {
    personId: 'HC-PERSON-ID-123',
    personInfo: { ... }
  }
}
```

### 2. Update User on HC Cabinet
**Method**: `updateUserOnCabinet(personId: string, updateData: Partial<CreateHCUserDto>)`

**Xususiyatlari**:
- Faqat o'zgargan fieldlarni yuborish
- HC API barcha required fieldlarni talab qiladi
- Date formatting avtomatik

**Use case**: User local DB'da yangilanganda HC'ni ham yangilash

### 3. Get User from HC Cabinet
**Method**: `getUserFromCabinet(personId: string)`

**Response**:
```typescript
{
  data: {
    personInfo: {
      personId: string,
      personCode: string,
      firstName: string,
      lastName: string,
      gender: string,
      phone?: string,
      startDate: string,
      endDate?: string,
      groupId: string
    }
  }
}
```

**Use case**: User ma'lumotlarini HC'dan olish (sync check)

### 4. Delete User from HC Cabinet
**Method**: `deleteUserFromCabinet(personId: string)`

**Eslatma**:
- Hard delete emas
- User endDate hozirgi vaqtga o'rnatiladi
- Soft delete (inactive)

### 5. Bind User with Terminal
**Method**: `bindUserWithTerminal(personId: string, accessLevelIdList: string[])`

**Kirish ma'lumotlari**:
```typescript
{
  personList: [
    {
      personId: 'HC-PERSON-ID',
      accessLevelIdList: ['access-123', 'access-456']
    }
  ]
}
```

**Use case**: Foydalanuvchini bir yoki bir nechta terminallarga bog'lash

**Access Level**: Terminal'ga kirish ruxsati identifikatori

### 6. Unbind User from Terminal
**Method**: `unbindUserFromTerminal({ personId, terminalId })`

**Use case**: Foydalanuvchini terminaldan ajratish

### 7. Upload User Photo
**Method**: `uploadUserPhoto(personId: string, photoData: string)`

**Xususiyatlari**:
- Photo base64 formatda
- Maksimal hajm: 5MB
- Formatlar: JPG, JPEG, PNG
- Face recognition uchun ishlatiladi

**Kirish ma'lumotlari**:
```typescript
{
  personId: 'HC-PERSON-ID',
  photoData: 'base64-encoded-image-data'
}
```

### 8. Subscribe to Events (MQ)
**Method**: `subscribeEvent(subscribeType: number)`

**Subscribe Types**:
- 1: Attendance events
- 2: Access control events
- 3: Alarm events

**Use case**: Real-time attendance eventlarini olish

### 9. Get All Events
**Method**: `getAllEvents(maxNumberPerTime: number)`

**Parameters**:
- `maxNumberPerTime`: Bir vaqtda nechta event olish (max 1000)

**Response**:
```typescript
{
  data: {
    batchId: string,
    events: [
      {
        personId: string,
        eventTime: string,
        deviceId: string,
        eventType: number
      }
    ]
  }
}
```

### 10. Complete Event Batch
**Method**: `completeEvent(batchId: string)`

**Use case**: Eventlar qayta ishlanganidan keyin batch'ni complete qilish

### 11. Register Device on HC Cabinet
**Method**: `registerDeviceOnCabinet(deviceData: HcDeviceRegistrationData)`

**Kirish ma'lumotlari**:
```typescript
{
  deviceName: string,        // Device nomi
  deviceType?: number,       // Device turi (optional)
  ipAddress?: string,        // IP manzil (optional)
  port?: number,            // Port raqami (optional)
  serialNumber?: string,     // Seriya raqami (optional)
  locationId?: string        // Joylashuv ID (optional)
}
```

**Response**:
```typescript
{
  errorCode: 0,
  message: 'success',
  data: {
    deviceId: 'HC-DEVICE-ID-123',
    deviceName: 'Main Entrance Terminal',
    status: 1
  }
}
```

**Use case**: Yangi terminal HC Cabinet'da ro'yxatdan o'tkazish

### 12. Get Device from HC Cabinet
**Method**: `getDeviceFromCabinet(deviceId: string)`

**Response**: Device ma'lumotlari

**Use case**: HC Cabinet'dan device ma'lumotlarini olish

### 13. List Devices from HC Cabinet
**Method**: `listDevicesFromCabinet(pageIndex: number, pageSize: number)`

**Parameters**:
- `pageIndex`: Sahifa raqami (0-based)
- `pageSize`: Har sahifada nechta device (max 1000)

**Response**:
```typescript
{
  data: {
    totalNum: number,
    pageIndex: number,
    pageSize: number,
    deviceList: [
      {
        deviceId: string,
        deviceName: string,
        deviceType: number,
        ipAddress: string,
        port: number,
        serialNumber: string,
        status: number
      }
    ]
  }
}
```

**Use case**: Barcha HC devices ro'yxatini olish

### 14. Update Device on HC Cabinet
**Method**: `updateDeviceOnCabinet(deviceId: string, updateData: Partial<HcDeviceData>)`

**Use case**: Device ma'lumotlarini yangilash

### 15. Delete Device from HC Cabinet
**Method**: `deleteDeviceFromCabinet(deviceId: string)`

**Use case**: Device'ni HC Cabinet'dan o'chirish

### 16. Get Device Status
**Method**: `getDeviceStatus(deviceId: string)`

**Response**:
```typescript
{
  data: {
    deviceId: string,
    status: number  // 0 = offline, 1 = online, 2 = maintenance
  }
}
```

**Use case**: Device'ning real-time status holatini olish

### 17. Search Certificate Records (Attendance)
**Method**: `searchCertificateRecords(request: HcCertificateRecordSearchRequest)`

**Kirish ma'lumotlari**:
```typescript
{
  pageIndex: number,        // Sahifa raqami (0-based)
  pageSize: number,         // Har sahifada nechta (max 1000)
  searchCreteria: {
    beginTime: string,      // "2024-11-01 00:00:00"
    endTime: string,        // "2024-11-30 23:59:59"
    personIdList?: string[] // Optional: Filter by persons
  }
}
```

**Response**:
```typescript
{
  data: {
    total: number,
    list: [
      {
        personId: string,
        personCode: string,
        firstName: string,
        lastName: string,
        certTime: string,
        deviceName: string,
        eventType: number
      }
    ]
  }
}
```

**Use case**: Davomat ma'lumotlarini olish va attendance records yaratish

## HcApiClient Service

### HTTP Request Wrapper
```typescript
async post<T>({
  endpoint,
  data
}: HcApiRequest): Promise<HcApiResponse<T>>
```

**Xususiyatlari**:
- Avtomatik authentication
- Error handling
- Request/Response logging
- Avtomatik token refresh va retry mechanism

### Automatic Token Refresh Mechanism

**TOKEN_NOT_FOUND (OPEN000006) Error Handling**:

HcApiClient response interceptor avtomatik ravishda token muddati tugagan xatolarni aniqlaydi va qayta ishlaydi:

```typescript
// Response interceptor
if (responseData.errorCode === 'OPEN000006' &&
    responseData.message?.includes('TOKEN_NOT_FOUND')) {
  // 1. Refresh access token
  await this.authService.refreshToken();

  // 2. Get new token
  const accessToken = await this.authService.getAccessToken();

  // 3. Retry original request with new token
  return this.axiosInstance.request(config);
}
```

**Xususiyatlar**:
- Barcha HC API endpoints uchun avtomatik ishlaydi
- Failed request avtomatik retry qilinadi
- Infinite loop'dan himoya (max 1 retry attempt)
- Retry count tracking orqali boshqariladi
- Agar retry ham fail bo'lsa, `UNAUTHORIZED (401)` error qaytariladi

**Error Flow**:
```
Request → HC API → Error (OPEN000006)
    ↓
Token Refresh (HcAuthService.refreshToken())
    ↓
Retry Request with New Token
    ↓
Success ✅ or Fail (401) after max retries ❌
```

### Error Handling
```typescript
if (response.errorCode !== 0) {
  throw new HcApiException(
    response.errorMsg,
    response.errorCode
  );
}
```

## HcAuthService

### Authentication
HC Cabinet Digest Authentication ishlatadi:

```typescript
const auth = {
  username: appKey,
  password: secretKey,
  digestAuth: true
}
```

### Token Management
- Token avtomatik yangilanadi
- Session management
- Concurrent request handling

## HcApiConfig

### Configuration
```typescript
{
  baseUrl: string,           // HC Cabinet API base URL
  appKey: string,            // Application key
  secretKey: string,         // Secret key
  timeout: number,           // Request timeout (default: 30s)
  retryAttempts: number      // Retry count (default: 3)
}
```

### Environment Variables
```env
HC_API_URL=http://192.168.1.100:8090
HC_APP_KEY=your-app-key
HC_SECRET_KEY=your-secret-key
HC_API_TIMEOUT=30000
HC_RETRY_ATTEMPTS=3
```

### Validation
```typescript
validate() {
  if (!this.baseUrl || !this.appKey || !this.secretKey) {
    throw new Error('HC API configuration is incomplete');
  }
}
```

## HcDateFormatter Utility

### Date Format Conversion
HC Cabinet specific date formatini ishlatadi: `YYYY-MM-DD`

```typescript
class HcDateFormatter {
  static toHcFormat(date: Date): string {
    return moment(date).format('YYYY-MM-DD');
  }

  static fromHcFormat(dateStr: string): Date {
    return moment(dateStr, 'YYYY-MM-DD').toDate();
  }
}
```

## API Endpoints

### Person Management
```typescript
endpoints.person = {
  add: '/person/add',
  update: '/person/update',
  get: '/person/get',
  delete: '/person/delete',
  'upload-photo': '/person/uploadPhoto'
}
```

### Terminal Management
```typescript
endpoints.terminal = {
  bind: '/terminal/bindPerson',
  unbind: '/terminal/unbindPerson'
}
```

### Event Queue (MQ)
```typescript
endpoints.mq = {
  subscribe: '/mq/subscribe',
  messages: '/mq/messages',
  complete: '/mq/complete'
}
```

### Access Control System (ACS)
```typescript
endpoints.acs = {
  certificateRecords: '/acs/certificateRecords'
}
```

### Device Management
```typescript
endpoints.device = {
  add: '/device/v1/devices/add',
  update: '/device/v1/devices/update',
  delete: '/device/v1/devices/delete',
  get: '/device/v1/devices/get',
  list: '/device/v1/devices/list',
  status: '/device/v1/devices/status'
}
```

## Error Handling

### HC API Error Codes
```typescript
const HC_ERROR_CODES = {
  0: 'Success',
  1: 'Invalid parameters',
  2: 'Person not found',
  3: 'Duplicate person code',
  4: 'Database error',
  5: 'Photo upload failed',
  'OPEN000006': 'TOKEN_NOT_FOUND - Token muddati tugagan yoki noto\'g\'ri',
  // ... more error codes
}
```

### Automatic Error Recovery (OPEN000006)

`OPEN000006` (TOKEN_NOT_FOUND) xatoligi uchun avtomatik recovery mexanizmi mavjud:

1. **Detection**: Response interceptor xatolikni aniqlaydi
2. **Token Refresh**: `HcAuthService.refreshToken()` chaqiriladi
3. **Retry**: Failed request avtomatik qayta yuboriladi
4. **Fallback**: Agar retry ham fail bo'lsa, `UNAUTHORIZED (401)` error qaytariladi

**Qo'shimcha sozlamalar**:
- `MAX_TOKEN_RETRY_ATTEMPTS = 1` - Faqat 1 marta retry qilinadi
- Retry counter `_retryCount` orqali kuzatiladi
- Infinite loop xavfi yo'q

### Error Response
```typescript
{
  errorCode: number,
  errorMsg: string,
  data?: any
}
```

### Exception Handling
```typescript
try {
  await hcService.createUserOnCabinet(userData);
} catch (error) {
  if (error instanceof HcApiException) {
    console.error(`HC Error [${error.code}]: ${error.message}`);
    // Handle specific error
  }
}
```

## Integration Patterns

### 1. User Creation Flow
```typescript
// 1. Create user in HC Cabinet first
const hcResponse = await hcService.createUserOnCabinet(hcData);

// 2. If success, save to local DB
const user = await userRepository.save({
  ...userData,
  hcPersonId: hcResponse.data.personId,
  status: UserStatus.SYNCED
});

// 3. Upload photo (background queue)
await photoUploadService.queuePhotoUpload({
  userId: user.id,
  hcPersonId: user.hcPersonId,
  photoData: photoBuffer
});

// 4. Bind to terminals (if needed)
if (accessLevelIds.length > 0) {
  await hcService.bindUserWithTerminal(
    user.hcPersonId,
    accessLevelIds
  );
}
```

### 2. User Update Flow
```typescript
// 1. Get current HC data
const hcUser = await hcService.getUserFromCabinet(hcPersonId);

// 2. Prepare update (all required fields)
const updateData = {
  ...hcUser.data.personInfo,
  firstName: newFirstName,
  phone: newPhone
};

// 3. Update HC Cabinet
await hcService.updateUserOnCabinet(hcPersonId, updateData);

// 4. Update local DB
await userRepository.update(userId, updateData);
```

### 3. Attendance Sync Flow
```typescript
// 1. Subscribe to events
await hcService.subscribeEvent(1); // Attendance events

// 2. Fetch events periodically (cron job)
setInterval(async () => {
  const events = await hcService.getAllEvents(1000);

  // 3. Process each event
  for (const event of events.data.events) {
    await processAttendanceEvent(event);
  }

  // 4. Mark batch as complete
  await hcService.completeEvent(events.data.batchId);
}, 60000); // Every minute
```

## Best Practices

### 1. Error Recovery
```typescript
// Retry mechanism for transient errors
async function createUserWithRetry(userData, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await hcService.createUserOnCabinet(userData);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(2000 * (i + 1)); // Exponential backoff
    }
  }
}
```

### 2. Data Validation
```typescript
// Validate before sending to HC
if (!userData.phone) {
  delete userData.phone; // HC doesn't accept null/undefined
}
```

### 3. Logging
```typescript
console.log('👤 Creating user on HC Cabinet:', {
  personCode: dto.personCode,
  firstName: dto.firstName,
  hasPhone: !!dto.phone
});
```

### 4. Sync Status Tracking
```typescript
enum UserStatus {
  PENDING = 'PENDING',           // HC sync pending
  SYNCED = 'SYNCED',             // Successfully synced
  FAILED_SYNC = 'FAILED_SYNC',   // Sync failed
  INACTIVE = 'INACTIVE'          // User deleted
}
```

## Testing

### Mock HC Service
```typescript
const mockHcService = {
  createUserOnCabinet: jest.fn().mockResolvedValue({
    errorCode: 0,
    data: { personId: 'MOCK-PERSON-ID' }
  })
};
```

### Integration Tests
- Create user on HC
- Update user on HC
- Upload photo
- Bind/unbind terminal
- Fetch attendance records

## Performance Optimization

### 1. Batch Operations
- Bir nechta userlarni batch'da yaratish
- Bulk photo upload

### 2. Caching
- Person ID mapping cache
- Terminal access level cache

### 3. Async Processing
- Photo upload queue
- Event processing queue

## Future Enhancements

1. **Webhook Support**: Real-time event notifications
2. **Batch User Sync**: Ko'p userlarni bir vaqtda sync qilish
3. **Health Check**: HC Cabinet availability monitoring
4. **Failover**: Alternative HC server support
5. **Advanced Analytics**: HC data analytics
6. **Mobile Integration**: HC mobile SDK
7. **Face Template Management**: Advanced biometric features

## Dependencies

### External
- axios: HTTP client
- moment: Date formatting
- @nestjs/common: NestJS core

### Internal
- User module (integration)
- Auth module (integration)
- Terminals module (integration)