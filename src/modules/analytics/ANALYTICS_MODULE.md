# Analytics Module Documentation

## Umumiy Ma'lumot
Analytics moduli tizimning turli ma'lumotlarini tahlil qilish, statistika va hisobotlar yaratish uchun mas'ul. Bu modul attendance va payroll ma'lumotlariga asoslangan keng qamrovli analytics API'larni taqdim etadi.

## Arxitektura

### Module Tuzilmasi
```
analytics/
├── dto/
│   └── analytics-filter.dto.ts      # Filtrlash parametrlari
├── analytics.controller.ts          # HTTP controller
├── analytics.service.ts             # Business logic
└── analytics.module.ts              # Module konfiguratsiyasi
```

## Analytics Filter DTO

### Parametrlar
```typescript
{
  start_date: Date                   // Boshlanish sanasi
  end_date: Date                     // Tugash sanasi
  department?: string                // Bo'lim filter (optional)
  location?: string                  // Joylashuv filter (optional)
  user_id?: string                   // Muayyan xodim (optional)
  company_id?: string                // Kompaniya (SUPER_ADMIN uchun)
}
```

## Asosiy Funksiyonallik

### 1. Attendance Metrics
**Endpoint**: `GET /analytics/attendance`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN, HR_MANAGER

**Query Parameters**:
```
?start_date=2024-11-01&end_date=2024-11-30&department=IT
```

**Response**:
```json
{
  "attendance_rate": 92.5,
  "total_records": 440,
  "ok_records": 407,
  "lateness_by_user": [
    {
      "user_id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "department": "IT",
      "late_count": 5,
      "total_late_minutes": 87
    }
  ],
  "overtime_by_department": [
    {
      "department": "IT",
      "total_overtime_minutes": 2400,
      "overtime_days": 45
    }
  ]
}
```

**Calculation Logic**:
```typescript
async getAttendanceMetrics(filterDto: AnalyticsFilterDto) {
  // 1. Total records in period
  const totalRecords = await attendanceRepository.count({
    where: {
      date: Between(start_date, end_date),
      user: { department }
    }
  });

  // 2. OK status records
  const okRecords = await attendanceRepository.count({
    where: {
      date: Between(start_date, end_date),
      status: AttendanceStatus.OK,
      user: { department }
    }
  });

  // 3. Attendance rate
  const attendanceRate = (okRecords / totalRecords) * 100;

  // 4. Lateness by user
  const latenessData = await attendanceRepository
    .createQueryBuilder('record')
    .select([
      'user.id',
      'user.first_name',
      'user.last_name',
      'user.department',
      'COUNT(record.record_id) as late_count',
      'SUM(record.late_minutes) as total_late_minutes'
    ])
    .where('record.late_minutes > 0')
    .groupBy('user.id')
    .getRawMany();

  // 5. Overtime by department
  const overtimeData = await attendanceRepository
    .createQueryBuilder('record')
    .select([
      'user.department',
      'SUM(record.overtime_minutes) as total_overtime_minutes',
      'COUNT(CASE WHEN record.overtime_minutes > 0 THEN 1 END) as overtime_days'
    ])
    .groupBy('user.department')
    .getRawMany();

  return {
    attendance_rate: attendanceRate,
    total_records: totalRecords,
    ok_records: okRecords,
    lateness_by_user: latenessData,
    overtime_by_department: overtimeData
  };
}
```

### 2. Payroll Metrics
**Endpoint**: `GET /analytics/payroll`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Query Parameters**:
```
?start_date=2024-01-01&end_date=2024-12-31&department=IT
```

**Response**:
```json
{
  "total_cost": 600000000,
  "overtime_cost": 45000000,
  "cost_by_department": [
    {
      "department": "IT",
      "total_cost": 250000000,
      "user_count": 25
    },
    {
      "department": "Sales",
      "total_cost": 180000000,
      "user_count": 18
    }
  ],
  "monthly_trend": [
    {
      "month": "2024-01-01",
      "total_cost": 50000000
    },
    {
      "month": "2024-02-01",
      "total_cost": 52000000
    }
  ]
}
```

**Calculation Logic**:
```typescript
async getPayrollMetrics(filterDto: AnalyticsFilterDto) {
  // 1. Total payroll cost
  const totalCost = await payrollItemRepository
    .createQueryBuilder('item')
    .select('SUM(item.amount)', 'total')
    .where('item.type = :type', { type: PayrollItemType.EARNING })
    .andWhere('period.start_date >= :start_date', { start_date })
    .andWhere('period.end_date <= :end_date', { end_date })
    .getRawOne();

  // 2. Overtime cost
  const overtimeCost = await payrollItemRepository
    .createQueryBuilder('item')
    .select('SUM(item.amount)', 'total')
    .where('item.code = :code', { code: 'OVERTIME' })
    .getRawOne();

  // 3. Cost by department
  const costByDepartment = await payrollItemRepository
    .createQueryBuilder('item')
    .leftJoin('item.employee', 'user')
    .select([
      'user.department',
      'SUM(item.amount) as total_cost',
      'COUNT(DISTINCT user.id) as user_count'
    ])
    .where('item.type = :type', { type: PayrollItemType.EARNING })
    .groupBy('user.department')
    .getRawMany();

  // 4. Monthly trend
  const monthlyTrend = await payrollItemRepository
    .createQueryBuilder('item')
    .leftJoin('item.period', 'period')
    .select([
      "DATE_TRUNC('month', period.start_date) as month",
      'SUM(item.amount) as total_cost'
    ])
    .where('item.type = :type', { type: PayrollItemType.EARNING })
    .groupBy("DATE_TRUNC('month', period.start_date)")
    .orderBy('month', 'ASC')
    .getRawMany();

  return {
    total_cost: totalCost?.total || 0,
    overtime_cost: overtimeCost?.total || 0,
    cost_by_department: costByDepartment,
    monthly_trend: monthlyTrend
  };
}
```

### 3. Dashboard Summary
**Endpoint**: `GET /analytics/dashboard`
**Ruxsatlar**: Barcha rollar

**Query Parameters**:
```
?start_date=2024-11-01&end_date=2024-11-30
```

**Response**:
```json
{
  "active_users": 50,
  "attendance_rate": 92.5,
  "total_payroll_cost": 250000000,
  "overtime_cost": 18000000,
  "top_late_users": [
    {
      "user_id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "total_late_minutes": 120
    }
  ],
  "payroll_trend": [
    {
      "month": "2024-10-01",
      "total_cost": 48000000
    },
    {
      "month": "2024-11-01",
      "total_cost": 50000000
    }
  ]
}
```

**Use case**: Admin dashboard uchun summary ko'rsatkichlar

### 4. Export Analytics
**Endpoint**: `GET /analytics/export?format=xlsx`
**Ruxsatlar**: SUPER_ADMIN, COMPANY_OWNER, ADMIN

**Formats**:
- `csv`: CSV format
- `xlsx`: Excel format

**Export Content**:
1. **Summary Sheet**: Umumiy ko'rsatkichlar
2. **Lateness Details**: Har bir xodim uchun kechikish
3. **Overtime by Department**: Bo'limlar bo'yicha overtime
4. **Cost by Department**: Bo'limlar bo'yicha xarajat
5. **Monthly Trend**: Oylik trend

**Excel Generation Logic**:
```typescript
private generateExcel(data: any): Buffer {
  const XLSX = require('xlsx');
  const workbook = XLSX.utils.book_new();

  // 1. Summary sheet
  const summaryData = [
    ['Metric', 'Value'],
    ['Attendance Rate', `${data.summary.attendance_rate.toFixed(2)}%`],
    ['Total Payroll Cost', data.summary.total_payroll_cost],
    ['Overtime Cost', data.summary.overtime_cost]
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // 2. Lateness sheet
  const latenessData = [
    ['Employee ID', 'First Name', 'Last Name', 'Department', 'Late Count', 'Total Late Minutes'],
    ...data.lateness_details.map((emp: any) => [
      emp.user_id,
      emp.first_name,
      emp.last_name,
      emp.department,
      emp.late_count,
      emp.total_late_minutes
    ])
  ];
  const latenessSheet = XLSX.utils.aoa_to_sheet(latenessData);
  XLSX.utils.book_append_sheet(workbook, latenessSheet, 'Lateness');

  // 3. Overtime sheet
  // 4. Cost sheet
  // 5. Trend sheet

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
```

**CSV Generation Logic**:
```typescript
private generateCsv(data: any): string {
  const csvRows = [];

  // Summary section
  csvRows.push('SUMMARY');
  csvRows.push(`Attendance Rate,${data.summary.attendance_rate.toFixed(2)}%`);
  csvRows.push(`Total Payroll Cost,${data.summary.total_payroll_cost}`);
  csvRows.push(`Overtime Cost,${data.summary.overtime_cost}`);
  csvRows.push('');

  // Lateness details
  csvRows.push('LATENESS BY EMPLOYEE');
  csvRows.push('Employee ID,First Name,Last Name,Department,Late Count,Total Late Minutes');
  data.lateness_details.forEach((emp: any) => {
    csvRows.push(
      `${emp.user_id},${emp.first_name},${emp.last_name},${emp.department},${emp.late_count},${emp.total_late_minutes}`
    );
  });

  return csvRows.join('\n');
}
```

## Key Metrics

### Attendance Metrics
1. **Attendance Rate**: (OK records / Total records) * 100
2. **Lateness Count**: Late days per employee
3. **Average Late Minutes**: Total late minutes / Late days
4. **Overtime Hours**: Total overtime per department
5. **Absence Rate**: (Absent days / Total days) * 100

### Payroll Metrics
1. **Total Payroll Cost**: Sum of all earnings
2. **Overtime Cost**: Sum of overtime pay
3. **Cost per Employee**: Total cost / Employee count
4. **Cost by Department**: Department-wise breakdown
5. **Monthly Trend**: Month-over-month comparison

### Performance Indicators (KPIs)
1. **On-time Arrival Rate**: % of punctual arrivals
2. **Overtime Ratio**: Overtime hours / Regular hours
3. **Payroll-to-Revenue Ratio**: (if revenue data available)
4. **Department Efficiency**: Cost per department vs output
5. **Employee Productivity**: Work hours vs output

## Data Visualization

### Chart Types
1. **Line Chart**: Monthly payroll trend
2. **Bar Chart**: Cost by department
3. **Pie Chart**: Attendance status distribution
4. **Scatter Plot**: Lateness patterns
5. **Heat Map**: Department attendance matrix

### Example Data for Charts
```json
{
  "monthly_trend": {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May"],
    "datasets": [
      {
        "label": "Payroll Cost",
        "data": [50000000, 52000000, 51000000, 53000000, 54000000]
      }
    ]
  },
  "department_breakdown": {
    "labels": ["IT", "Sales", "HR", "Finance"],
    "datasets": [
      {
        "label": "Cost",
        "data": [250000000, 180000000, 80000000, 90000000]
      }
    ]
  }
}
```

## Filtering & Aggregation

### Date Range Filters
- Daily
- Weekly
- Monthly
- Quarterly
- Yearly
- Custom range

### Department Filters
- Specific department
- Multiple departments
- All departments

### User Filters
- Individual user
- User group
- All users

### Location Filters
- Specific location
- Multiple locations
- All locations

## Caching Strategy

### Cache Keys
```typescript
const cacheKey = `analytics:${metric}:${company_id}:${start_date}:${end_date}:${department}`;
```

### TTL (Time to Live)
- Real-time metrics: 5 minutes
- Daily aggregates: 1 hour
- Monthly reports: 24 hours

### Cache Invalidation
- On new attendance record
- On payroll processing
- Manual cache clear

## Performance Optimization

### Database Indexes
```sql
CREATE INDEX idx_attendance_date_user ON attendance_records(date, user_id);
CREATE INDEX idx_attendance_company_date ON attendance_records(company_id, date);
CREATE INDEX idx_payroll_period_type ON payroll_items(period_id, type);
```

### Query Optimization
- Use aggregation at database level
- Limit result sets
- Pagination for large datasets
- Materialized views for complex queries

### Async Processing
- Heavy analytics via queue
- Background report generation
- Scheduled data aggregation

## Best Practices

### 1. Data Accuracy
- Validate date ranges
- Handle edge cases (weekends, holidays)
- Consistent timezone handling

### 2. Security
- Role-based data access
- Company data isolation
- Sensitive data masking

### 3. Scalability
- Efficient queries
- Database indexing
- Caching strategy
- Pagination

### 4. User Experience
- Fast response times
- Progressive loading
- Export functionality
- Visual representations

## Future Enhancements

1. **Predictive Analytics**: ML-based forecasting
2. **Real-time Dashboards**: Live data updates
3. **Custom Reports**: User-defined metrics
4. **Benchmarking**: Industry comparisons
5. **Alert System**: Anomaly detection
6. **Mobile Analytics**: Mobile-optimized views
7. **Advanced Visualizations**: Interactive charts
8. **Data Export API**: Programmatic access

## Testing

### Unit Tests
- Metric calculations
- Filter logic
- Aggregation accuracy
- Edge case handling

### Integration Tests
- End-to-end analytics flow
- Export functionality
- Performance benchmarks

## Dependencies

### Internal
- Attendance module
- Payroll module
- User module
- Company module

### External
- TypeORM (database queries)
- XLSX (Excel export)
- Chart.js / D3.js (frontend visualization)

## Environment Variables
```env
ANALYTICS_CACHE_TTL=3600
ANALYTICS_MAX_DATE_RANGE=365
```
