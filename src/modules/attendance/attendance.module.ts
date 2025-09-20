import { Module } from '@nestjs/common';
import { AttendanceProcessorService } from './attendance-processor.service';
import { AttendanceEventsController } from './attendance-events.controller';

@Module({
  controllers: [AttendanceEventsController],
  providers: [AttendanceProcessorService],
})
export class AttendanceModule {}
