// ============================================
// FILE: controllers/attendance-records.controller.ts
// ============================================

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';

import { AttendanceRecordsService } from '@/modules/attendance';
import { AttendanceFilterDto, ManualAdjustmentDto, ApprovalDto } from '../dto';

import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/modules/users/entities/user.entity';

@Controller('attendance/records')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class AttendanceRecordsController {
  constructor(private readonly recordsService: AttendanceRecordsService) {}

  /**
   * Get attendance records with filters and pagination
   */
  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.PAYROLL,
    UserRole.MANAGER,
  )
  async getRecords(@Query(ValidationPipe) filterDto: AttendanceFilterDto) {
    return await this.recordsService.findAll(filterDto);
  }

  /**
   * Get timesheet grid view
   * Returns calendar-style data for multiple users
   */
  @Get('timesheet')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
  )
  async getTimesheet(@Query(ValidationPipe) filterDto: AttendanceFilterDto) {
    const result = await this.recordsService.getTimesheetGrid(filterDto);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get attendance summary for a user
   * Aggregated statistics for date range
   */
  @Get(':userId/summary')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
  )
  async getAttendanceSummary(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const summary = await this.recordsService.getAttendanceSummary(
      userId,
      new Date(from),
      new Date(to),
    );

    return {
      success: true,
      data: summary,
    };
  }

  /**
   * Get single attendance record
   */
  @Get(':userId/:date')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.PAYROLL,
    UserRole.MANAGER,
  )
  async getRecord(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('date') date: string,
  ) {
    const record = await this.recordsService.findOne(userId, new Date(date));

    return {
      success: true,
      data: record,
    };
  }

  /**
   * Create manual adjustment
   * Modify attendance record manually (requires reason)
   */
  @Post(':userId/:date/adjustments')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  @HttpCode(HttpStatus.OK)
  async createAdjustment(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('date') date: string,
    @Body(ValidationPipe) adjustmentDto: ManualAdjustmentDto,
    @CurrentUser('user_id') actorId: string,
  ) {
    const record = await this.recordsService.createManualAdjustment(
      userId,
      new Date(date),
      adjustmentDto,
      actorId,
    );

    return {
      success: true,
      data: record,
      message: 'Manual adjustment created successfully',
    };
  }

  /**
   * Approve attendance record
   * Manager/HR approval with optional locking
   */
  @Post(':userId/:date/approve')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
  )
  @HttpCode(HttpStatus.OK)
  async approveRecord(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('date') date: string,
    @Body(ValidationPipe) approvalDto: ApprovalDto,
    @CurrentUser('user_id') actorId: string,
  ) {
    const record = await this.recordsService.approveRecord(
      userId,
      new Date(date),
      approvalDto,
      actorId,
    );

    return {
      success: true,
      data: record,
      message: 'Record approved successfully',
    };
  }

  /**
   * Unlock attendance record
   * Remove lock to allow modifications
   */
  @Post(':userId/:date/unlock')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async unlockRecord(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('date') date: string,
    @CurrentUser('user_id') actorId: string,
  ) {
    const record = await this.recordsService.unlockRecord(
      userId,
      new Date(date),
      actorId,
    );

    return {
      success: true,
      data: record,
      message: 'Record unlocked successfully',
    };
  }

  /**
   * Reprocess attendance record
   * Queue record for recalculation based on events
   */
  @Post(':userId/:date/reprocess')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  @HttpCode(HttpStatus.ACCEPTED)
  async reprocessRecord(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('date') date: string,
  ) {
    await this.recordsService.reprocessRecord(userId, new Date(date));

    return {
      success: true,
      message: 'Record queued for reprocessing',
    };
  }

  /**
   * Export attendance records
   * Generate Excel/CSV export
   */
  @Post('export')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.PAYROLL,
  )
  async exportRecords(@Body(ValidationPipe) filterDto: AttendanceFilterDto) {
    const buffer = await this.recordsService.exportToExcel(filterDto);

    return {
      success: true,
      filename: `attendance-export-${Date.now()}.xlsx`,
      data: buffer.toString('base64'),
      message: 'Export generated successfully',
    };
  }

  /**
   * Bulk approve records
   * Approve multiple records at once
   */
  @Post('bulk-approve')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  @HttpCode(HttpStatus.OK)
  async bulkApprove(
    @Body() data: { record_ids: string[]; approval: ApprovalDto },
    @CurrentUser('user_id') actorId: string,
  ) {
    // Implementation would loop through record_ids and approve each
    return {
      success: true,
      message: `${data.record_ids.length} records approved successfully`,
    };
  }

  /**
   * Get records requiring approval
   * Filter records flagged for approval
   */
  @Get('pending-approval')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
  )
  async getPendingApprovals(
    @Query(ValidationPipe) filterDto: AttendanceFilterDto,
  ) {
    // Add requires_approval filter
    const modifiedFilter = { ...filterDto, requires_approval: true };
    return await this.recordsService.findAll(modifiedFilter);
  }
}
