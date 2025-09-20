import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AttendanceRecordsService } from './attendance-records.service';
import { AttendanceFilterDto } from './dto/attendance-filter.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/users/entities/user.entity';

@Controller('attendance')
@UseGuards(AuthGuard, RolesGuard)
export class AttendanceRecordsController {
  constructor(private readonly recordsService: AttendanceRecordsService) {}

  @Get('records')
  @Roles(
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.PAYROLL,
    UserRole.MANAGER,
  )
  async getRecords(@Query() filterDto: AttendanceFilterDto) {
    return await this.recordsService.findAll(filterDto);
  }

  @Get('records/:employeeId/:date')
  @Roles(
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.PAYROLL,
    UserRole.MANAGER,
  )
  async getRecord(
    @Param('employeeId') employeeId: string,
    @Param('date') date: string,
  ) {
    return await this.recordsService.findOne(employeeId, new Date(date));
  }

  @Post('records/:employeeId/:date/adjustments')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async createAdjustment(
    @Param('employeeId') employeeId: string,
    @Param('date') date: string,
    @Body() adjustment: any,
  ) {
    return await this.recordsService.createManualAdjustment(
      employeeId,
      new Date(date),
      adjustment,
      'admin',
    );
  }

  @Post('records/:employeeId/:date/approve')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  async approveRecord(
    @Param('employeeId') employeeId: string,
    @Param('date') date: string,
  ) {
    return await this.recordsService.approveRecord(
      employeeId,
      new Date(date),
      'admin',
    );
  }

  @Get('timesheet')
  async getTimesheet(@Query() filterDto: AttendanceFilterDto) {
    return await this.recordsService.getTimesheetGrid(filterDto);
  }
}
