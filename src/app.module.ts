import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { CommonModule } from '@/common/common.module';

import { DatabaseConfig } from '@/config/database.config';
import { validationSchema } from '@/config/validation.schema';

// Modules
import { AuthModule } from '@/modules/auth/auth.module';
import { SchedulesModule } from '@/modules/schedules/schedules.module';
import { AttendanceModule } from '@/modules/attendance/attendance.module';
import { PayrollModule } from '@/modules/payroll/payroll.module';
import { TerminalsModule } from '@/modules/terminals/terminals.module';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';
import { HolidaysModule } from '@/modules/holidays/holidays.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { UsersModule } from '@/modules/users/users.module';
import { CompanyModule } from './modules/company/company.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '24h' },
    }),

    // Feature modules
    AuthModule,
    SchedulesModule,
    AttendanceModule,
    PayrollModule,
    TerminalsModule,
    AnalyticsModule,
    HolidaysModule,
    AuditModule,
    UsersModule,
    CommonModule,
    CompanyModule,
  ],
})
export class AppModule {}
