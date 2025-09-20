import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { CreatePeriodDto } from './dto/create-period.dto';
import { CreatePayrollItemDto } from './dto/create-payroll-item.dto';
import { PayrollFilterDto } from './dto/payroll-filter.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/users/entities/user.entity';

@Controller('payroll')
@UseGuards(AuthGuard, RolesGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('periods')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async createPeriod(@Body() createPeriodDto: CreatePeriodDto) {
    return await this.payrollService.createPeriod(createPeriodDto, 'admin');
  }

  @Get('periods')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL)
  async getPeriods(@Query() filterDto: PayrollFilterDto) {
    return await this.payrollService.findAllPeriods(filterDto);
  }

  @Get('periods/:id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL)
  async getPeriod(@Param('id') id: string) {
    return await this.payrollService.findOnePeriod(id);
  }

  @Post('periods/:id/process')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async processPeriod(@Param('id') id: string) {
    return await this.payrollService.processPeriod(id, 'admin');
  }

  @Post('periods/:id/lock')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async lockPeriod(@Param('id') id: string) {
    return await this.payrollService.lockPeriod(id, 'admin');
  }

  @Get('periods/:id/items')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL)
  async getPeriodItems(
    @Param('id') id: string,
    @Query() filterDto: PayrollFilterDto,
  ) {
    return await this.payrollService.findPeriodItems(id, filterDto);
  }

  @Post('periods/:id/items')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL)
  async createPeriodItem(
    @Param('id') periodId: string,
    @Body() createItemDto: CreatePayrollItemDto,
  ) {
    return await this.payrollService.createPayrollItem(
      periodId,
      createItemDto,
      'admin',
    );
  }

  @Get('periods/:id/summary')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL)
  async getPeriodSummary(@Param('id') id: string) {
    return await this.payrollService.getPeriodSummary(id);
  }

  @Post('periods/:id/export')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL)
  async exportPeriod(
    @Param('id') id: string,
    @Query('format') format: string = 'xlsx',
  ) {
    return await this.payrollService.exportPeriod(id, format);
  }

  @Get('employee/:employeeId/payslip/:periodId')
  @Roles(
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.PAYROLL,
    UserRole.EMPLOYEE,
  )
  async getPayslip(
    @Param('employeeId') employeeId: string,
    @Param('periodId') periodId: string,
  ) {
    return await this.payrollService.getEmployeePayslip(employeeId, periodId);
  }
}
