import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { AttendanceEventsService } from './attendance-events.service';
import { AttendanceFilterDto } from './dto/attendance-filter.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { UserRole } from '@/modules/users/entities/user.entity';

@Controller('terminals')
export class AttendanceEventsController {
  constructor(private readonly eventsService: AttendanceEventsService) {}

  @Post('events')
  @Public()
  async receiveWebhookEvent(
    @Body() eventData: any,
    @Headers('x-idempotency-key') idempotencyKey: string,
  ) {
    return await this.eventsService.processWebhookEvent(
      eventData,
      idempotencyKey,
    );
  }

  @Post('device-status')
  @Public()
  async receiveDeviceStatus(@Body() statusData: any) {
    return await this.eventsService.updateDeviceStatus(statusData);
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
    @Body() resolveDto: { user_id: string },
  ) {
    return await this.eventsService.resolveQuarantinedEvent(
      eventId,
      resolveDto.user_id,
      'admin',
    );
  }
}
