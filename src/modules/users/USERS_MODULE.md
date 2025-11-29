# Users Module Documentation

## Umumiy Ma'lumot
Users moduli tizimda mavjud foydalanuvchilarni boshqarish, yangilash va o'chirish uchun mas'ul. Bu modul Auth moduli bilan birgalikda ishlaydi va foydalanuvchilar ma'lumotlarini CRUD operatsiyalari orqali boshqaradi.

## Arxitektura

### Module Tuzilmasi
```
users/
├── dto/
│   ├── create-user.dto.ts      # Foydalanuvchi yaratish
│   └── update-user.dto.ts      # Foydalanuvchi yangilash
├── entities/
│   └── user.entity.ts          # User database entity
├── users.controller.ts         # HTTP controller
├── users.service.ts            # Business logic
└── users.module.ts             # Module konfiguratsiyasi
```

## User Entity

### Maydonlar
```typescript
{
  id: string (UUID)              // Asosiy identifikator
  company_id: string             // Kompaniya ID
  email: string (unique)         // Email manzil
  password_hash: string          // Shifrlangan parol
  role: UserRole                 // Foydalanuvchi roli
  hcPersonId: string             // HC Cabinet ID

  // Shaxsiy ma'lumotlar
  first_name: string
  last_name: string
  middle_name?: string
  phone?: string
  dob?: Date                     // Tug'ilgan sana

  // Ish ma'lumotlari
  position?: string              // Lavozim
  department_id?: string         // Bo'lim ID
  manager_id?: string            // Menejer ID
  location?: string              // Joylashuv
  start_date?: Date              // Ish boshlagan sana
  end_date?: Date                // Ish tugatgan sana

  // Moliyaviy ma'lumotlar
  tariff_type?: TariffType       // HOURLY / SALARY
  hourly_rate?: number           // Soatlik tarif
  monthly_salary?: number        // Oylik maosh

  // Status
  status: UserStatus             // PENDING, SYNCED, FAILED_SYNC, INACTIVE
  active: boolean                // Faollik holati
  mfa_enabled: boolean           // MFA yoqilgan/o'chirilgan

  // Photo
  photo_url?: string             // Foto URL

  // Timestamps
  created_at: Date
  updated_at: Date
}
```

### UserRole Enum
```typescript
enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',      // Tizim administratori
  COMPANY_OWNER = 'COMPANY_OWNER',  // Kompaniya egasi
  ADMIN = 'ADMIN',                  // Kompaniya administratori
  HR_MANAGER = 'HR_MANAGER',        // HR menejer
  EMPLOYEE = 'EMPLOYEE'             // Oddiy xodim
}
```

### UserStatus Enum
```typescript
enum UserStatus {
  PENDING = 'PENDING',              // HC sync kutilmoqda
  SYNCED = 'SYNCED',                // HC bilan sync qilingan
  FAILED_SYNC = 'FAILED_SYNC',      // Sync xatolik
  INACTIVE = 'INACTIVE'             // Faol emas
}
```

### TariffType Enum
```typescript
enum TariffType {
  HOURLY = 'HOURLY',                // Soatlik to'lov
  SALARY = 'SALARY'                 // Oylik maosh
}
```

## Asosiy Funksiyonallik

### 1. Create User
**Endpoint**: `POST /users`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Kirish ma'lumotlari**:
```json
{
  "email": "employee@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "EMPLOYEE",
  "position": "Developer",
  "department_id": "dept-uuid",
  "monthly_salary": 5000000
}
```

**Jarayon**:
1. Email unikalligi tekshiriladi
2. Parol hashlanadi (CryptoUtils)
3. User yaratiladi va saqlanadi
4. Created user qaytariladi

**Eslatma**: Bu endpoint asosan internal ishlatish uchun. Public user creation uchun Auth modulidan foydalaniladi.

### 2. Find All Users
**Endpoint**: `GET /users`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN, HR_MANAGER

**Xususiyatlari**:
- **SUPER_ADMIN**: Barcha kompaniyalarning foydalanuvchilarini ko'radi
- **Boshqa rollar**: Faqat o'z kompaniyasining foydalanuvchilarini ko'radi
- SUPER_ADMIN va COMPANY_OWNER rollari filtrlanadi (oddiy adminlar ko'rmaydi)

**Javob**:
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "EMPLOYEE",
      "first_name": "John",
      "last_name": "Doe",
      "position": "Developer",
      "active": true,
      "status": "SYNCED"
    }
  ]
}
```

### 3. Find One User
**Endpoint**: `GET /users/:id`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN, HR_MANAGER

**Company Isolation**:
- SUPER_ADMIN barcha userlarni ko'rishi mumkin
- Boshqa rollar faqat o'z kompaniyasidagi userlarni ko'radi
- Agar user boshqa kompaniyaga tegishli bo'lsa - 403 Forbidden

**Javob**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "EMPLOYEE",
  "company_id": "company-uuid",
  "active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### 4. Update User
**Endpoint**: `PATCH /users/:id`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Yangilanishi mumkin bo'lgan maydonlar**:
- Shaxsiy ma'lumotlar (first_name, last_name, phone, dob)
- Email (unikalligi tekshiriladi)
- Lavozim va bo'lim
- Ish sanalari (start_date, end_date)
- Moliyaviy ma'lumotlar (tariff_type, hourly_rate, monthly_salary)
- Parol (hashlanadi)

**HC Cabinet Integratsiya**:
Agar user HC bilan sync qilingan bo'lsa (hcPersonId mavjud):
1. HC'dan current user ma'lumotlari olinadi
2. Yangi ma'lumotlar bilan HC'dagi user yangilanadi
3. Local database yangilanadi

**Update ma'lumotlari**:
```json
{
  "first_name": "Jane",
  "phone": "+998901234567",
  "monthly_salary": 6000000,
  "end_date": "2024-12-31"
}
```

**HC Update jarayoni**:
```typescript
// HC'ga yuboriladi:
{
  groupId: hcUser.groupId,
  personCode: hcUser.personCode,
  firstName: "Jane",
  lastName: hcUser.lastName,
  gender: hcUser.gender,
  phone: "+998901234567",
  startDate: "2024-01-01",
  endDate: "2024-12-31"
}
```

### 5. Remove (Soft Delete)
**Endpoint**: `DELETE /users/:id`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Jarayon**:
1. User topiladi va company isolation tekshiriladi
2. User `active = false` va `status = INACTIVE` qilib belgilanadi
3. HC Cabinet'da startDate va endDate hozirgi vaqtga o'rnatiladi (user inactive)
4. User o'chirilmaydi, faqat nofaol holatga keltiriladi (soft delete)

**HC Cabinet sync**:
```typescript
// HC'da both dates are set to now
{
  startDate: "2024-11-29",
  endDate: "2024-11-29"  // Same date = inactive
}
```

## Company Isolation (Kompaniya Izolatsiyasi)

### Xavfsizlik Qoidalari
1. **SUPER_ADMIN**: Barcha kompaniyalar bilan ishlashi mumkin
2. **Boshqa rollar**: Faqat o'z kompaniyasi bilan ishlaydi

### Implementation
```typescript
// FindAll
if (role === UserRole.SUPER_ADMIN) {
  return await this.userRepository.find();
}
return await this.userRepository.find({
  where: { company_id }
});

// FindOne, Update, Delete
if (user.role !== UserRole.SUPER_ADMIN &&
    targetUser.company_id !== user.company_id) {
  throw new ForbiddenException('Access denied');
}
```

## HC Cabinet Integratsiya

### Update operatsiyasi
1. **Get HC User**: HC'dan user ma'lumotlari olinadi
2. **Prepare Update**: Faqat o'zgargan maydonlar yuboriladi
3. **Update HC**: HC Cabinet yangilanadi
4. **Update Local**: Local database yangilanadi

### Error Handling
- Agar HC update fail bo'lsa, local update bajariladi
- Error console'ga loglanadi
- User HC sync statusini tekshirish mumkin

### Date Formatting
HC Cabinet bilan ishlashda `HcDateFormatter` utility ishlatiladi:
```typescript
HcDateFormatter.toHcFormat(new Date()); // "2024-11-29"
```

## Dependencies

### Internal Dependencies
- `CryptoUtils`: Parol hashlash
- `HcService`: HC Cabinet operatsiyalari
- `HcDateFormatter`: Sana formatlash

### External Dependencies
- TypeORM: Database operations
- @nestjs/common: NestJS core

## Best Practices

### 1. Password Security
- Hech qachon plain text parollar saqlanmaydi
- Faqat hash qilingan parollar database'da
- CryptoUtils orqali bcrypt ishlatiladi

### 2. Email Uniqueness
- Har bir user unique email'ga ega
- Create va Update'da unique constraint tekshiriladi
- Email case-insensitive bo'lishi kerak

### 3. Soft Delete
- Hard delete o'rniga soft delete ishlatiladi
- Tarixiy ma'lumotlar saqlanadi
- Active filter orqali nofaol userlar yashirinadi

### 4. HC Sync
- HC bilan sync optional (hcPersonId mavjud bo'lsa)
- HC fail bo'lsa ham local operations davom etadi
- Logging orqali HC issues track qilinadi

### 5. Company Isolation
- Har doim company_id orqali filter qilish
- SUPER_ADMIN istisno
- ForbiddenException access denied'da

## Error Handling

### NotFoundException
```typescript
throw new NotFoundException('User not found');
```

### ForbiddenException
```typescript
throw new ForbiddenException('Access denied: user belongs to another company');
```

### BadRequestException
```typescript
throw new BadRequestException('Email already exists');
```

## Future Enhancements

1. **Bulk Operations**: Ko'p userlarni bir vaqtda yangilash
2. **User Search**: Qidirish funksiyonalligi
3. **User Activity Log**: User faoliyatini kuzatish
4. **Profile Picture Management**: Foto upload/delete
5. **User Import/Export**: CSV/Excel import/export
6. **Advanced Filtering**: Role, department, status bo'yicha filter
7. **User Permissions**: Granular permissions per user

## Relations

### User bilan bog'langan entitylar:
- **Company**: Many-to-One
- **Department**: Many-to-One
- **Manager**: Self-referential Many-to-One
- **AttendanceRecords**: One-to-Many
- **PayrollItems**: One-to-Many
- **ScheduleAssignments**: One-to-Many

## Testing Recommendations

### Unit Tests
- Create user with valid/invalid data
- Update user - success va failure cases
- Soft delete functionality
- Company isolation logic
- HC sync logic

### Integration Tests
- Controller endpoints
- Database operations
- HC Cabinet integration
- Error handling

## Environment Variables
```env
# HC Cabinet (from HC module)
HC_API_URL=http://hc-cabinet-api
HC_APP_KEY=your-app-key
HC_SECRET_KEY=your-secret-key
```