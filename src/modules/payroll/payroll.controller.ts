import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PayrollService } from './payroll.service';
import { CreatePeriodDto } from './dto/create-period.dto';
import { CreatePayrollItemDto } from './dto/create-payroll-item.dto';
import { PayrollFilterDto } from './dto/payroll-filter.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('payroll')
@UseGuards(AuthGuard, RolesGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('periods')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async createPeriod(@Body() createPeriodDto: CreatePeriodDto, @Req() req) {
    return await this.payrollService.createPeriod(
      createPeriodDto,
      req.user.user_id,
    );
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
  async processPeriod(@Param('id') id: string, @Req() req) {
    return await this.payrollService.processPeriod(id, req.user.user_id);
  }

  @Post('periods/:id/lock')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async lockPeriod(@Param('id') id: string, @Req() req) {
    return await this.payrollService.lockPeriod(id, req.user.user_id);
  }

  @Post('periods/:id/unlock')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async unlockPeriod(@Param('id') id: string, @Req() req) {
    return await this.payrollService.unlockPeriod(id, req.user.user_id);
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
    @Req() req,
  ) {
    return await this.payrollService.createPayrollItem(
      periodId,
      createItemDto,
      req.user.user_id,
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

  @Post('volume-entries/import')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.PAYROLL)
  @UseInterceptors(FileInterceptor('file'))
  async importVolumeEntries(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    return await this.payrollService.importVolumeEntries(
      file,
      req.user.user_id,
    );
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
    @Req() req,
  ) {
    // Employees can only access their own payslips
    if (
      req.user.role === UserRole.EMPLOYEE &&
      req.user.employee_id !== employeeId
    ) {
      throw new ForbiddenException('Access denied');
    }

    return await this.payrollService.getEmployeePayslip(employeeId, periodId);
  }
}
