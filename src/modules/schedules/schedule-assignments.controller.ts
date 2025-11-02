import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ScheduleAssignmentsService } from './schedule-assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateUserAssignmentDto } from './dto/update-user-assignment.dto';
import { CreateExceptionDto } from './dto/create-exception.dto';
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
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async createAssignment(
    @Body() createAssignmentDto: CreateAssignmentDto,
    @Req() req,
  ) {
    return await this.assignmentsService.createAssignment(
      createAssignmentDto,
      req.user,
    );
  }

  @Get('user/:userId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
  )
  async getEmployeeAssignments(@Param('userId') userId: string, @Req() req) {
    return await this.assignmentsService.findEmployeeAssignments(
      userId,
      req.user,
    );
  }

  @Patch('update-user-assignment')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async updateTemplate(
    @Body() updateTemplateDto: UpdateUserAssignmentDto,
    @Req() req,
  ) {
    return await this.assignmentsService.updateTemplate(
      updateTemplateDto,
      req.user,
    );
  }

  @Post(':assignmentId/exceptions')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async addException(
    @Param('assignmentId') assignmentId: string,
    @Body() exception: CreateExceptionDto,
    @Req() req,
  ) {
    return await this.assignmentsService.addException(
      assignmentId,
      exception,
      req.user,
    );
  }
}
