# Auth Module Documentation

## Umumiy Ma'lumot
Auth moduli foydalanuvchilarni autentifikatsiya qilish, ro'yxatdan o'tkazish va tizimga kirish huquqlarini boshqarish uchun mas'ul. Bu modul SOLID printsiplarini qo'llagan holda yaratilgan va turli xil xizmatlarni o'z ichiga oladi.

## Arxitektura

### Module Tuzilmasi
```
auth/
├── dto/                          # Data Transfer Objects
│   ├── login.dto.ts             # Login uchun ma'lumotlar
│   ├── register.dto.ts          # Ro'yxatdan o'tish uchun
│   ├── admin-create-user.dto.ts # Admin tomonidan foydalanuvchi yaratish
│   ├── change-password.dto.ts   # Parol o'zgartirish
│   ├── update-profile.dto.ts    # Profil yangilash
│   └── photo-upload-job.dto.ts  # Foto yuklash uchun
├── services/                     # Ixtisoslashgan xizmatlar
│   ├── password.service.ts      # Parol boshqaruvi
│   ├── permission.service.ts    # Ruxsatlar tekshiruvi
│   ├── company.service.ts       # Kompaniya operatsiyalari
│   └── photo-upload.service.ts  # Foto yuklash
├── processors/                   # Queue processors
│   └── photo-upload-queue.processor.ts
├── strategies/                   # Passport strategiyalari
│   └── jwt.strategy.ts          # JWT autentifikatsiya
├── interfaces/                   # TypeScript interfeyslari
├── auth.controller.ts           # HTTP controller
├── auth.service.ts              # Asosiy service
└── auth.module.ts               # Module konfiguratsiyasi
```

## SOLID Printsiplari

### 1. Single Responsibility Principle (SRP)
Har bir service o'zining bitta mas'uliyatiga ega:
- **PasswordService**: Faqat parol bilan bog'liq operatsiyalar (hash, compare, generate)
- **PermissionService**: Faqat ruxsatlarni tekshirish
- **CompanyService**: Faqat kompaniya bilan bog'liq operatsiyalar
- **PhotoUploadService**: Faqat foto yuklash jarayoni

### 2. Dependency Inversion
AuthService boshqa xizmatlarning abstraksiyalariga (interfacelariga) bog'liq:
```typescript
constructor(
  private passwordService: PasswordService,
  private permissionService: PermissionService,
  private companyService: CompanyService,
  private photoUploadService: PhotoUploadService,
)
```

## Asosiy Funksiyonallik

### 1. Login (Tizimga kirish)
**Endpoint**: `POST /auth/login`
**Kirish ma'lumotlari**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Jarayon**:
1. Foydalanuvchi emaili orqali qidiriladi
2. Parol tekshiriladi (PasswordService orqali)
3. Kompaniya statusi tekshiriladi (SUPER_ADMIN bundan mustasno)
4. JWT token yaratiladi
5. Token va foydalanuvchi ma'lumotlari qaytariladi

### 2. Register (Ro'yxatdan o'tish)
**Endpoint**: `POST /auth/register`
**Ikki xil ssenari**:

#### A. Yangi kompaniya yaratish
```json
{
  "email": "owner@company.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "create_company": true,
  "company_name": "My Company"
}
```
- Foydalanuvchi COMPANY_OWNER roli bilan yaratiladi
- Kompaniya kodi avtomatik generatsiya qilinadi
- Default sozlamalar qo'llaniladi

#### B. Mavjud kompaniyaga qo'shilish
```json
{
  "email": "employee@company.com",
  "password": "password123",
  "first_name": "Jane",
  "last_name": "Smith",
  "company_code": "ABC123"
}
```
- Foydalanuvchi EMPLOYEE roli bilan yaratiladi
- Kompaniya kodining to'g'riligi tekshiriladi
- Employee limit tekshiriladi

### 3. Admin Create User (Admin tomonidan foydalanuvchi yaratish)
**Endpoint**: `POST /auth/create-user`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN, HR_MANAGER

**Xususiyatlari**:
- Foto yuklash majburiy (5MB gacha, JPG/JPEG/PNG formatda)
- HC Cabinet bilan integratsiya
- Background queue orqali foto yuklash
- Vaqtinchalik parol yaratish
- Terminal bilan bog'lash imkoniyati

**Jarayon**:
1. Foydalanuvchini yaratish huquqi tekshiriladi (PermissionService)
2. Email unikal ekanligini tekshirish
3. Vaqtinchalik parol yaratiladi (PasswordService)
4. HC Cabinet'da foydalanuvchi yaratiladi
5. Ma'lumotlar bazasiga saqlanadi (status: SYNCED)
6. Terminal bilan bog'lanadi (agar kerak bo'lsa)
7. Foto yuklash queue'ga qo'shiladi

**Javob**:
```json
{
  "message": "User created successfully",
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "role": "EMPLOYEE",
    "status": "SYNCED"
  },
  "temporary_password": "Temp123!",
  "photoUpload": {
    "status": "QUEUED",
    "jobId": "job-id-123"
  },
  "hcUser": { ... }
}
```

### 4. Profile Management

#### Get Profile
**Endpoint**: `GET /auth/profile`
- To'liq profil ma'lumotlari
- Kompaniya statistikasi
- Foydalanuvchi ruxsatlari

#### Update Profile
**Endpoint**: `PATCH /auth/profile`
- Shaxsiy ma'lumotlarni yangilash
- Email o'zgartirish (unikalligi tekshiriladi)

#### Change Password
**Endpoint**: `PATCH /auth/change-password`
- Eski parolni tekshirish
- Yangi parol o'rnatish

### 5. Password Reset (Admin tomonidan)
**Endpoint**: `POST /auth/reset-password/:userId`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

Foydalanuvchi uchun yangi vaqtinchalik parol yaratiladi.

### 6. Photo Upload
**Endpoint**: `POST /auth/upload-photo`
- Local database va HC Cabinet'ga foto yuklash
- User ID yoki HC Person ID orqali
- Base64 formatda saqlanadi

## Services

### PasswordService
**Funksiyalar**:
- `hashPassword(password: string)`: Parolni hash qilish
- `comparePassword(plain: string, hash: string)`: Parolni taqqoslash
- `generateTemporaryPassword()`: Vaqtinchalik parol yaratish

### PermissionService
**Funksiyalar**:
- `validateUserCreationPermission(actorRole, targetRole)`: Foydalanuvchi yaratish huquqini tekshirish
- `getUserPermissions(role)`: Rol bo'yicha ruxsatlarni olish

**Hierarchy**:
```
SUPER_ADMIN > COMPANY_OWNER > ADMIN > HR_MANAGER > EMPLOYEE
```

### CompanyService
**Funksiyalar**:
- `generateUniqueCompanyCode()`: Unikal kompaniya kodi yaratish
- `getCompanyStatistics(companyId)`: Kompaniya statistikasini olish

### PhotoUploadService
**Funksiyalar**:
- `queuePhotoUpload(jobData)`: Foto yuklashni queue'ga qo'shish
- Background processing orqali HC Cabinet'ga foto yuklash

## Queue Processing

### Photo Upload Queue
**Queue nomi**: `photo-upload`

**Konfiguratsiya**:
- 3 marta qayta urinish (retry)
- Exponential backoff: 2s, 4s, 8s
- Muvaffaqiyatli joblar o'chiriladi
- Failed joblar debugging uchun saqlanadi

**Processor**: `PhotoUploadQueueProcessor`
- HC Cabinet'ga foto yuklash
- User status yangilash
- Error handling

## JWT Strategy

### Payload
```typescript
{
  user_id: string,
  email: string,
  role: UserRole,
  company_id: string
}
```

### Validation
- Foydalanuvchining faol ekanligini tekshirish
- Kompaniya statusini tekshirish (SUPER_ADMIN bundan mustasno)

## Xavfsizlik

### Guards
1. **AuthGuard**: JWT token tekshiruvi
2. **RolesGuard**: Rol-based access control

### Password Security
- Bcrypt algorithm bilan hash qilinadi
- Minimal uzunlik va murakkablik talablari

### Company Isolation
- Foydalanuvchilar faqat o'z kompaniyasi bilan ishlashi mumkin
- SUPER_ADMIN barcha kompaniyalarga kirish huquqiga ega

## HC Cabinet Integratsiya

### User Sync
1. **Create**: Avval HC'da yaratiladi, keyin local DB'ga saqlanadi
2. **Update**: Ikkalasi ham yangilanadi
3. **Delete**: HC'da endDate o'rnatiladi, local'da inactive qilinadi

### Status Management
- `PENDING`: HC sync kutilmoqda
- `SYNCED`: Muvaffaqiyatli sync qilindi
- `FAILED_SYNC`: Sync xatolik bilan yakunlandi
- `INACTIVE`: Foydalanuvchi o'chirilgan

## Best Practices

1. **Email Notifications**: TODO - yangi foydalanuvchilarga email yuborish
2. **Password Policy**: Kuchli parol talablari
3. **Token Expiration**: JWT tokenlar vaqtinchalik
4. **Audit Logging**: Barcha autentifikatsiya hodisalari loglanadi
5. **Error Handling**: To'liq error handling va user-friendly xabarlar

## Environment Variables
```env
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h
HC_API_URL=http://hc-cabinet-api
HC_APP_KEY=your-app-key
HC_SECRET_KEY=your-secret-key
```

## Dependencies
- `@nestjs/jwt`: JWT token boshqaruvi
- `@nestjs/passport`: Autentifikatsiya strategiyalari
- `@nestjs/bull`: Queue management
- `bcrypt`: Password hashing
- TypeORM: Database operations

## Testing
Auth modulida quyidagi testlar bo'lishi kerak:
- Unit tests: Har bir service uchun
- Integration tests: Controller endpoints
- E2E tests: To'liq autentifikatsiya oqimlari

## Kelajak Rivojlanishlar
1. Multi-factor authentication (MFA)
2. OAuth2 / Social login
3. Password reset via email
4. Session management
5. IP-based restrictions
6. Login attempt limiting