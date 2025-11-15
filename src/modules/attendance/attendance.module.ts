// Copy from attendance_queue_module artifact:
// - AttendanceModule class (lines 150-250 approx)

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';

// Entities
import { AttendanceEvent } from '@/modules/attendance/entities';
import { AttendanceRecord } from '@/modules/attendance/entities';
import { UserDeviceMapping } from '@/modules/attendance/entities';
import { AttendanceProcessingLog } from '@/modules/attendance/entities';
import { User } from '@/modules/users/entities/user.entity';
import { TerminalDevice } from '@/modules/terminals/entities/terminal-device.entity';
import { UserScheduleAssignment } from '@/modules/schedules/entities/employee-schedule-assignment.entity';

// Services
import { AttendanceEventsService } from './services/attendance-events.service';
import { AttendanceRecordsService } from './services/attendance-records.service';
import { AttendanceProcessorService } from './services/attendance-processor.service';
import { UserDeviceMappingService } from './services/user-device-mapping.service';
import { HcAttendanceFetchService } from './services/hc-attendance-fetch.service';

// Controllers
import { AttendanceEventsController } from '@/modules/attendance/controllers';
import { AttendanceRecordsController } from '@/modules/attendance/controllers';
import { DeviceEnrollmentController } from '@/modules/attendance/controllers';
import { DeviceStatusController } from '@/modules/attendance/controllers';
import { BatchProcessingController } from '@/modules/attendance/controllers';

// Processors & Cron
import { AttendanceQueueProcessor } from './processors/attendance-queue.processor';
import { AttendanceCronService } from './cron/attendance-cron.service';

// Other modules
import { SchedulesModule } from '../schedules/schedules.module';
import { HolidaysModule } from '../holidays/holidays.module';
import { HcService } from '@/modules/hc/hc.service';
import { HcApiClient } from '@/modules/hc/services/hc-api-client.service';
import { HcApiConfig } from '@/modules/hc/config/hc-api.config';
import { HcAuthService } from '@/modules/hc/services/hc-auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttendanceEvent,
      AttendanceRecord,
      UserDeviceMapping,
      AttendanceProcessingLog,
      User,
      TerminalDevice,
      UserScheduleAssignment,
    ]),
    BullModule.registerQueue({
      name: 'attendance',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 60 seconds (in milliseconds)
        limit: 100, // 100 requests per 60 seconds
      },
      {
        name: 'medium',
        ttl: 600000, // 10 minutes
        limit: 500,
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hour
        limit: 1000,
      },
    ]),
    SchedulesModule,
    HolidaysModule,
  ],
  controllers: [
    AttendanceEventsController,
    AttendanceRecordsController,
    DeviceEnrollmentController,
    DeviceStatusController,
    BatchProcessingController,
  ],
  providers: [
    AttendanceEventsService,
    AttendanceRecordsService,
    AttendanceProcessorService,
    UserDeviceMappingService,
    HcAttendanceFetchService,
    HcAuthService,
    AttendanceQueueProcessor,
    AttendanceCronService,
    HcService,
    HcApiClient,
    HcApiConfig,
  ],
  exports: [
    AttendanceEventsService,
    AttendanceRecordsService,
    AttendanceProcessorService,
    UserDeviceMappingService,
  ],
})
export class AttendanceModule {}
