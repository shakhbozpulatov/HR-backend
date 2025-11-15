import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ScheduleAssignmentsService } from './schedule-assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { BulkUpdateAssignmentDto } from './dto/bulk-update-assignment.dto';
import { BulkDeleteAssignmentDto } from './dto/bulk-delete-assignment.dto';
import { CreateExceptionDto } from './dto/create-exception.dto';
import { DeleteExceptionDto } from './dto/delete-exception.dto';
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

  // @Patch('update-user-assignment')
  // @Roles(
  //   UserRole.SUPER_ADMIN,
  //   UserRole.COMPANY_OWNER,
  //   UserRole.ADMIN,
  //   UserRole.HR_MANAGER,
  // )
  // async updateTemplate(
  //   @Body() updateTemplateDto: UpdateUserAssignmentDto,
  //   @Req() req,
  // ) {
  //   return await this.assignmentsService.updateTemplate(
  //     updateTemplateDto,
  //     req.user,
  //   );
  // }

  @Patch('update-user-assignment')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async bulkUpdateTemplate(
    @Body() bulkUpdateDto: BulkUpdateAssignmentDto,
    @Req() req,
  ) {
    return await this.assignmentsService.bulkUpdateTemplate(
      bulkUpdateDto,
      req.user,
    );
  }

  @Delete('delete-user-assignment')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async bulkDeleteAssignments(
    @Body() bulkDeleteDto: BulkDeleteAssignmentDto,
    @Req() req,
  ) {
    return await this.assignmentsService.bulkDeleteAssignments(
      bulkDeleteDto,
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

  @Delete(':assignmentId/exceptions')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async deleteException(
    @Param('assignmentId') assignmentId: string,
    @Body() exception: DeleteExceptionDto,
    @Req() req,
  ) {
    return await this.assignmentsService.deleteException(
      assignmentId,
      exception,
      req.user,
    );
  }
}
