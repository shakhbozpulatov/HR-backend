// ============================================
// FILE: controllers/attendance-events.controller.ts
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
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';

import { AttendanceEventsService } from '@/modules/attendance';
import { WebhookEventDto, ResolveQuarantineDto } from '../dto';
import { GetEventsDto } from '../dto/fetch-attendance-events.dto';
import { HcAttendanceFetchService } from '../services/hc-attendance-fetch.service';
import { HcEventPollingService } from '../services/hc-event-polling.service';
import { AttendanceCronService } from '../cron/attendance-cron.service';

import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/modules/users/entities/user.entity';
import { HcApiResponse } from '@/modules/hc/interfaces/hc-api.interface';

@Controller('attendance/events')
@UseInterceptors(ClassSerializerInterceptor)
export class AttendanceEventsController {
  constructor(
    private readonly eventsService: AttendanceEventsService,
    private readonly hcAttendanceFetchService: HcAttendanceFetchService,
    private readonly pollingService: HcEventPollingService,
    private readonly cronService: AttendanceCronService,
  ) {}

  @Post('subscribe')
  async subscribe(@Body() subscribeType: number): Promise<HcApiResponse<any>> {
    return await this.eventsService.subscribeService(subscribeType);
  }

  /**
   * @deprecated This endpoint is deprecated. Events are now automatically polled in the background.
   * The HcEventPollingService continuously polls HC API every 0.5 seconds.
   */
  @Get('write-event')
  async writeEvent() {
    return {
      success: false,
      message:
        'This endpoint is deprecated. Events are now automatically polled in the background by HcEventPollingService.',
      info: 'The system polls HC API every 0.5 seconds automatically. No manual triggering is required.',
    };
  }

  /**
   * Get polling status
   * Returns current polling status and configuration
   */
  @Get('polling-status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getPollingStatus() {
    const status = this.pollingService.getStatus();

    return {
      success: true,
      data: status,
      message: status.isPolling
        ? 'Polling is active'
        : 'Polling is currently stopped',
    };
  }

  /**
   * Get attendance events grouped by employees
   * Returns attendance data for each employee with all dates in the given range
   * Each employee includes daily attendance records with start and end times
   *
   * @param dto - Query parameters (startTime, endTime, page, limit, userId)
   * @returns Object with employees array and pagination metadata
   * @example
   * Response format:
   * {
   *   employees: [{
   *     id: "user-uuid",
   *     name: "John Doe",
   *     personCode: "HC123",
   *     phone: "+998901234567",
   *     attendance: [
   *       { date: "2025-01-01", startTime: "09:00", endTime: "18:00" },
   *       { date: "2025-01-02", startTime: null, endTime: null }
   *     ]
   *   }],
   *   pagination: { page: 1, limit: 20, total: 100, totalPages: 5 }
   * }
   */
  @Get('get-events')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async getEvents(@Query() dto: GetEventsDto) {
    return await this.eventsService.getEvents(dto);
  }

  /**
   * Export attendance events to Excel
   * Downloads Excel file with attendance data for all employees or specific user
   *
   * @param dto - Query parameters (startTime, endTime, userId)
   * @param res - Express response object for setting headers
   * @returns Excel file download
   * @example
   * GET /attendance/events/export-excel?startTime=2025-11-14T00:00:00.000Z&endTime=2025-11-20T20:00:00.000Z&userId=645164122568532992
   */
  @Get('export-excel')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async exportToExcel(@Query() dto: GetEventsDto, @Res() res: Response) {
    const buffer = await this.eventsService.exportToExcel(dto);

    // Generate filename with date range
    const startDate = dto.startTime
      ? new Date(dto.startTime).toISOString().split('T')[0]
      : 'last-7-days';
    const endDate = dto.endTime
      ? new Date(dto.endTime).toISOString().split('T')[0]
      : 'now';
    const filename = `attendance-report_${startDate}_to_${endDate}.xlsx`;

    // Set response headers for file download
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  /**
   * Receive webhook event from biometric device
   * PUBLIC endpoint - no authentication required
   * Rate limited: 100 requests per minute
   */
  @Post()
  @Public()
  @Throttle({ short: { limit: 100, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  async receiveWebhookEvent(@Body(ValidationPipe) eventData: WebhookEventDto) {
    const event = await this.eventsService.processWebhookEvent(eventData);

    return {
      success: true,
      data: event,
      message: event.user_id
        ? 'Event processed successfully'
        : 'Event quarantined - unknown user',
    };
  }

  /**
   * Get attendance events with filters
   * Requires authentication and appropriate role
   */
  // @Get()
  // @UseGuards(AuthGuard, RolesGuard)
  // @Roles(
  //   UserRole.SUPER_ADMIN,
  //   UserRole.COMPANY_OWNER,
  //   UserRole.ADMIN,
  //   UserRole.HR_MANAGER,
  //   UserRole.MANAGER,
  // )
  // async getEvents(@Query(ValidationPipe) filterDto: AttendanceFilterDto) {
  //   return await this.eventsService.findAll(filterDto);
  // }

  /**
   * Get quarantined events
   * Events without mapped user_id
   */
  @Get('quarantine')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async getQuarantinedEvents() {
    const events = await this.eventsService.getQuarantinedEvents();

    return {
      success: true,
      data: events,
      total: events.length,
    };
  }

  /**
   * Resolve quarantined event
   * Assign user_id to event and optionally create mapping
   */
  @Post('quarantine/:eventId/resolve')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  @HttpCode(HttpStatus.OK)
  async resolveQuarantinedEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body(ValidationPipe) resolveDto: ResolveQuarantineDto,
    @CurrentUser('user_id') actorId: string,
  ) {
    const event = await this.eventsService.resolveQuarantinedEvent(
      eventId,
      resolveDto,
      actorId,
    );

    return {
      success: true,
      data: event,
      message: 'Event resolved and mapped successfully',
    };
  }

  /**
   * Retry failed events
   * Re-queue failed events for processing
   */
  @Post('retry-failed')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async retryFailedEvents() {
    await this.eventsService.retryFailedEvents();

    return {
      success: true,
      message: 'Failed events queued for retry',
    };
  }

  /**
   * Clean up all failed jobs from queue
   * Removes all failed jobs from the attendance queue
   * ADMIN ONLY - Use with caution
   */
  @Post('cleanup-failed-jobs')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async cleanupFailedJobs() {
    const count = await this.cronService.cleanupAllFailedJobs();

    return {
      success: true,
      message: `Successfully cleaned up ${count} failed jobs`,
      data: {
        cleanedCount: count,
      },
    };
  }

  /**
   * Get user attendance by user_id
   * Returns all clock in/out events for a specific user with optional date filters
   */
  @Get('user/:userId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async getUserAttendance(
    @Param('userId') userId: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    const data = await this.eventsService.getUserAttendance(
      userId,
      startTime,
      endTime,
    );

    return {
      success: true,
      data,
    };
  }

  /**
   * Get event by ID
   */
  @Get(':eventId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async getEventById(@Param('eventId', ParseUUIDPipe) eventId: string) {
    const event = await this.eventsService.findOne(eventId);

    return {
      success: true,
      data: event,
    };
  }
}
