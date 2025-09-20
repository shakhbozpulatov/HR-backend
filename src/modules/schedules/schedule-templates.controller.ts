import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async create(@Body() createTemplateDto: CreateScheduleTemplateDto) {
    return await this.templatesService.create(createTemplateDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  async findAll() {
    return await this.templatesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  async findOne(@Param('id') id: string) {
    return await this.templatesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async update(
    @Param('id') id: string,
    @Body() updateTemplateDto: Partial<CreateScheduleTemplateDto>,
  ) {
    return await this.templatesService.update(id, updateTemplateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async remove(@Param('id') id: string) {
    await this.templatesService.remove(id);
    return { message: 'Template deleted successfully' };
  }
}
