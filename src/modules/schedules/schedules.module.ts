import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleTemplatesController } from './schedule-templates.controller';
import { ScheduleAssignmentsController } from './schedule-assignments.controller';
import { ScheduleTemplatesService } from './schedule-templates.service';
import { ScheduleAssignmentsService } from './schedule-assignments.service';
import { ScheduleTemplate } from './entities/schedule-template.entity';
import { UserScheduleAssignment } from './entities/employee-schedule-assignment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScheduleTemplate, UserScheduleAssignment]),
  ],
  controllers: [ScheduleTemplatesController, ScheduleAssignmentsController],
  providers: [ScheduleTemplatesService, ScheduleAssignmentsService],
  exports: [ScheduleTemplatesService, ScheduleAssignmentsService],
})
export class SchedulesModule {}
