import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  Headers,
  UnauthorizedException,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { AttendanceEventsService } from './attendance-events.service';
import { WebhookEventDto } from './dto/webhook-event.dto';
import { AttendanceFilterDto } from './dto/attendance-filter.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../users/entities/user.entity';
import { WebhookGuard } from '../../common/guards/webhook.guard';
import { CryptoUtils } from '../../common/utils/crypto.utils';

@Controller('terminals')
export class AttendanceEventsController {
  constructor(
    private readonly eventsService: AttendanceEventsService,
    private readonly cryptoUtils: CryptoUtils,
  ) {}

  @Post('events')
  @Public()
  @UseGuards(WebhookGuard)
  async receiveWebhookEvent(
    @Body() webhookEventDto: WebhookEventDto,
    @Headers('x-signature') signature: string,
    @Headers('x-idempotency-key') idempotencyKey: string,
  ) {
    // Additional signature validation if needed
    // The WebhookGuard handles the basic validation

    return await this.eventsService.processWebhookEvent(
      webhookEventDto,
      idempotencyKey,
    );
  }

  @Post('device-status')
  @Public()
  @UseGuards(WebhookGuard)
  async receiveDeviceStatus(
    @Body() statusDto: { device_id: string; status: string; timestamp: string },
  ) {
    return await this.eventsService.updateDeviceStatus(statusDto);
  }

  @Get('events')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  async getEvents(@Query() filterDto: AttendanceFilterDto) {
    return await this.eventsService.findAll(filterDto);
  }

  @Get('quarantine')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async getQuarantinedEvents() {
    return await this.eventsService.getQuarantinedEvents();
  }

  @Post('quarantine/:eventId/resolve')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async resolveQuarantinedEvent(
    @Param('eventId') eventId: string,
    @Body() resolveDto: { employee_id: string },
    @Req() req,
  ) {
    return await this.eventsService.resolveQuarantinedEvent(
      eventId,
      resolveDto.employee_id,
      req.user.user_id,
    );
  }
}
