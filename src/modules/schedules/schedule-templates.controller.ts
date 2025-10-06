import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ScheduleTemplatesService } from './schedule-templates.service';
import { CreateScheduleTemplateDto } from './dto/create-schedule-template.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/users/entities/user.entity';

@Controller('schedule-templates')
@UseGuards(AuthGuard, RolesGuard)
export class ScheduleTemplatesController {
  constructor(private readonly templatesService: ScheduleTemplatesService) {}

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async create(
    @Body() createTemplateDto: CreateScheduleTemplateDto,
    @Req() req,
  ) {
    return await this.templatesService.create(createTemplateDto, req.user);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
  )
  async findAll(@Req() req) {
    return await this.templatesService.findAll(req.user);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
  )
  async findOne(@Param('id') id: string, @Req() req) {
    return await this.templatesService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async update(
    @Param('id') id: string,
    @Body() updateTemplateDto: Partial<CreateScheduleTemplateDto>,
    @Req() req,
  ) {
    return await this.templatesService.update(id, updateTemplateDto, req.user);
  }

  @Delete(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async remove(@Param('id') id: string, @Req() req) {
    await this.templatesService.remove(id, req.user);
    return { message: 'Template deleted successfully' };
  }
}
