# Schedules Module Documentation

## Umumiy Ma'lumot
Schedules moduli ish jadvallari (schedule templates) va xodimlarning jadval tayinlovlarini (schedule assignments) boshqarish uchun mas'ul. Bu modul xodimlarning ish vaqtlarini rejalashtirish va boshqarishni ta'minlaydi.

## Arxitektura

### Module Tuzilmasi
```
schedules/
├── dto/
│   ├── create-schedule-template.dto.ts      # Template yaratish
│   ├── create-assignment.dto.ts             # Assignment yaratish
│   ├── update-user-assignment.dto.ts        # Assignment yangilash
│   ├── bulk-update-assignment.dto.ts        # Bulk update
│   ├── bulk-delete-assignment.dto.ts        # Bulk delete
│   ├── create-exception.dto.ts              # Exception yaratish
│   └── delete-exception.dto.ts              # Exception o'chirish
├── entities/
│   ├── schedule-template.entity.ts          # Template entity
│   └── employee-schedule-assignment.entity.ts # Assignment entity
├── schedule-templates.controller.ts         # Template controller
├── schedule-assignments.controller.ts       # Assignment controller
├── schedule-templates.service.ts            # Template service
├── schedule-assignments.service.ts          # Assignment service
└── schedules.module.ts                      # Module konfiguratsiyasi
```

## Schedule Template Entity

### Maydonlar
```typescript
{
  template_id: string (UUID)           // Asosiy identifikator
  company_id: string                   // Kompaniya ID (Foreign Key)
  name: string                         // Template nomi
  description?: string                 // Tavsif

  // Ish kunlari (JSONB)
  working_days: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }

  // Ish vaqtlari (JSONB)
  work_hours: {
    start_time: string               // "09:00"
    end_time: string                 // "18:00"
    break_duration_minutes?: number  // Tanaffus davomiyligi
    break_start_time?: string        // Tanaffus boshlash vaqti
  }

  // Qo'shimcha sozlamalar (JSONB)
  settings: {
    timezone: string                 // Vaqt zonasi
    allow_overtime: boolean          // Ortiqcha ish ruxsat berilganmi
    flexible_hours: boolean          // Moslashuvchan ish vaqti
    min_hours_per_day?: number       // Minimal ish soatlari
    max_hours_per_day?: number       // Maksimal ish soatlari
  }

  active: boolean                    // Faollik holati

  // Timestamps
  created_at: Date
  updated_at: Date

  // Relations
  company: Company                   // Bog'langan kompaniya
  assignments: EmployeeScheduleAssignment[] // Tayinlovlar
}
```

## Employee Schedule Assignment Entity

### Maydonlar
```typescript
{
  assignment_id: string (UUID)       // Asosiy identifikator
  user_id: string                    // Xodim ID (Foreign Key)
  template_id: string                // Template ID (Foreign Key)
  company_id: string                 // Kompaniya ID

  // Davr
  effective_from: Date               // Qachondan boshlab
  effective_to?: Date                // Qachongacha (null = indefinite)

  // Exceptions (JSONB) - Maxsus kunlar
  exceptions?: {
    date: string                     // "2024-12-25"
    type: 'HOLIDAY' | 'DAYOFF' | 'CUSTOM'
    reason?: string
    work_hours?: {
      start_time: string
      end_time: string
    }
  }[]

  active: boolean                    // Faollik holati

  // Timestamps
  created_at: Date
  updated_at: Date

  // Relations
  user: User                         // Bog'langan xodim
  template: ScheduleTemplate         // Bog'langan template
  company: Company                   // Bog'langan kompaniya
}
```

## Schedule Templates

### 1. Create Template
**Endpoint**: `POST /schedules/templates`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN, HR_MANAGER

**Kirish ma'lumotlari**:
```json
{
  "name": "Standard 9-6 Weekdays",
  "description": "Monday to Friday, 9:00 AM - 6:00 PM",
  "working_days": {
    "monday": true,
    "tuesday": true,
    "wednesday": true,
    "thursday": true,
    "friday": true,
    "saturday": false,
    "sunday": false
  },
  "work_hours": {
    "start_time": "09:00",
    "end_time": "18:00",
    "break_duration_minutes": 60,
    "break_start_time": "13:00"
  },
  "settings": {
    "timezone": "Asia/Tashkent",
    "allow_overtime": true,
    "flexible_hours": false,
    "min_hours_per_day": 8,
    "max_hours_per_day": 10
  }
}
```

**Xususiyatlari**:
- Company ID avtomatik user'dan olinadi
- SUPER_ADMIN bundan mustasno (company_id berishi shart)

### 2. Find All Templates
**Endpoint**: `GET /schedules/templates`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN, HR_MANAGER

**Xususiyatlari**:
- SUPER_ADMIN: Barcha kompaniyalarning templatelarini ko'radi
- Boshqa rollar: Faqat o'z kompaniyasining templatelarini ko'radi
- Nomi bo'yicha tartiblangan

**Javob**:
```json
{
  "data": [
    {
      "template_id": "uuid",
      "name": "Standard 9-6 Weekdays",
      "description": "Monday to Friday, 9:00 AM - 6:00 PM",
      "working_days": { ... },
      "work_hours": { ... },
      "active": true
    }
  ]
}
```

### 3. Find One Template
**Endpoint**: `GET /schedules/templates/:id`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN, HR_MANAGER

**Company Isolation**: Faqat o'z kompaniyasining templatelarini ko'radi

### 4. Update Template
**Endpoint**: `PATCH /schedules/templates/:id`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN, HR_MANAGER

**Update ma'lumotlari**:
```json
{
  "name": "Updated Template Name",
  "work_hours": {
    "start_time": "08:00",
    "end_time": "17:00"
  }
}
```

### 5. Delete Template
**Endpoint**: `DELETE /schedules/templates/:id`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Xususiyatlari**:
- Hard delete (database'dan o'chiriladi)
- Assignment'lar bilan bog'langan templatelar ehtiyotkorlik bilan o'chirilishi kerak

## Schedule Assignments

### 1. Create Assignment
**Endpoint**: `POST /schedules/assignments`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN, HR_MANAGER

**Kirish ma'lumotlari**:
```json
{
  "user_id": "user-uuid",
  "template_id": "template-uuid",
  "effective_from": "2024-12-01",
  "effective_to": "2025-11-30"
}
```

**Jarayon**:
1. User va Template mavjudligini tekshirish
2. Company isolation tekshirish
3. Overlap (qoplanish) tekshirish (bir xil davrdagi boshqa assignment)
4. Assignment yaratish

**Eslatma**: Bir user uchun bir vaqtda faqat bitta faol template bo'lishi mumkin.

### 2. Get User's Current Schedule
**Endpoint**: `GET /schedules/assignments/user/:userId/current`
**Ruxsatlar**: Barcha rollar (o'z schedule'ini ko'rish)

**Javob**:
```json
{
  "assignment_id": "uuid",
  "user_id": "user-uuid",
  "template": {
    "template_id": "template-uuid",
    "name": "Standard 9-6 Weekdays",
    "working_days": { ... },
    "work_hours": {
      "start_time": "09:00",
      "end_time": "18:00",
      "break_duration_minutes": 60
    }
  },
  "effective_from": "2024-12-01",
  "effective_to": "2025-11-30",
  "exceptions": []
}
```

### 3. Update Assignment
**Endpoint**: `PATCH /schedules/assignments/:id`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN, HR_MANAGER

**Yangilanishi mumkin**:
- effective_from
- effective_to
- template_id

### 4. Bulk Update Assignments
**Endpoint**: `POST /schedules/assignments/bulk-update`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN, HR_MANAGER

**Kirish ma'lumotlari**:
```json
{
  "user_ids": ["user-1", "user-2", "user-3"],
  "template_id": "template-uuid",
  "effective_from": "2024-12-01"
}
```

**Use case**: Bir nechta xodimlarga bir vaqtda bir xil jadval berish

### 5. Bulk Delete Assignments
**Endpoint**: `POST /schedules/assignments/bulk-delete`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Kirish ma'lumotlari**:
```json
{
  "assignment_ids": ["assignment-1", "assignment-2", "assignment-3"]
}
```

### 6. Delete Assignment
**Endpoint**: `DELETE /schedules/assignments/:id`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

## Exceptions (Istisnolar)

### Exception Turlari
```typescript
type ExceptionType = 'HOLIDAY' | 'DAYOFF' | 'CUSTOM';
```

### 1. Create Exception
**Endpoint**: `POST /schedules/assignments/:id/exceptions`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN, HR_MANAGER

**Kirish ma'lumotlari**:
```json
{
  "date": "2024-12-25",
  "type": "HOLIDAY",
  "reason": "Christmas Holiday"
}
```

**Custom work hours bilan**:
```json
{
  "date": "2024-12-24",
  "type": "CUSTOM",
  "reason": "Half day before holiday",
  "work_hours": {
    "start_time": "09:00",
    "end_time": "13:00"
  }
}
```

### 2. Delete Exception
**Endpoint**: `DELETE /schedules/assignments/:id/exceptions`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN, HR_MANAGER

**Kirish ma'lumotlari**:
```json
{
  "date": "2024-12-25"
}
```

## Schedule Calculation

### Ish kunlarini hisoblash
```typescript
function isWorkingDay(date: Date, template: ScheduleTemplate): boolean {
  const dayName = getDayName(date); // 'monday', 'tuesday', etc.
  return template.working_days[dayName] === true;
}
```

### Exception checking
```typescript
function getWorkHours(date: Date, assignment: Assignment) {
  // Check exceptions first
  const exception = assignment.exceptions?.find(e => e.date === formatDate(date));

  if (exception) {
    if (exception.type === 'HOLIDAY' || exception.type === 'DAYOFF') {
      return null; // Ish kuni emas
    }
    if (exception.work_hours) {
      return exception.work_hours; // Custom hours
    }
  }

  // Use template work hours
  return assignment.template.work_hours;
}
```

## Use Cases

### 1. Standard Work Week
```json
{
  "name": "Standard 40-hour Week",
  "working_days": {
    "monday": true,
    "tuesday": true,
    "wednesday": true,
    "thursday": true,
    "friday": true,
    "saturday": false,
    "sunday": false
  },
  "work_hours": {
    "start_time": "09:00",
    "end_time": "18:00",
    "break_duration_minutes": 60
  }
}
```

### 2. Shift Work (Smenali ish)
```json
{
  "name": "Night Shift",
  "working_days": {
    "monday": true,
    "tuesday": true,
    "wednesday": true,
    "thursday": true,
    "friday": true,
    "saturday": false,
    "sunday": false
  },
  "work_hours": {
    "start_time": "22:00",
    "end_time": "06:00"
  }
}
```

### 3. Flexible Hours
```json
{
  "name": "Flexible Schedule",
  "settings": {
    "flexible_hours": true,
    "min_hours_per_day": 6,
    "max_hours_per_day": 10
  }
}
```

### 4. Part-time Schedule
```json
{
  "name": "Part-time (20 hours/week)",
  "working_days": {
    "monday": true,
    "tuesday": false,
    "wednesday": true,
    "thursday": false,
    "friday": true,
    "saturday": false,
    "sunday": false
  },
  "work_hours": {
    "start_time": "09:00",
    "end_time": "15:00"
  }
}
```

## Best Practices

### 1. Template Reusability
- Common templatelar yaratish (9-5, 9-6, shift work)
- Templatelarni department yoki lavozim bo'yicha nomlash

### 2. Effective Dates
- effective_from har doim belgilanishi kerak
- effective_to null = indefinite assignment
- Kelasi o'zgarishlar uchun effective_from kelajak sanasiga o'rnatish

### 3. Exception Management
- Bayramlar uchun holidaylar avtomatik yaratish
- Dam olish kunlari uchun exceptions
- Custom hours uchun exception type = CUSTOM

### 4. Overlap Prevention
- Bir xil davrdagi ikki assignment bo'lmasligi kerak
- Yangi assignment yaratishda tekshirish

### 5. Timezone Awareness
- Har doim timezone belgilash
- UTC conversion uchun moment-timezone

## Company Isolation

### Template Access
```typescript
// Only see own company's templates
if (user.role !== UserRole.SUPER_ADMIN) {
  return templates.filter(t => t.company_id === user.company_id);
}
```

### Assignment Access
- Faqat o'z kompaniyasining xodimlari uchun assignment
- SUPER_ADMIN barcha kompaniyalar

## Relations

### ScheduleTemplate Relations
- **Company**: Many-to-One
- **Assignments**: One-to-Many

### EmployeeScheduleAssignment Relations
- **User**: Many-to-One
- **ScheduleTemplate**: Many-to-One
- **Company**: Many-to-One

## Future Enhancements

1. **Rotation Schedules**: Smenali grafik avtomatik rotation
2. **Schedule Conflicts**: Conflict detection va resolution
3. **Schedule Preview**: Kelasi oy uchun schedule preview
4. **Team Schedules**: Jamoa jadvallari
5. **Schedule Templates Library**: Tayyor templatelar kutubxonasi
6. **Schedule Analytics**: Ish vaqti statistikasi
7. **Mobile App Integration**: Schedule mobile app'da ko'rish
8. **Schedule Notifications**: O'zgarishlar haqida bildirishnomalar

## Testing Recommendations

### Unit Tests
- Template CRUD operations
- Assignment CRUD operations
- Exception management
- Overlap detection
- Work hours calculation

### Integration Tests
- Controller endpoints
- Database operations
- Company isolation
- Date calculations

## Dependencies

### Internal
- User entity
- Company entity

### External
- TypeORM
- moment-timezone (date/time operations)
- @nestjs/common

## Environment Variables
```env
DEFAULT_TIMEZONE=Asia/Tashkent
```