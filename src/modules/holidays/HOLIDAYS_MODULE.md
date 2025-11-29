# Holidays Module Documentation

## Umumiy Ma'lumot
Holidays moduli davlat bayramlari va dam olish kunlarini boshqarish uchun mas'ul. Bu modul davomat tizimida ish kunlarini aniqlash va payroll hisoblarida ishlatiladi.

## Arxitektura

### Module Tuzilmasi
```
holidays/
├── dto/
│   └── create-holiday.dto.ts        # Holiday yaratish
├── entities/
│   └── holiday.entity.ts            # Holiday database entity
├── holidays.controller.ts           # HTTP controller
├── holidays.service.ts              # Business logic
└── holidays.module.ts               # Module konfiguratsiyasi
```

## Holiday Entity

### Maydonlar
```typescript
{
  holiday_id: string (UUID)          // Asosiy identifikator
  name: string                       // Bayram nomi
  date: Date                         // Bayram sanasi
  description?: string               // Tavsif

  // Location scope
  location_scope: string             // 'global', 'uzbekistan', 'tashkent', etc.

  // Type
  type: HolidayType                  // PUBLIC, RELIGIOUS, NATIONAL, COMPANY

  // Recurrence (JSONB)
  is_recurring: boolean              // Har yili takrorlanadimi
  recurrence_rule?: {
    frequency: 'YEARLY'              // Qanday takrorlanadi
    start_year?: number              // Qaysi yildan boshlab
  }

  active: boolean                    // Faollik holati

  // Timestamps
  created_at: Date
  updated_at: Date
}
```

### HolidayType Enum
```typescript
enum HolidayType {
  PUBLIC = 'PUBLIC',         // Davlat bayrami
  RELIGIOUS = 'RELIGIOUS',   // Diniy bayram
  NATIONAL = 'NATIONAL',     // Milliy bayram
  COMPANY = 'COMPANY'        // Kompaniya bayrami
}
```

## Asosiy Funksiyonallik

### 1. Create Holiday
**Endpoint**: `POST /holidays`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Kirish ma'lumotlari**:
```json
{
  "name": "Yangi yil",
  "date": "2024-01-01",
  "description": "Yangi yil bayrami",
  "location_scope": "uzbekistan",
  "type": "PUBLIC",
  "is_recurring": true,
  "recurrence_rule": {
    "frequency": "YEARLY",
    "start_year": 2024
  }
}
```

**Jarayon**:
1. Holiday ma'lumotlari validatsiya qilinadi
2. Sana formati tekshiriladi
3. Holiday yaratiladi va saqlanadi

### 2. Find All Holidays
**Endpoint**: `GET /holidays?year=2024&location=uzbekistan`
**Ruxsatlar**: Barcha rollar

**Query Parametrlari**:
- `year`: Yil bo'yicha filter (optional)
- `location`: Joylashuv bo'yicha filter (optional)

**Xususiyatlari**:
- Sanasi bo'yicha tartiblangan (ASC)
- Location scope: global + specified location
- Year filter applied

**Javob**:
```json
{
  "data": [
    {
      "holiday_id": "uuid",
      "name": "Yangi yil",
      "date": "2024-01-01",
      "type": "PUBLIC",
      "location_scope": "uzbekistan",
      "is_recurring": true
    },
    {
      "holiday_id": "uuid",
      "name": "Navro'z bayrami",
      "date": "2024-03-21",
      "type": "NATIONAL",
      "location_scope": "uzbekistan",
      "is_recurring": true
    }
  ]
}
```

### 3. Find One Holiday
**Endpoint**: `GET /holidays/:id`
**Ruxsatlar**: Barcha rollar

**Javob**:
```json
{
  "holiday_id": "uuid",
  "name": "Navro'z bayrami",
  "date": "2024-03-21",
  "description": "Milliy bayram",
  "type": "NATIONAL",
  "location_scope": "uzbekistan",
  "is_recurring": true,
  "recurrence_rule": {
    "frequency": "YEARLY",
    "start_year": 2024
  }
}
```

### 4. Update Holiday
**Endpoint**: `PATCH /holidays/:id`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Update ma'lumotlari**:
```json
{
  "name": "Updated Holiday Name",
  "description": "Updated description",
  "location_scope": "tashkent"
}
```

### 5. Delete Holiday
**Endpoint**: `DELETE /holidays/:id`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Xususiyatlari**:
- Hard delete (database'dan o'chiriladi)
- Ehtiyotkorlik bilan o'chirish (payroll/attendance'da ishlatilgan bo'lishi mumkin)

### 6. Check if Date is Holiday
**Endpoint**: `GET /holidays/check/:date?location=uzbekistan`
**Ruxsatlar**: Barcha rollar

**Response**:
```json
{
  "isHoliday": true,
  "holiday": {
    "name": "Navro'z bayrami",
    "type": "NATIONAL"
  }
}
```

### 7. Get Holidays for Date Range
**Endpoint**: `GET /holidays/range?from=2024-01-01&to=2024-12-31&location=uzbekistan`
**Ruxsatlar**: Barcha rollar

**Use case**: Attendance yoki payroll uchun ma'lum davrdagi bayramlarni olish

**Response**:
```json
{
  "data": [
    {
      "holiday_id": "uuid",
      "name": "Yangi yil",
      "date": "2024-01-01"
    },
    {
      "holiday_id": "uuid",
      "name": "Navro'z bayrami",
      "date": "2024-03-21"
    }
  ],
  "total": 15
}
```

## Location Scope

### Qiymatlar
```typescript
location_scope:
  'global'        // Barcha mamlakatlar
  'uzbekistan'    // O'zbekiston
  'tashkent'      // Toshkent
  'samarkand'     // Samarqand
  'company:uuid'  // Kompaniya-specific
```

### Filtering Logic
```typescript
// Global + specific location
if (location === 'tashkent') {
  return holidays.filter(h =>
    h.location_scope === 'global' ||
    h.location_scope === 'tashkent' ||
    h.location_scope === 'uzbekistan'
  );
}
```

## Recurring Holidays

### Yearly Recurrence
```typescript
interface RecurrenceRule {
  frequency: 'YEARLY';
  start_year?: number;     // Qaysi yildan boshlab
  end_year?: number;       // Qaysi yilgacha (optional)
}
```

### Example: Yangi yil
```json
{
  "name": "Yangi yil",
  "date": "2024-01-01",
  "is_recurring": true,
  "recurrence_rule": {
    "frequency": "YEARLY",
    "start_year": 2024
  }
}
```

**Explanation**: Har yil 1-yanvar bayram hisoblanadi

### Example: Company Anniversary
```json
{
  "name": "Company Anniversary",
  "date": "2024-06-15",
  "type": "COMPANY",
  "location_scope": "company:uuid",
  "is_recurring": true,
  "recurrence_rule": {
    "frequency": "YEARLY",
    "start_year": 2024
  }
}
```

## Uzbekistan Public Holidays (2024)

### National Holidays
```typescript
const uzbekistanHolidays = [
  { name: "Yangi yil", date: "01-01", type: "PUBLIC" },
  { name: "Xotin-qizlar kuni", date: "03-08", type: "PUBLIC" },
  { name: "Navro'z bayrami", date: "03-21", type: "NATIONAL" },
  { name: "Xotira va qadrlash kuni", date: "05-09", type: "NATIONAL" },
  { name: "Mustaqillik kuni", date: "09-01", type: "NATIONAL" },
  { name: "O'qituvchi va murabbiylar kuni", date: "10-01", type: "PUBLIC" },
  { name: "Konstitutsiya kuni", date: "12-08", type: "NATIONAL" }
];
```

### Religious Holidays (Variable dates)
```typescript
const religiousHolidays = [
  { name: "Ramazon hayiti", type: "RELIGIOUS" },  // Lunar calendar
  { name: "Qurbon hayiti", type: "RELIGIOUS" }    // Lunar calendar
];
```

**Note**: Diniy bayramlar lunar calendar bo'yicha har yili o'zgaradi

## Integration with Attendance

### Working Day Check
```typescript
async function isWorkingDay(date: Date, userId: string): Promise<boolean> {
  // 1. Check if it's a weekend
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  if (isWeekend) return false;

  // 2. Check if it's a holiday
  const user = await getUser(userId);
  const isHoliday = await holidaysService.isHoliday(date, user.location);
  if (isHoliday) return false;

  // 3. Check schedule template
  const schedule = await getSchedule(userId, date);
  return schedule.isWorkingDay(date);
}
```

### Payroll Calculation
```typescript
async function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  location: string
): Promise<number> {
  const holidays = await holidaysService.getHolidaysForDateRange(
    startDate,
    endDate,
    location
  );

  let workingDays = 0;
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    const isHoliday = holidays.some(h =>
      isSameDay(new Date(h.date), currentDate)
    );

    if (!isWeekend && !isHoliday) {
      workingDays++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
}
```

## Best Practices

### 1. Location Hierarchy
```
global
  └── uzbekistan
        ├── tashkent
        ├── samarkand
        └── bukhara
```

### 2. Recurring Holidays
- Common holidays uchun is_recurring = true
- One-time events uchun is_recurring = false

### 3. Company-specific Holidays
```json
{
  "name": "Team Building Day",
  "date": "2024-07-15",
  "type": "COMPANY",
  "location_scope": "company:company-uuid",
  "is_recurring": false
}
```

### 4. Holiday Naming
- O'zbek tilida yoki ingliz tilida
- Aniq va tushunarli nomlar
- Abbreviation'lardan foydalanmaslik

### 5. Date Management
- Always use ISO date format (YYYY-MM-DD)
- Timezone aware (UTC storage)
- Display in user's timezone

## Use Cases

### 1. Payroll Processing
```typescript
// Ish kunlarini hisoblash
const workingDays = await calculateWorkingDays(
  new Date('2024-01-01'),
  new Date('2024-01-31'),
  'uzbekistan'
);

// Bayramlar uchun to'lov
const holidayPay = calculateHolidayPay(holidays, employee);
```

### 2. Attendance Validation
```typescript
// Agar bayram bo'lsa, attendance talab qilinmaydi
if (await isHoliday(date, location)) {
  return { required: false, reason: 'Public Holiday' };
}
```

### 3. Leave Management
```typescript
// Dam olish kunlari hisoblashda bayramlar hisobga olinmaydi
const leaveDays = calculateLeaveDays(
  startDate,
  endDate,
  excludeHolidays: true
);
```

### 4. Schedule Planning
```typescript
// Keyingi oy uchun jadval yaratishda bayramlarni ko'rsatish
const nextMonthSchedule = await createMonthlySchedule(
  userId,
  nextMonth,
  includeHolidays: true
);
```

## Error Handling

### NotFoundException
```typescript
throw new NotFoundException('Holiday not found');
```

### Validation Errors
```typescript
// Invalid date
if (!isValidDate(date)) {
  throw new BadRequestException('Invalid date format');
}

// Past date for recurring
if (is_recurring && date < new Date()) {
  throw new BadRequestException('Recurring holidays cannot be in the past');
}
```

## Future Enhancements

1. **Multi-country Support**: Turli mamlakatlar uchun holidays
2. **Holiday Calendar View**: Calendar UI integratsiyasi
3. **Holiday Notifications**: Yaqinlashib kelayotgan bayramlar haqida
4. **Working Hours on Holidays**: Qisman ish kunlari support
5. **Holiday Substitution**: Bayram weekend'ga to'g'ri kelsa
6. **Holiday Import/Export**: CSV/iCal format support
7. **Holiday Templates**: Pre-configured holiday sets
8. **Regional Holidays**: Viloyat darajasida bayramlar

## Testing Recommendations

### Unit Tests
- CRUD operations
- Date validation
- Recurrence logic
- Location filtering
- isHoliday check

### Integration Tests
- Controller endpoints
- Database operations
- Date range queries
- Attendance integration

## Dependencies

### External
- TypeORM: Database operations
- moment/date-fns: Date manipulations
- @nestjs/common: NestJS core

## Environment Variables
```env
DEFAULT_LOCATION=uzbekistan
TIMEZONE=Asia/Tashkent
```

## Sample Data Script

```typescript
async function seedHolidays() {
  const holidays = [
    {
      name: "Yangi yil",
      date: new Date('2024-01-01'),
      type: HolidayType.PUBLIC,
      location_scope: 'uzbekistan',
      is_recurring: true,
      recurrence_rule: { frequency: 'YEARLY', start_year: 2024 }
    },
    // ... more holidays
  ];

  for (const holiday of holidays) {
    await holidaysService.create(holiday);
  }
}
```