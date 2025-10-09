// Copy from attendance_queue_module artifact:
// - AttendanceModule class (lines 150-250 approx)

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';

// Entities
import { AttendanceEvent } from './entities/attendance-event.entity';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { UserDeviceMapping } from './entities/user-device-mapping.entity';
import { AttendanceProcessingLog } from './entities/attendance-processing-log.entity';

// Services
import { AttendanceEventsService } from './services/attendance-events.service';
import { AttendanceRecordsService } from './services/attendance-records.service';
import { AttendanceProcessorService } from './services/attendance-processor.service';
import { UserDeviceMappingService } from './services/user-device-mapping.service';

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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttendanceEvent,
      AttendanceRecord,
      UserDeviceMapping,
      AttendanceProcessingLog,
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
    AttendanceQueueProcessor,
    AttendanceCronService,
  ],
  exports: [
    AttendanceEventsService,
    AttendanceRecordsService,
    AttendanceProcessorService,
    UserDeviceMappingService,
  ],
})
export class AttendanceModule {}
