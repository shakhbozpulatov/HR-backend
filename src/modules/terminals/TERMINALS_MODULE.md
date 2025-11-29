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
├── terminals.controller.ts          # HTTP controller
├── terminals.service.ts             # Terminal CRUD operatsiyalari
├── terminal-integration.service.ts  # HC Cabinet integratsiya
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
  hc_access_level_id?: string          // HC Cabinet access level ID
  hc_group_id?: string                 // HC Cabinet group ID

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
  "device_id": "HC-DEVICE-456",
  "name": "Back Entrance Terminal",
  "location": "Building B, Floor 1",
  "model": "HC F16",
  "serial_number": "SN789012",
  "ip_address": "192.168.1.101",
  "hc_access_level_id": "access-456"
}
```

**Jarayon**:
1. Terminal ma'lumotlari validatsiya qilinadi
2. Company ID avtomatik qo'shiladi (user'ning company_id'si)
3. Status default OFFLINE qilib o'rnatiladi
4. Terminal saqlanadi

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

## HC Cabinet Integratsiya

### Terminal Integration Service

Bu service HC Cabinet bilan terminallarni integratsiya qilish uchun ishlatiladi.

**Asosiy funksiyalar**:
1. **Device Registration**: HC Cabinet'da qurilma ro'yxatdan o'tkazish
2. **Access Level Binding**: Foydalanuvchilarni terminallarga bog'lash
3. **Status Sync**: Terminal holatlari sinxronizatsiyasi
4. **Event Processing**: Terminal eventlarini qayta ishlash

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

### Device Enrollment

**User Enrollment jarayoni**:
1. User HC Cabinet'da yaratiladi
2. Access level ID list beriladi
3. HC Service orqali user terminallarga bog'lanadi
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

## Future Enhancements

1. **Device Groups**: Terminallarni guruhlash
2. **Remote Configuration**: Masofadan sozlash
3. **Firmware Updates**: OTA firmware yangilanish
4. **Analytics**: Terminal usage analytics
5. **Multi-location Support**: Bir nechta joylashuv
6. **Device Health Metrics**: Batafsil health monitoring
7. **Automated Alerts**: Smart alerting system
8. **Backup Terminals**: Failover mechanism

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