# Payroll Module Documentation

## Umumiy Ma'lumot
Payroll moduli xodimlarning ish haqini hisoblash, davomat ma'lumotlariga asoslangan to'lovlarni boshqarish va ish hajmi (work volume) ma'lumotlarini qayta ishlash uchun mas'ul. Bu modul attendance moduli bilan yaqin integratsiyalangan.

## Arxitektura

### Module Tuzilmasi
```
payroll/
├── dto/
│   ├── create-period.dto.ts         # Payroll davri yaratish
│   ├── create-payroll-item.dto.ts   # Payroll item yaratish
│   └── payroll-filter.dto.ts        # Filtrlash uchun
├── entities/
│   ├── payroll-period.entity.ts     # Payroll davri
│   ├── payroll-item.entity.ts       # To'lov qalami
│   └── work-volume-entry.entity.ts  # Ish hajmi ma'lumotlari
├── payroll.controller.ts            # HTTP controller
├── payroll.service.ts               # Business logic
├── payroll-processor.service.ts     # Payroll hisoblash logikasi
├── payroll-queue.processor.ts       # Background queue processor
└── payroll.module.ts                # Module konfiguratsiyasi
```

## Payroll Period Entity

### Maydonlar
```typescript
{
  period_id: string (UUID)           // Asosiy identifikator
  company_id: string                 // Kompaniya ID

  // Period ma'lumotlari
  name: string                       // "January 2024", "2024-Q1"
  period_type: PeriodType            // MONTHLY, WEEKLY, BIWEEKLY, CUSTOM
  start_date: Date                   // Davr boshlanishi
  end_date: Date                     // Davr tugashi

  // Status
  status: PeriodStatus               // OPEN, PROCESSING, PROCESSED, LOCKED, CLOSED
  processed_at?: Date                // Qayta ishlangan vaqt
  close_date?: Date                  // Yopilgan vaqt

  // Processing metadata (JSONB)
  metadata?: {
    total_employees: number
    total_earnings: number
    total_deductions: number
    processing_duration_ms: number
    processor_id: string
  }

  // Timestamps
  created_at: Date
  updated_at: Date

  // Relations
  company: Company
  items: PayrollItem[]               // Payroll qalamlari
}
```

### PeriodType Enum
```typescript
enum PeriodType {
  MONTHLY = 'MONTHLY',       // Oylik
  WEEKLY = 'WEEKLY',         // Haftalik
  BIWEEKLY = 'BIWEEKLY',     // Ikki haftalik
  CUSTOM = 'CUSTOM'          // Custom davr
}
```

### PeriodStatus Enum
```typescript
enum PeriodStatus {
  OPEN = 'OPEN',                 // Ochiq, yangi itemlar qo'shish mumkin
  PROCESSING = 'PROCESSING',     // Qayta ishlanmoqda
  PROCESSED = 'PROCESSED',       // Qayta ishlangan
  LOCKED = 'LOCKED',             // Qulflangan, o'zgartirish mumkin emas
  CLOSED = 'CLOSED'              // Yopilgan, final
}
```

## Payroll Item Entity

### Maydonlar
```typescript
{
  item_id: string (UUID)             // Asosiy identifikator
  period_id: string                  // Period ID (Foreign Key)
  user_id: string                    // Xodim ID (Foreign Key)
  company_id: string                 // Kompaniya ID

  // Item ma'lumotlari
  type: PayrollItemType              // EARNING, DEDUCTION, BONUS, OVERTIME
  code: string                       // Item kodi (SALARY, OVERTIME, TAX, etc.)
  name: string                       // Item nomi
  description?: string               // Tavsif

  // Miqdorlar
  quantity?: number                  // Miqdor (soatlar, kunlar)
  rate?: number                      // Tarif
  amount: number                     // Umumiy summa

  // Calculation details (JSONB)
  calculation_details?: {
    base_amount?: number
    multiplier?: number
    formula?: string
    source?: string                  // 'ATTENDANCE', 'MANUAL', 'IMPORT'
  }

  // Timestamps
  created_at: Date
  updated_at: Date

  // Relations
  period: PayrollPeriod
  employee: User
}
```

### PayrollItemType Enum
```typescript
enum PayrollItemType {
  EARNING = 'EARNING',         // Daromad (maosh, bonus)
  DEDUCTION = 'DEDUCTION',     // Chegirma (soliq, jarima)
  BONUS = 'BONUS',             // Bonus
  OVERTIME = 'OVERTIME'        // Ortiqcha ish haqi
}
```

## Work Volume Entry Entity

### Maydonlar
```typescript
{
  entry_id: string (UUID)            // Asosiy identifikator
  user_id: string                    // Xodim ID
  company_id: string                 // Kompaniya ID
  date: Date                         // Ish kuni

  // Ish hajmi ma'lumotlari
  regular_hours: number              // Oddiy ish soatlari
  overtime_hours: number             // Ortiqcha ish soatlari
  total_hours: number                // Jami soatlar

  // Status
  status: string                     // PENDING, APPROVED, REJECTED
  approved_by?: string               // Kim tasdiqlagan
  approved_at?: Date                 // Qachon tasdiqlangan

  // Source
  source: string                     // ATTENDANCE, MANUAL, IMPORT

  // Timestamps
  created_at: Date
  updated_at: Date

  // Relations
  user: User
}
```

## Asosiy Funksiyonallik

### 1. Create Payroll Period
**Endpoint**: `POST /payroll/periods`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Kirish ma'lumotlari**:
```json
{
  "name": "January 2024 Payroll",
  "period_type": "MONTHLY",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

**Jarayon**:
1. Company ID avtomatik actor'dan olinadi
2. Sanalar validatsiya qilinadi
3. Period yaratiladi (status: OPEN)
4. Period qaytariladi

### 2. Find All Periods
**Endpoint**: `GET /payroll/periods?status=OPEN&page=1&limit=10`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN, HR_MANAGER

**Query Parametrlari**:
- `status`: PeriodStatus (optional)
- `page`: Sahifa raqami (default: 1)
- `limit`: Har sahifada nechta (default: 10)

**Response**:
```json
{
  "data": [
    {
      "period_id": "uuid",
      "name": "January 2024 Payroll",
      "period_type": "MONTHLY",
      "start_date": "2024-01-01",
      "end_date": "2024-01-31",
      "status": "OPEN"
    }
  ],
  "total": 12
}
```

### 3. Find One Period
**Endpoint**: `GET /payroll/periods/:id`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN, HR_MANAGER

**Response**:
Period ma'lumotlari + barcha payroll items

### 4. Process Period
**Endpoint**: `POST /payroll/periods/:id/process`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Jarayon**:
1. Period OPEN statusda bo'lishi kerak
2. Attendance ma'lumotlari yig'iladi
3. Har bir xodim uchun payroll hisoblanadi
4. PayrollItems yaratiladi
5. Status PROCESSED'ga o'zgartiriladi
6. Close_date o'rnatiladi

**Processing Logic**:
```typescript
async processPeriod(periodId: string) {
  // 1. Get all employees
  const employees = await getActiveEmployees(companyId);

  for (const employee of employees) {
    // 2. Get attendance records for period
    const attendance = await getAttendanceRecords(
      employee.id,
      period.start_date,
      period.end_date
    );

    // 3. Calculate earnings
    const earnings = calculateEarnings(employee, attendance);

    // 4. Calculate deductions
    const deductions = calculateDeductions(employee, earnings);

    // 5. Create payroll items
    await createPayrollItems(periodId, employee.id, {
      earnings,
      deductions
    });
  }

  // 6. Update period status
  period.status = PeriodStatus.PROCESSED;
  period.processed_at = new Date();
}
```

### 5. Lock Period
**Endpoint**: `POST /payroll/periods/:id/lock`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER

**Xususiyatlari**:
- Period PROCESSED statusda bo'lishi kerak
- Lock qilingandan keyin o'zgartirib bo'lmaydi
- Faqat unlock orqali ochiladi

### 6. Unlock Period
**Endpoint**: `POST /payroll/periods/:id/unlock`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER

**Xususiyatlari**:
- Period LOCKED statusda bo'lishi kerak
- Unlock qilib, qayta processing qilish mumkin

### 7. Get Period Items
**Endpoint**: `GET /payroll/periods/:periodId/items?page=1&limit=10&user_id=uuid`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN, HR_MANAGER

**Query Parametrlari**:
- `user_id`: Ma'lum xodim uchun filter (optional)
- `page`, `limit`: Pagination

**Response**:
```json
{
  "data": [
    {
      "item_id": "uuid",
      "employee": {
        "id": "user-uuid",
        "first_name": "John",
        "last_name": "Doe"
      },
      "type": "EARNING",
      "code": "SALARY",
      "name": "Base Salary",
      "amount": 5000000,
      "calculation_details": {
        "source": "ATTENDANCE"
      }
    }
  ],
  "total": 150
}
```

### 8. Create Payroll Item (Manual)
**Endpoint**: `POST /payroll/periods/:periodId/items`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Kirish ma'lumotlari**:
```json
{
  "user_id": "user-uuid",
  "type": "BONUS",
  "code": "PERFORMANCE_BONUS",
  "name": "Q4 Performance Bonus",
  "amount": 1000000,
  "description": "Quarterly performance bonus"
}
```

**Use case**: Qo'shimcha bonuslar, chegirmalar qo'shish

### 9. Get Period Summary
**Endpoint**: `GET /payroll/periods/:id/summary`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Response**:
```json
{
  "total_users": 50,
  "total_earnings": 250000000,
  "total_deductions": 50000000,
  "by_department": {
    "IT": {
      "total_earnings": 100000000,
      "user_count": 20
    },
    "Sales": {
      "total_earnings": 80000000,
      "user_count": 15
    }
  }
}
```

### 10. Export Period
**Endpoint**: `GET /payroll/periods/:id/export?format=xlsx`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Formats**:
- `xlsx`: Excel format
- `csv`: CSV format
- `pdf`: PDF format (payslips)

**Response**: File download

### 11. Import Work Volume Entries
**Endpoint**: `POST /payroll/work-volume/import`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**File format**: CSV, Excel
**Columns**: user_id, date, regular_hours, overtime_hours

### 12. Get User Payslip
**Endpoint**: `GET /payroll/payslip/:userId/:periodId`
**Ruxsatlar**: User (o'zi uchun), ADMIN (boshqalar uchun)

**Response**:
```json
{
  "user": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Doe",
    "position": "Developer"
  },
  "period": {
    "name": "January 2024",
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "items": [
    {
      "type": "EARNING",
      "name": "Base Salary",
      "amount": 5000000
    },
    {
      "type": "OVERTIME",
      "name": "Overtime Pay",
      "amount": 500000
    },
    {
      "type": "DEDUCTION",
      "name": "Income Tax",
      "amount": -550000
    }
  ],
  "summary": {
    "total_earnings": 5500000,
    "total_deductions": 550000,
    "net_pay": 4950000
  }
}
```

## Payroll Calculation

### Earning Calculation
```typescript
function calculateEarnings(employee: User, attendance: AttendanceRecord[]) {
  const earnings = [];

  if (employee.tariff_type === TariffType.SALARY) {
    // Monthly salary
    earnings.push({
      type: PayrollItemType.EARNING,
      code: 'SALARY',
      name: 'Base Salary',
      amount: employee.monthly_salary
    });
  } else {
    // Hourly rate
    const totalHours = attendance.reduce((sum, r) => sum + r.total_hours, 0);
    earnings.push({
      type: PayrollItemType.EARNING,
      code: 'HOURLY',
      name: 'Hourly Pay',
      quantity: totalHours,
      rate: employee.hourly_rate,
      amount: totalHours * employee.hourly_rate
    });
  }

  // Overtime
  const overtimeHours = attendance.reduce((sum, r) => sum + r.overtime_hours, 0);
  if (overtimeHours > 0) {
    const overtimeRate = employee.hourly_rate * company.payroll_settings.overtime_multiplier;
    earnings.push({
      type: PayrollItemType.OVERTIME,
      code: 'OVERTIME',
      name: 'Overtime Pay',
      quantity: overtimeHours,
      rate: overtimeRate,
      amount: overtimeHours * overtimeRate
    });
  }

  return earnings;
}
```

### Deduction Calculation
```typescript
function calculateDeductions(employee: User, totalEarnings: number) {
  const deductions = [];

  // Income tax (12% in Uzbekistan)
  const incomeTax = totalEarnings * 0.12;
  deductions.push({
    type: PayrollItemType.DEDUCTION,
    code: 'INCOME_TAX',
    name: 'Income Tax (12%)',
    amount: incomeTax
  });

  // Pension fund (1%)
  const pensionFund = totalEarnings * 0.01;
  deductions.push({
    type: PayrollItemType.DEDUCTION,
    code: 'PENSION',
    name: 'Pension Fund (1%)',
    amount: pensionFund
  });

  return deductions;
}
```

## Background Processing

### Payroll Queue
**Queue name**: `payroll`

**Jobs**:
1. **process-period**: Butun period'ni qayta ishlash
2. **calculate-user-payroll**: Bitta user uchun hisoblash
3. **generate-payslips**: Paysliplar yaratish
4. **export-report**: Hisobotlarni eksport qilish

**Processor**: `PayrollQueueProcessor`

**Benefits**:
- Long-running operations async
- Progress tracking
- Error retry
- Scalability

## Integration with Attendance

### Attendance Data Flow
```
Attendance Records
    ↓
Work Volume Calculation
    ↓
Payroll Processing
    ↓
Payroll Items
```

### Work Hours Calculation
```typescript
async function calculateWorkHours(userId: string, period: Period) {
  const records = await attendanceRepository.find({
    where: {
      user_id: userId,
      date: Between(period.start_date, period.end_date)
    }
  });

  const workVolume = {
    regular_hours: 0,
    overtime_hours: 0,
    total_hours: 0
  };

  for (const record of records) {
    workVolume.regular_hours += record.regular_hours || 0;
    workVolume.overtime_hours += record.overtime_hours || 0;
    workVolume.total_hours += record.total_hours || 0;
  }

  return workVolume;
}
```

## Best Practices

### 1. Period Management
- Har oy uchun yangi period yaratish
- Period yopilishidan oldin tekshirish
- Lock/Unlock ehtiyotkorlik bilan

### 2. Error Handling
- Processing xatolarini log qilish
- Failed items uchun retry mechanism
- User notification on errors

### 3. Audit Trail
- Barcha payroll operations loglanadi
- Manual adjustments tracked
- Approval workflow

### 4. Data Validation
- Amount validations (negative checks)
- Period overlap prevention
- Employee eligibility check

### 5. Security
- Payroll ma'lumotlari maxfiy
- Role-based access strict
- Audit logging har bir o'zgarish

## Future Enhancements

1. **Automatic Payroll**: Har oy avtomatik processing
2. **Multi-currency**: Turli valyutalar support
3. **Tax Calculation**: Advanced soliq hisoblash
4. **Payslip Email**: Avtomatik email yuborish
5. **Bank Integration**: To'g'ridan-to'g'ri bank transfer
6. **Deduction Rules**: Flexible chegirma qoidalari
7. **Bonus Schemes**: Performance-based bonus
8. **Leave Adjustment**: Tatil kunlari adjustment

## Testing

### Unit Tests
- Earning calculation
- Deduction calculation
- Overtime calculation
- Period status transitions

### Integration Tests
- Full payroll processing
- Export functionality
- Attendance integration

## Dependencies

### Internal
- Attendance module
- User module
- Company module

### External
- TypeORM
- Bull (queue)
- ExcelJS (export)
- PDFKit (payslips)
