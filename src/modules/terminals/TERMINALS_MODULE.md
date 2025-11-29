# Terminals Module Documentation

## Umumiy Ma'lumot
Terminals moduli davomat terminallarini (biometrik qurilmalar) boshqarish uchun mas'ul. Bu modul HC Cabinet bilan integratsiya qilingan bo'lib, terminallarning holatini kuzatish va boshqarish imkonini beradi.

## Arxitektura

### Module Tuzilmasi
```
terminals/
├── dto/
│   ├── create-terminal.dto.ts       # Terminal yaratish
│   └── update-terminal-status.dto.ts # Terminal holati yangilash
├── entities/
│   └── terminal-device.entity.ts    # Terminal database entity
├── services/
│   └── terminal-hc-integration.service.ts  # HC Cabinet integratsiya
├── terminals.controller.ts          # HTTP controller
├── terminals.service.ts             # Terminal CRUD operatsiyalari
└── terminals.module.ts              # Module konfiguratsiyasi
```

## Terminal Device Entity

### Maydonlar
```typescript
{
  id: string (UUID)                    // Asosiy identifikator
  company_id: string                   // Kompaniya ID (Foreign Key)

  // Terminal ma'lumotlari
  device_id: string (unique)           // HC Cabinet device ID
  name: string                         // Terminal nomi
  location?: string                    // Joylashuv
  model?: string                       // Qurilma modeli
  serial_number?: string               // Seriya raqami
  ip_address?: string                  // IP manzil

  // Status
  status: DeviceStatus                 // ONLINE, OFFLINE, ERROR, MAINTENANCE
  last_seen_at?: Date                  // Oxirgi faollik vaqti
  active: boolean                      // Faollik holati

  // HC Integration
  hc_device_id?: string                // HC Cabinet device ID (unique)
  hc_access_level_id?: string          // HC Cabinet access level ID
  serial_number?: string               // Device serial number
  ip_address?: string                  // Device IP address
  port?: number                        // Device port
  is_hc_synced: boolean                // HC sync status (default: false)

  // Metadata (JSONB)
  metadata?: {
    firmware_version?: string          // Firmware versiyasi
    battery_level?: number             // Batareya darajasi
    connection_type?: string           // Ulanish turi (WiFi, Ethernet)
    features?: string[]                // Qo'shimcha funksiyalar
  }

  // Timestamps
  created_at: Date
  updated_at: Date

  // Relations
  company: Company                     // Bog'langan kompaniya
}
```

### DeviceStatus Enum
```typescript
enum DeviceStatus {
  ONLINE = 'ONLINE',           // Faol va ishlayapti
  OFFLINE = 'OFFLINE',         // Offline
  ERROR = 'ERROR',             // Xatolik holati
  MAINTENANCE = 'MAINTENANCE'  // Texnik xizmat ko'rsatilmoqda
}
```

## Asosiy Funksiyonallik

### 1. Find All Terminals
**Endpoint**: `GET /terminals?companyId=uuid`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Query Parametrlari**:
- `companyId`: Company ID (optional, SUPER_ADMIN uchun)

**Xususiyatlari**:
- SUPER_ADMIN: Barcha terminallar yoki companyId bo'yicha filter
- Boshqa rollar: Faqat o'z kompaniyasining terminallari
- Nomi bo'yicha tartiblangan (ASC)

**Javob**:
```json
{
  "data": [
    {
      "id": "terminal-uuid",
      "device_id": "HC-DEVICE-123",
      "name": "Main Entrance Terminal",
      "location": "Building A, Floor 1",
      "status": "ONLINE",
      "last_seen_at": "2024-11-29T10:30:00Z",
      "active": true
    }
  ]
}
```

### 2. Find One Terminal
**Endpoint**: `GET /terminals/:id`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Company Isolation**:
- SUPER_ADMIN: Barcha terminallarni ko'radi
- Boshqa rollar: Faqat o'z kompaniyasining terminalini ko'radi

**Javob**:
```json
{
  "id": "terminal-uuid",
  "device_id": "HC-DEVICE-123",
  "name": "Main Entrance Terminal",
  "location": "Building A, Floor 1",
  "model": "HC F16",
  "serial_number": "SN123456",
  "ip_address": "192.168.1.100",
  "status": "ONLINE",
  "last_seen_at": "2024-11-29T10:30:00Z",
  "hc_access_level_id": "access-123",
  "metadata": {
    "firmware_version": "v2.1.3",
    "battery_level": 85,
    "connection_type": "Ethernet",
    "features": ["face_recognition", "fingerprint", "rfid"]
  }
}
```

### 3. Create Terminal
**Endpoint**: `POST /terminals`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Kirish ma'lumotlari**:
```json
{
  "name": "Back Entrance Terminal",
  "location": "Building B, Floor 1",
  "vendor": "HC Cabinet",
  "serial_number": "SN789012",
  "ip_address": "192.168.1.101",
  "port": 8090,
  "hc_access_level_id": "access-456",
  "register_on_hc": true
}
```

**Jarayon**:
1. Terminal ma'lumotlari validatsiya qilinadi
2. Agar `register_on_hc: true` bo'lsa:
   - Terminal HC Cabinet'da ro'yxatdan o'tkaziladi
   - HC'dan device_id olinadi
   - `is_hc_synced: true` qilib belgilanadi
3. Company ID avtomatik qo'shiladi (user'ning company_id'si)
4. Status default OFFLINE qilib o'rnatiladi
5. Terminal local DB'ga saqlanadi

**Response**:
```json
{
  "id": "local-terminal-uuid",
  "name": "Back Entrance Terminal",
  "hc_device_id": "HC-DEVICE-123",
  "is_hc_synced": true,
  "status": "OFFLINE"
}
```

### 4. Update Terminal Status
**Endpoint**: `PATCH /terminals/:id/status`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Status yangilash**:
```json
{
  "status": "ONLINE"
}
```

**Jarayon**:
1. Terminal topiladi va company isolation tekshiriladi
2. Status yangilanadi
3. `last_seen_at` hozirgi vaqtga o'rnatiladi
4. Yangilangan terminal qaytariladi

### 5. Get Online Devices
**Endpoint**: `GET /terminals/status/online`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Xususiyatlari**:
- Faqat ONLINE statusdagi terminallar
- Barcha kompaniyalar uchun (SUPER_ADMIN)

### 6. Get Offline Devices
**Endpoint**: `GET /terminals/status/offline`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Xususiyatlari**:
- Faqat OFFLINE statusdagi terminallar
- Monitoring va alerting uchun

### 7. Sync Terminal Status with HC
**Endpoint**: `POST /terminals/:id/sync-status`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Jarayon**:
1. Terminal HC Cabinet'da ro'yxatdan o'tganligini tekshiradi
2. HC Cabinet'dan device status olinadi
3. Local status yangilanadi (HC status'ga asoslangan)
4. `last_seen_at` joriy vaqtga o'rnatiladi

**HC Status Mapping**:
- HC status 1 → ONLINE
- HC status 2 → MAINTENANCE
- HC status 0 → OFFLINE

**Response**:
```json
{
  "id": "terminal-uuid",
  "status": "ONLINE",
  "last_seen_at": "2024-11-30T10:30:00Z",
  "is_hc_synced": true
}
```

### 8. Unbind Terminal from HC
**Endpoint**: `POST /terminals/:id/unbind-hc`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Jarayon**:
1. HC Cabinet'dan device o'chiriladi
2. Local terminal'da `hc_device_id` null qilinadi
3. `is_hc_synced: false` qilib belgilanadi

**Use case**: Terminal HC'dan ajratish, faqat local DB'da qoldirish

**Response**:
```json
{
  "id": "terminal-uuid",
  "hc_device_id": null,
  "is_hc_synced": false
}
```

### 9. Sync All Terminals with HC
**Endpoint**: `POST /terminals/sync-all`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Jarayon**:
1. Barcha HC'ga bog'langan terminallar topiladi
2. Har biri uchun status sync qilinadi
3. Xatolik yuz bergan terminallar ignore qilinadi

**Use case**: Scheduled job orqali barcha terminallarni sync qilish

**Response**:
```json
{
  "synced_count": 15,
  "terminals": [ /* array of synced terminals */ ]
}
```

### 10. List HC Devices
**Endpoint**: `GET /terminals/hc-devices?pageIndex=0&pageSize=100`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Query Parameters**:
- `pageIndex`: Sahifa raqami (default: 0)
- `pageSize`: Har sahifada nechta (default: 100)

**Jarayon**:
HC Cabinet'dan barcha devices ro'yxatini oladi

**Response**:
```json
{
  "totalNum": 25,
  "pageIndex": 0,
  "pageSize": 100,
  "deviceList": [
    {
      "deviceId": "HC-DEVICE-123",
      "deviceName": "Main Entrance",
      "ipAddress": "192.168.1.100",
      "status": 1,
      "serialNumber": "SN123456"
    }
  ]
}
```

**Use case**: HC Cabinet'dagi mavjud devicelarni ko'rish, import qilish

## HC Cabinet Integratsiya

### Terminal HC Integration Service

**Location**: `src/modules/terminals/services/terminal-hc-integration.service.ts`

Bu service HC Cabinet bilan terminallarni integratsiya qilish uchun mo'ljallangan. SOLID prinsiplariga asoslangan:
- **Single Responsibility**: Faqat terminal-HC integratsiya logikasi
- **Dependency Inversion**: HcService va Repository abstraktsiyalariga bog'liq

**Asosiy metodlar**:

#### 1. registerTerminalWithHC(dto, companyId)
Terminal HC Cabinet'da ro'yxatdan o'tkazish va local DB'ga saqlash

**Flow**:
1. IP address validatsiya (HC registration uchun zarur)
2. HC Cabinet API'ga device registration request
3. HC'dan device_id olinadi
4. Local DB'ga terminal saqlanadi (`is_hc_synced: true`)

**Error Handling**:
- HC registration muvaffaqiyatsiz bo'lsa exception
- Device ID olmasa exception

#### 2. syncTerminalStatusWithHC(terminalId)
Terminal statusini HC Cabinet bilan sinxronlash

**Flow**:
1. Terminal topiladi va HC registration tekshiriladi
2. HC'dan device status olinadi
3. HC status local status'ga map qilinadi
4. Local DB yangilanadi

**Status Mapping**:
```typescript
HC Status 1 → DeviceStatus.ONLINE
HC Status 2 → DeviceStatus.MAINTENANCE
HC Status 0 → DeviceStatus.OFFLINE
```

#### 3. unbindTerminalFromHC(terminalId)
Terminal HC Cabinet'dan ajratish

**Flow**:
1. HC Cabinet'dan device delete
2. Local terminal'da HC fieldlar tozalanadi

#### 4. syncAllTerminalsWithHC(companyId?)
Barcha HC'ga bog'langan terminallarni sync qilish

**Use case**: Cron job, scheduled sync

#### 5. listHCDevices(pageIndex, pageSize)
HC Cabinet'dagi barcha devicelar ro'yxati

**Use case**: Import existing devices from HC

### Access Level Management

Access Level - bu terminalga kirish huquqlarini belgilovchi identifikator.

**Misol**:
```typescript
// Foydalanuvchini terminalga bog'lash
await hcService.bindUserWithTerminal(
  hcPersonId,
  ['access-level-123', 'access-level-456']
);
```

### Terminal Registration Flow

**Yangi terminal qo'shish (HC bilan)**:
```typescript
// 1. Terminal yaratish request
POST /terminals
{
  "name": "Main Entrance",
  "ip_address": "192.168.1.100",
  "port": 8090,
  "serial_number": "SN123456",
  "register_on_hc": true  // HC'da ro'yxatdan o'tkazish
}

// 2. Backend flow:
// - TerminalsService.create() chaqiriladi
// - register_on_hc: true bo'lgani uchun
// - TerminalHcIntegrationService.registerTerminalWithHC() chaqiriladi
// - HC Cabinet'ga POST /device/v1/devices/add
// - HC'dan device_id qaytadi
// - Local DB'ga terminal saqlanadi (hc_device_id bilan)

// 3. Response:
{
  "id": "local-uuid",
  "name": "Main Entrance",
  "hc_device_id": "HC-DEVICE-123",
  "is_hc_synced": true,
  "status": "OFFLINE"
}
```

### Device Enrollment

**User Enrollment jarayoni**:
1. User HC Cabinet'da yaratiladi (HcService.createUserOnCabinet)
2. Access level ID list beriladi
3. HC Service orqali user terminallarga bog'lanadi (bindUserWithTerminal)
4. Biometrik ma'lumotlar terminaldan olinadi

## Status Monitoring

### Status Types

| Status      | Description                          | Action Required |
|-------------|--------------------------------------|-----------------|
| ONLINE      | Terminal ishlayapti                  | Yo'q            |
| OFFLINE     | Terminal ulanmagan                   | Tekshirish      |
| ERROR       | Xatolik yuz bergan                   | Troubleshooting |
| MAINTENANCE | Texnik xizmat ko'rsatilmoqda         | Kutish          |

### Last Seen Tracking
- Har bir status update'da `last_seen_at` yangilanadi
- OFFLINE detection: last_seen_at > 5 daqiqa
- Monitoring dashboard uchun ishlatiladi

### Health Check
```typescript
// Pseudo-code
if (now - last_seen_at > 5 minutes) {
  status = OFFLINE;
  sendAlert('Terminal offline: ' + terminal.name);
}
```

## Company Isolation

### Access Control
- Faqat o'z kompaniyasining terminallarini ko'rish
- SUPER_ADMIN: Barcha kompaniyalar
- Company-specific operations

### Implementation
```typescript
async findAll(companyId?: string): Promise<TerminalDevice[]> {
  const where = companyId ? { company_id: companyId } : {};
  return await this.deviceRepository.find({ where });
}
```

## Metadata Management

### Terminal Metadata
```typescript
interface TerminalMetadata {
  firmware_version?: string;    // Firmware versiyasi
  battery_level?: number;       // Batareya foizi (0-100)
  connection_type?: string;     // WiFi, Ethernet, 4G
  features?: string[];          // Qo'shimcha xususiyatlar
  last_sync?: string;           // Oxirgi sinxronizatsiya
  error_count?: number;         // Xatolar soni
}
```

### Feature Flags
```typescript
features: [
  'face_recognition',   // Yuz tanish
  'fingerprint',        // Barmoq izi
  'rfid',              // RFID karta
  'qr_code',           // QR kod
  'temperature',       // Harorat o'lchash
  'mask_detection'     // Niqob deteksiyasi
]
```

## Best Practices

### 1. Device ID Uniqueness
- HC Cabinet device_id unique bo'lishi kerak
- Database'da unique constraint

### 2. Regular Status Updates
- Terminal heartbeat (5 daqiqa interval)
- Auto-offline detection
- Alert notifications

### 3. Security
- IP whitelist
- Secure communication (HTTPS)
- Access level restrictions

### 4. Monitoring
- Terminal uptime tracking
- Error logging
- Performance metrics

### 5. Maintenance Mode
- Scheduled maintenance
- User notifications
- Automatic status restore

## Error Handling

### NotFoundException
```typescript
throw new NotFoundException('Terminal device not found');
```

### Connection Errors
- Retry mechanism
- Fallback strategies
- Error logging

## Relations

### Terminal Relations
- **Company**: Many-to-One
- **AttendanceEvents**: One-to-Many (indirectly through HC)

## Integration Best Practices

### 1. Terminal Registration
```typescript
// ✅ GOOD: HC bilan registration
const terminal = await terminalsService.create({
  name: 'Main Entrance',
  ip_address: '192.168.1.100',
  register_on_hc: true  // HC'da avtomatik ro'yxatdan o'tadi
}, companyId);

// ❌ BAD: HC'siz local-only terminal (attendance ishlamaydi)
const terminal = await terminalsService.create({
  name: 'Side Door',
  register_on_hc: false  // HC'da ro'yxatdan o'tmaydi
}, companyId);
```

### 2. Status Sync Strategy
```typescript
// Scheduled job - har 5 daqiqada barcha terminallar sync
@Cron('*/5 * * * *')
async syncAllTerminals() {
  await hcIntegrationService.syncAllTerminalsWithHC();
}

// Manual sync - muayyan terminal uchun
await hcIntegrationService.syncTerminalStatusWithHC(terminalId);
```

### 3. Error Handling
```typescript
try {
  await hcIntegrationService.registerTerminalWithHC(dto, companyId);
} catch (error) {
  if (error.message.includes('HC Cabinet')) {
    // HC error - local DB'ga saqla, keyinroq retry
    logger.warn('HC registration failed, saving locally');
  }
  throw error;
}
```

### 4. Company Isolation
- Har doim `company_id` orqali filter qilish
- SUPER_ADMIN: barcha terminallar
- Boshqa rollar: faqat o'z kompaniyasi

## Future Enhancements

1. **Device Groups**: Terminallarni guruhlash
2. **Remote Configuration**: Masofadan sozlash
3. **Firmware Updates**: OTA firmware yangilanish
4. **Analytics**: Terminal usage analytics
5. **Multi-location Support**: Bir nechta joylashuv
6. **Device Health Metrics**: Batafsil health monitoring
7. **Automated Alerts**: Smart alerting system
8. **Backup Terminals**: Failover mechanism
9. **Bulk Import**: HC'dan ko'p terminallarni import qilish
10. **Auto-Discovery**: Network'dagi HC devicelarni avtomatik topish

## Testing Recommendations

### Unit Tests
- Create terminal with valid/invalid data
- Status updates
- Company isolation
- HC integration mocking

### Integration Tests
- Controller endpoints
- Database operations
- HC Cabinet API calls
- Status monitoring

## Dependencies

### Internal
- Company entity (relations)
- HcService (HC Cabinet operations)

### External
- TypeORM: Database operations
- @nestjs/common: NestJS core
- HC Cabinet API

## Environment Variables
```env
# HC Cabinet (from HC module)
HC_API_URL=http://hc-cabinet-api
HC_APP_KEY=your-app-key
HC_SECRET_KEY=your-secret-key
```