import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AttendanceRecord } from '@/modules/attendance/entities/attendance-record.entity';
import { PayrollItem } from '@/modules/payroll/entities/payroll-item.entity';
import { Employee } from '@/modules/employees/entities/employee.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AttendanceRecord, PayrollItem, Employee]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
