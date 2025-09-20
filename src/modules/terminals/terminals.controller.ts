import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { TerminalsService } from './terminals.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/users/entities/user.entity';
import { DeviceStatus } from './entities/terminal-device.entity';

@Controller('terminals')
@UseGuards(AuthGuard, RolesGuard)
export class TerminalsController {
  constructor(private readonly terminalsService: TerminalsService) {}

  @Get('devices')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async getAllDevices() {
    return await this.terminalsService.findAll();
  }

  @Get('devices/:id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async getDevice(@Param('id') id: string) {
    return await this.terminalsService.findOne(id);
  }

  @Post('devices')
  @Roles(UserRole.ADMIN)
  async createDevice(@Body() deviceData: any) {
    return await this.terminalsService.create(deviceData);
  }

  @Patch('devices/:id/status')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async updateDeviceStatus(
    @Param('id') id: string,
    @Body() statusData: { status: DeviceStatus },
  ) {
    return await this.terminalsService.updateStatus(id, statusData.status);
  }
}
