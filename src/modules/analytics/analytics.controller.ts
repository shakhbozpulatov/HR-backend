import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/users/entities/user.entity';

@Controller('analytics')
@UseGuards(AuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('attendance')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  async getAttendanceMetrics(@Query() filterDto: AnalyticsFilterDto) {
    return await this.analyticsService.getAttendanceMetrics(filterDto);
  }

  @Get('payroll')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL)
  async getPayrollMetrics(@Query() filterDto: AnalyticsFilterDto) {
    return await this.analyticsService.getPayrollMetrics(filterDto);
  }

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.MANAGER)
  async getDashboardSummary(@Query() filterDto: AnalyticsFilterDto) {
    return await this.analyticsService.getDashboardSummary(filterDto);
  }
}
