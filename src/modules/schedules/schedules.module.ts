import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleTemplatesController } from './schedule-templates.controller';
import { ScheduleAssignmentsController } from './schedule-assignments.controller';
import { ScheduleTemplatesService } from './schedule-templates.service';
import { ScheduleAssignmentsService } from './schedule-assignments.service';
import { ScheduleTemplate } from './entities/schedule-template.entity';
import { UserScheduleAssignment } from './entities/employee-schedule-assignment.entity';
import { User } from '@/modules/users/entities/user.entity';
import { UsersModule } from '@/modules/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScheduleTemplate, UserScheduleAssignment, User]),
    UsersModule,
  ],
  controllers: [ScheduleTemplatesController, ScheduleAssignmentsController],
  providers: [ScheduleTemplatesService, ScheduleAssignmentsService],
  exports: [ScheduleTemplatesService, ScheduleAssignmentsService],
})
export class SchedulesModule {}
