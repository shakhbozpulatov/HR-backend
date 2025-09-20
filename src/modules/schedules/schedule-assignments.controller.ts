import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ScheduleAssignmentsService } from './schedule-assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/users/entities/user.entity';

@Controller('schedule-assignments')
@UseGuards(AuthGuard, RolesGuard)
export class ScheduleAssignmentsController {
  constructor(
    private readonly assignmentsService: ScheduleAssignmentsService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async createAssignment(@Body() createAssignmentDto: CreateAssignmentDto) {
    return await this.assignmentsService.createAssignment(createAssignmentDto);
  }

  @Get('employee/:employeeId')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  async getEmployeeAssignments(@Param('employeeId') employeeId: string) {
    return await this.assignmentsService.findEmployeeAssignments(employeeId);
  }

  @Post(':assignmentId/exceptions')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async addException(
    @Param('assignmentId') assignmentId: string,
    @Body() exception: any,
  ) {
    return await this.assignmentsService.addException(assignmentId, exception);
  }
}
