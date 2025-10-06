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
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/modules/users/entities/user.entity';
import { CreateTerminalDto } from './dto/create-terminal.dto';
import { UpdateTerminalStatusDto } from './dto/update-terminal-status.dto';

@Controller('terminals')
@UseGuards(AuthGuard, RolesGuard)
export class TerminalsController {
  constructor(private readonly terminalsService: TerminalsService) {}

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async getAllDevices(@CurrentUser() user: any) {
    const companyId =
      user.role === UserRole.SUPER_ADMIN ? undefined : user.company_id;
    return await this.terminalsService.findAll(companyId);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async getDevice(@Param('id') id: string, @CurrentUser() user: any) {
    const companyId =
      user.role === UserRole.SUPER_ADMIN ? undefined : user.company_id;
    return await this.terminalsService.findOne(id, companyId);
  }

  @Post('')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_OWNER, UserRole.ADMIN)
  async createDevice(
    @Body() deviceData: CreateTerminalDto,
    @CurrentUser() user: any,
  ) {
    const companyId = deviceData.company_id || user.company_id;
    return await this.terminalsService.create(deviceData, companyId);
  }

  @Patch(':id/status')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async updateDeviceStatus(
    @Param('id') id: string,
    @Body() statusData: UpdateTerminalStatusDto,
    @CurrentUser() user: any,
  ) {
    const companyId =
      user.role === UserRole.SUPER_ADMIN ? undefined : user.company_id;
    return await this.terminalsService.updateStatus(
      id,
      statusData.status,
      companyId,
    );
  }
}
