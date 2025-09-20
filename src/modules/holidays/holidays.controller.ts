import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HolidaysService } from './holidays.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/users/entities/user.entity';

@Controller('holidays')
@UseGuards(AuthGuard, RolesGuard)
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async create(@Body() createHolidayDto: CreateHolidayDto) {
    return await this.holidaysService.create(createHolidayDto);
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  async findAll(
    @Query('year') year?: number,
    @Query('location') location?: string,
  ) {
    return await this.holidaysService.findAll(year, location);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  async findOne(@Param('id') id: string) {
    return await this.holidaysService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async update(
    @Param('id') id: string,
    @Body() updateHolidayDto: Partial<CreateHolidayDto>,
  ) {
    return await this.holidaysService.update(id, updateHolidayDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async remove(@Param('id') id: string) {
    await this.holidaysService.remove(id);
    return { message: 'Holiday deleted successfully' };
  }

  @Get('check/:date')
  @Roles(
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  )
  async checkHoliday(
    @Param('date') date: string,
    @Query('location') location?: string,
  ) {
    const isHoliday = await this.holidaysService.isHoliday(
      new Date(date),
      location,
    );
    return { date, isHoliday };
  }
}
