import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AttendanceRecordsService } from './attendance-records.service';
import { AttendanceFilterDto } from './dto/attendance-filter.dto';
import { ManualAdjustmentDto } from './dto/manual-adjustment.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('attendance')
export class AttendanceRecordsController {
  constructor(private readonly recordsService: AttendanceRecordsService) {}

  @Get('records')
  @UseGuards(AuthGuard, RolesGuard)
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
  @UseGuards(AuthGuard, RolesGuard)
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
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async createAdjustment(
    @Param('employeeId') employeeId: string,
    @Param('date') date: string,
    @Body() adjustmentDto: ManualAdjustmentDto,
    @Req() req,
  ) {
    return await this.recordsService.createManualAdjustment(
      employeeId,
      new Date(date),
      adjustmentDto,
      req.user.user_id,
    );
  }

  @Post('records/:employeeId/:date/approve')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  async approveRecord(
    @Param('employeeId') employeeId: string,
    @Param('date') date: string,
    @Req() req,
  ) {
    return await this.recordsService.approveRecord(
      employeeId,
      new Date(date),
      req.user.user_id,
    );
  }

  @Post('records/:employeeId/:date/reprocess')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async reprocessRecord(
    @Param('employeeId') employeeId: string,
    @Param('date') date: string,
  ) {
    return await this.recordsService.reprocessRecord(
      employeeId,
      new Date(date),
    );
  }

  @Get('timesheet')
  @UseGuards(AuthGuard, RolesGuard)
  async getTimesheet(@Query() filterDto: AttendanceFilterDto, @Req() req) {
    // If regular employee, only show their own timesheet
    if (req.user.role === UserRole.EMPLOYEE) {
      filterDto.employee_id = req.user.employee_id;
    }

    return await this.recordsService.getTimesheetGrid(filterDto);
  }

  @Get('export')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.PAYROLL,
    UserRole.MANAGER,
  )
  async exportAttendance(@Query() filterDto: AttendanceFilterDto) {
    return await this.recordsService.exportToExcel(filterDto);
  }
}
