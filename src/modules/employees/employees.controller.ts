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
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeFilterDto } from './dto/employee-filter.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import * as XLSX from 'xlsx';

@Controller('employees')
@UseGuards(AuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async create(@Body() createEmployeeDto: CreateEmployeeDto, @Req() req) {
    return await this.employeesService.create(
      createEmployeeDto,
      req.user.user_id,
    );
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.PAYROLL,
    UserRole.MANAGER,
  )
  async findAll(@Query() filterDto: EmployeeFilterDto) {
    return await this.employeesService.findAll(filterDto);
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.PAYROLL,
    UserRole.MANAGER,
  )
  async findOne(@Param('id') id: string) {
    return await this.employeesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @Req() req,
  ) {
    return await this.employeesService.update(
      id,
      updateEmployeeDto,
      req.user.user_id,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async remove(@Param('id') id: string, @Req() req) {
    await this.employeesService.remove(id, req.user.user_id);
    return { message: 'Employee archived successfully' };
  }

  @Post('import')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  async bulkImport(@UploadedFile() file: Express.Multer.File, @Req() req) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Transform data to match CreateEmployeeDto
    const employees = data.map((row: any) => ({
      code: row.code || row.Code,
      first_name: row.first_name || row['First Name'],
      last_name: row.last_name || row['Last Name'],
      middle_name: row.middle_name || row['Middle Name'],
      email: row.email || row.Email,
      phone: row.phone || row.Phone,
      department: row.department || row.Department,
      location: row.location || row.Location,
      position: row.position || row.Position,
      start_date: new Date(row.start_date || row['Start Date']),
      tariff_type: row.tariff_type || row['Tariff Type'],
      hourly_rate: row.hourly_rate || row['Hourly Rate'],
      monthly_salary: row.monthly_salary || row['Monthly Salary'],
    }));

    return await this.employeesService.bulkImport(employees, req.user.user_id);
  }

  @Get(':id/terminal-status')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async getTerminalStatus(@Param('id') id: string) {
    return await this.employeesService.getTerminalStatus(id);
  }
}
