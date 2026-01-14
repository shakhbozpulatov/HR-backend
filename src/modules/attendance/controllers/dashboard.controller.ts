// ============================================
// FILE: controllers/dashboard.controller.ts
// Dashboard endpoints for attendance statistics
// ============================================

import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  ValidationPipe,
} from '@nestjs/common';

import { DashboardService } from '../services/dashboard.service';
import {
  DashboardStatisticsDto,
  AttendanceStatsDto,
  ExceptionsDto,
} from '../dto/dashboard.dto';

import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/users/entities/user.entity';

@Controller('attendance/dashboard')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /attendance/dashboard/statistics
   * Get dashboard statistics for a specific date
   * Returns: total employees, expected today, checked in, on-time arrivals
   */
  @Get('statistics')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
  )
  async getDashboardStatistics(
    @Query(ValidationPipe) dto: DashboardStatisticsDto,
  ) {
    return await this.dashboardService.getDashboardStatistics(dto);
  }

  /**
   * GET /attendance/dashboard/attendance-stats
   * Get check-in and check-out statistics for a period (1m, 3m, 6m)
   * Returns: check-in and check-out statistics grouped by date
   */
  @Get('attendance-stats')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
  )
  async getAttendanceStats(@Query(ValidationPipe) dto: AttendanceStatsDto) {
    return await this.dashboardService.getAttendanceStats(dto);
  }

  /**
   * GET /attendance/dashboard/exceptions
   * Get employees who are not coming today or tomorrow (exceptions/leaves)
   * Returns: list of employees with exception details
   */
  @Get('exceptions')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
  )
  async getExceptions(@Query(ValidationPipe) dto: ExceptionsDto) {
    return await this.dashboardService.getExceptions(dto);
  }
}
