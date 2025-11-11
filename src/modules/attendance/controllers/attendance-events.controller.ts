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
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { AttendanceEventsService } from '@/modules/attendance';
import {
  AttendanceFilterDto,
  WebhookEventDto,
  ResolveQuarantineDto,
} from '../dto';

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
  constructor(private readonly eventsService: AttendanceEventsService) {}

  @Post('subscribe')
  async subscribe(@Body() subscribeType: number): Promise<HcApiResponse<any>> {
    return await this.eventsService.subscribeService(subscribeType);
  }

  @Get('get-events')
  async getEvents(@Query('maxNumberPerTime') maxNumberPerTime: number) {
    return await this.eventsService.getAllEvents(maxNumberPerTime);
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
