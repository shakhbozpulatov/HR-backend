# Company Module Documentation

## Umumiy Ma'lumot
Company moduli tashkilotlar (kompaniyalar) va ularning bo'limlarini (departmentlar) boshqarish uchun mas'ul. Bu modul kompaniyalar yaratish, yangilash, statistika olish va subscription rejalarini boshqarish funksiyonalligini taqdim etadi.

## Arxitektura

### Module Tuzilmasi
```
company/
├── dto/
│   ├── create-company.dto.ts    # Kompaniya yaratish
│   └── update-company.dto.ts    # Kompaniya yangilash
├── entities/
│   ├── company.entity.ts        # Company database entity
│   └── department.entity.ts     # Department database entity
├── company.controller.ts        # HTTP controller
├── company.service.ts           # Business logic
└── company.module.ts            # Module konfiguratsiyasi
```

## Company Entity

### Maydonlar
```typescript
{
  id: string (UUID)                    // Asosiy identifikator
  code: string (unique, 6 chars)       // Kompaniya kodi (ABC123)
  name: string                         // Kompaniya nomi
  legal_name?: string                  // Yuridik nomi
  tax_id?: string (unique)             // Soliq ID (INN)

  // Aloqa ma'lumotlari
  email?: string                       // Email
  phone?: string                       // Telefon
  address?: string                     // Manzil
  city?: string                        // Shahar
  postal_code?: string                 // Pochta indeksi
  country?: string                     // Mamlakat

  // Subscription
  subscription_plan: SubscriptionPlan  // FREE, BASIC, PROFESSIONAL, ENTERPRISE
  subscription_start_date?: Date       // Obuna boshlangan sana
  subscription_end_date?: Date         // Obuna tugash sanasi
  max_employees: number                // Maksimal xodimlar soni

  // Status
  status: CompanyStatus                // ACTIVE, SUSPENDED, INACTIVE
  active: boolean                      // Faollik holati

  // Settings (JSONB)
  settings: {
    timezone: string                   // Asia/Tashkent
    currency: string                   // UZS
    date_format: string                // YYYY-MM-DD
    time_format: string                // 24h / 12h
    week_start: string                 // Monday
    fiscal_year_start: string          // 01-01
    default_language: string           // uz / ru / en
  }

  // Payroll Settings (JSONB)
  payroll_settings: {
    overtime_multiplier: number        // 1.5 (150%)
    grace_in_minutes: number           // 5 daqiqa (check-in uchun)
    grace_out_minutes: number          // 0 daqiqa (check-out uchun)
    rounding_minutes: number           // 5 daqiqaga yaxlitlash
    overtime_threshold_minutes: number // 15 daqiqa
  }

  // Timestamps
  created_at: Date
  updated_at: Date

  // Relations
  departments: Department[]            // Bog'langan bo'limlar
  users: User[]                        // Bog'langan xodimlar
}
```

### CompanyStatus Enum
```typescript
enum CompanyStatus {
  ACTIVE = 'ACTIVE',          // Faol
  SUSPENDED = 'SUSPENDED',    // To'xtatilgan
  INACTIVE = 'INACTIVE'       // Nofaol
}
```

### SubscriptionPlan Enum
```typescript
enum SubscriptionPlan {
  FREE = 'FREE',                     // Bepul (max 10 employees)
  BASIC = 'BASIC',                   // Asosiy (max 50 employees)
  PROFESSIONAL = 'PROFESSIONAL',     // Professional (max 200 employees)
  ENTERPRISE = 'ENTERPRISE'          // Korxona (max 9999 employees)
}
```

## Department Entity

### Maydonlar
```typescript
{
  id: string (UUID)                    // Asosiy identifikator
  company_id: string                   // Kompaniya ID (Foreign Key)
  code: string                         // Bo'lim kodi (IT, HR, FIN)
  name: string                         // Bo'lim nomi
  description?: string                 // Tavsif
  manager_id?: string                  // Menejer ID
  active: boolean                      // Faollik holati

  // Relations
  company: Company                     // Bog'langan kompaniya
  users: User[]                        // Bo'limdagi xodimlar
}
```

## Asosiy Funksiyonallik

### 1. Create Company
**Endpoint**: `POST /companies`
**Ruxsatlar**: SUPER_ADMIN

**Kirish ma'lumotlari**:
```json
{
  "name": "Tech Solutions LLC",
  "legal_name": "Tech Solutions Limited Liability Company",
  "tax_id": "123456789",
  "email": "info@techsolutions.com",
  "phone": "+998901234567",
  "address": "Tashkent, Uzbekistan",
  "city": "Tashkent",
  "timezone": "Asia/Tashkent",
  "currency": "UZS"
}
```

**Jarayon**:
1. Tax ID unikalligi tekshiriladi
2. Kompaniya yaratiladi va default settings bilan to'ldiriladi
3. Default departments yaratiladi (Administration, HR, IT, Finance, Operations)
4. Saved company qaytariladi

**Default Settings**:
```typescript
settings: {
  timezone: 'Asia/Tashkent',
  currency: 'UZS',
  date_format: 'YYYY-MM-DD',
  time_format: '24h',
  week_start: 'Monday',
  fiscal_year_start: '01-01',
  default_language: 'uz'
}

payroll_settings: {
  overtime_multiplier: 1.5,
  grace_in_minutes: 5,
  grace_out_minutes: 0,
  rounding_minutes: 5,
  overtime_threshold_minutes: 15
}
```

### 2. Find All Companies
**Endpoint**: `GET /companies?status=ACTIVE`
**Ruxsatlar**: SUPER_ADMIN

**Query Parametrlari**:
- `status`: CompanyStatus (optional filter)

**Xususiyatlari**:
- Kompaniyalar nomi bo'yicha tartiblangan (ASC)
- Departments bilan birga qaytariladi
- Status bo'yicha filter qilish

**Javob**:
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "ABC123",
      "name": "Tech Solutions LLC",
      "status": "ACTIVE",
      "subscription_plan": "FREE",
      "max_employees": 10,
      "departments": [
        {
          "id": "dept-uuid",
          "code": "IT",
          "name": "Information Technology",
          "active": true
        }
      ]
    }
  ]
}
```

### 3. Find One Company
**Endpoint**: `GET /companies/:id`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Relations**:
- Departments
- Users

**Javob**:
```json
{
  "id": "uuid",
  "code": "ABC123",
  "name": "Tech Solutions LLC",
  "legal_name": "Tech Solutions LLC",
  "status": "ACTIVE",
  "subscription_plan": "FREE",
  "max_employees": 10,
  "settings": {
    "timezone": "Asia/Tashkent",
    "currency": "UZS",
    "date_format": "YYYY-MM-DD"
  },
  "departments": [...],
  "users": [...]
}
```

### 4. Update Company
**Endpoint**: `PATCH /companies/:id`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER

**Yangilanishi mumkin bo'lgan maydonlar**:
- Kompaniya ma'lumotlari (name, legal_name, email, phone, address)
- Settings
- Payroll settings

**Update ma'lumotlari**:
```json
{
  "name": "Updated Company Name",
  "email": "new-email@company.com",
  "settings": {
    "timezone": "Asia/Samarkand",
    "currency": "USD"
  }
}
```

### 5. Update Status
**Endpoint**: `PATCH /companies/:id/status`
**Ruxsatlar**: SUPER_ADMIN

**Status o'zgartirish**:
```json
{
  "status": "SUSPENDED"
}
```

**Statuslar**:
- `ACTIVE`: Kompaniya faol, barcha operatsiyalar ishlaydi
- `SUSPENDED`: Kompaniya to'xtatilgan, userlar login qila olmaydi
- `INACTIVE`: Kompaniya nofaol

### 6. Update Subscription
**Endpoint**: `PATCH /companies/:id/subscription`
**Ruxsatlar**: SUPER_ADMIN

**Subscription yangilash**:
```json
{
  "plan": "PROFESSIONAL",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31"
}
```

**Plan bo'yicha employee limits**:
- FREE: 10 employees
- BASIC: 50 employees
- PROFESSIONAL: 200 employees
- ENTERPRISE: 9999 employees

### 7. Get Company Statistics
**Endpoint**: `GET /companies/:id/stats`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Statistika ma'lumotlari**:
```json
{
  "company": {
    "id": "uuid",
    "name": "Tech Solutions LLC",
    "status": "ACTIVE",
    "subscription_plan": "FREE",
    "max_employees": 10
  },
  "stats": {
    "total_users": 7,
    "active_users": 5,
    "total_departments": 5,
    "employees_remaining": 3
  }
}
```

## Department Operations

### 1. Create Department
**Endpoint**: `POST /companies/:companyId/departments`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Kirish ma'lumotlari**:
```json
{
  "code": "SALES",
  "name": "Sales Department",
  "description": "Sales and Marketing",
  "manager_id": "user-uuid"
}
```

### 2. Get Departments
**Endpoint**: `GET /companies/:companyId/departments`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN, HR_MANAGER

**Xususiyatlari**:
- Faqat active departments
- Users bilan birga
- Nomi bo'yicha tartiblangan

**Javob**:
```json
{
  "data": [
    {
      "id": "dept-uuid",
      "code": "IT",
      "name": "Information Technology",
      "active": true,
      "users": [
        {
          "id": "user-uuid",
          "first_name": "John",
          "last_name": "Doe",
          "position": "Developer"
        }
      ]
    }
  ]
}
```

### 3. Update Department
**Endpoint**: `PATCH /departments/:id`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Update ma'lumotlari**:
```json
{
  "name": "Updated Department Name",
  "manager_id": "new-manager-uuid"
}
```

### 4. Default Departments
Har bir yangi kompaniya yaratilganda avtomatik yaratiladi:
1. **ADMIN** - Administration
2. **HR** - Human Resources
3. **IT** - Information Technology
4. **FIN** - Finance
5. **OPS** - Operations

## Settings Management

### Company Settings
```typescript
interface CompanySettings {
  timezone: string;              // Vaqt zonasi
  currency: string;              // Valyuta
  date_format: string;           // Sana formati
  time_format: string;           // Vaqt formati (24h/12h)
  week_start: string;            // Hafta boshlanishi
  fiscal_year_start: string;     // Moliyaviy yil boshlanishi
  default_language: string;      // Default til
}
```

### Payroll Settings
```typescript
interface PayrollSettings {
  overtime_multiplier: number;         // Overtime koeffitsienti (1.5 = 150%)
  grace_in_minutes: number;            // Check-in uchun grace period
  grace_out_minutes: number;           // Check-out uchun grace period
  rounding_minutes: number;            // Vaqtni yaxlitlash (5 daqiqa)
  overtime_threshold_minutes: number;  // Overtime boshlanish chegarasi
}
```

## Company Code Generation

### Format
- 6 ta belgidan iborat
- Faqat harflar va raqamlar (A-Z, 0-9)
- Masalan: `ABC123`, `XYZ789`

### Uniqueness
- Database'da unique constraint
- Create'da avtomatik tekshiriladi
- Collision bo'lsa qayta generatsiya qilinadi

## Subscription Management

### Plan Limits

| Plan          | Max Employees | Features                          |
|---------------|---------------|-----------------------------------|
| FREE          | 10            | Basic features                    |
| BASIC         | 50            | Attendance, Schedules             |
| PROFESSIONAL  | 200           | Payroll, Analytics                |
| ENTERPRISE    | 9999          | All features, Custom integrations |

### Subscription Lifecycle
1. **Start**: subscription_start_date
2. **Active**: Current date between start and end
3. **Expiring**: 30 days before end_date
4. **Expired**: Current date > end_date

### Employee Limit Check
```typescript
if (userCount >= company.max_employees) {
  throw new BadRequestException(
    `Company has reached maximum employee limit (${company.max_employees})`
  );
}
```

## Best Practices

### 1. Tax ID Uniqueness
- Har bir kompaniya unique tax_id'ga ega bo'lishi kerak
- Create'da va Update'da tekshiriladi

### 2. Company Code
- 6 ta belgi
- Uppercase
- Alfanumerik (A-Z, 0-9)
- User-friendly (I, O, 1, 0 harflardan foydalanmaslik tavsiya etiladi)

### 3. Default Settings
- Har bir kompaniya yaratilganda default settings beriladi
- Timezone: Asia/Tashkent (Uzbekistan)
- Currency: UZS
- Settings keyinchalik update qilinishi mumkin

### 4. Department Management
- Default departments avtomatik yaratiladi
- Soft delete ishlatiladi (active: false)
- Department bilan bog'langan userlar saqlangan holda qoladi

### 5. Subscription Monitoring
- Subscription end_date yaqinlashganda notification
- Employee limit check registration'da
- Plan upgrade/downgrade functionality

## Relations

### Company Relations
- **Users**: One-to-Many
- **Departments**: One-to-Many
- **Terminals**: One-to-Many
- **Holidays**: One-to-Many
- **ScheduleTemplates**: One-to-Many

### Department Relations
- **Company**: Many-to-One
- **Users**: One-to-Many
- **Manager**: Many-to-One (User)

## Error Handling

### BadRequestException
```typescript
throw new BadRequestException('Company code or tax ID already exists');
throw new BadRequestException('Invalid status');
```

### NotFoundException
```typescript
throw new NotFoundException('Company not found');
throw new NotFoundException('Department not found');
```

## Future Enhancements

1. **Multi-currency Support**: Bir nechta valyutalar
2. **Custom Fields**: Kompaniya uchun custom maydonlar
3. **Branding**: Logo, color scheme
4. **Integration Settings**: API keys, webhook URLs
5. **Compliance Settings**: Data retention policies
6. **Department Hierarchy**: Parent-child departments
7. **Company Groups**: Multi-company management
8. **Automated Billing**: Subscription auto-renewal

## Testing Recommendations

### Unit Tests
- Create company with valid/invalid data
- Update company settings
- Subscription plan changes
- Department CRUD operations
- Statistics calculation

### Integration Tests
- Controller endpoints
- Database operations
- Relations loading
- Default departments creation

## Dependencies

### Internal
- User entity (relations)
- Department entity (relations)

### External
- TypeORM: Database operations
- @nestjs/common: NestJS core

## Environment Variables
```env
# No specific env variables for company module
# Uses database configuration from app.module
```