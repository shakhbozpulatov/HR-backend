import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceEventsController } from './attendance-events.controller';
import { AttendanceRecordsController } from './attendance-records.controller';
import { AttendanceEventsService } from './attendance-events.service';
import { AttendanceRecordsService } from './attendance-records.service';
import { AttendanceEvent } from './entities/attendance-event.entity';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { CryptoUtils } from '@/common/utils/crypto.utils';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceEvent, AttendanceRecord])],
  controllers: [AttendanceEventsController, AttendanceRecordsController],
  providers: [AttendanceEventsService, AttendanceRecordsService, CryptoUtils],
  exports: [AttendanceEventsService, AttendanceRecordsService],
})
export class AttendanceModule {}
