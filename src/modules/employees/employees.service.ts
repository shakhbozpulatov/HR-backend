import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Employee, EmployeeStatus } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeFilterDto } from './dto/employee-filter.dto';
import { TerminalIntegrationService } from '../terminals/terminal-integration.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private terminalIntegrationService: TerminalIntegrationService,
    private auditService: AuditService,
  ) {}

  async create(
    createEmployeeDto: CreateEmployeeDto,
    actorId: string,
  ): Promise<Employee> {
    // Check if code already exists
    const existingEmployee = await this.employeeRepository.findOne({
      where: { code: createEmployeeDto.code },
    });

    if (existingEmployee) {
      throw new BadRequestException('Employee code already exists');
    }

    const employee = this.employeeRepository.create(createEmployeeDto);
    const savedEmployee = await this.employeeRepository.save(employee);

    // Create terminal user if employee is active
    if (savedEmployee.status === EmployeeStatus.ACTIVE) {
      try {
        const terminalUserId =
          await this.terminalIntegrationService.createTerminalUser({
            display_name: `${savedEmployee.first_name} ${savedEmployee.last_name}`,
            terminal_user_external_id: savedEmployee.employee_id,
          });

        savedEmployee.terminal_user_id = terminalUserId;
        await this.employeeRepository.save(savedEmployee);
      } catch (error) {
        console.error('Failed to create terminal user:', error);
        // Continue without failing - will be retried later
      }
    }

    await this.auditService.log(
      actorId,
      'CREATE',
      'Employee',
      savedEmployee.employee_id,
      null,
      savedEmployee,
    );

    return savedEmployee;
  }

  async findAll(
    filterDto: EmployeeFilterDto,
  ): Promise<{ data: Employee[]; total: number }> {
    const { page = 1, limit = 10, status, department, location } = filterDto;

    const queryBuilder = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.manager', 'manager');

    if (status) {
      queryBuilder.andWhere('employee.status = :status', { status });
    }

    if (department) {
      queryBuilder.andWhere('employee.department = :department', {
        department,
      });
    }

    if (location) {
      queryBuilder.andWhere('employee.location = :location', { location });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { employee_id: id },
      relations: [
        'manager',
        'schedule_assignments',
        'schedule_assignments.default_template',
      ],
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async update(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
    actorId: string,
  ): Promise<Employee> {
    const employee = await this.findOne(id);
    const beforeUpdate = { ...employee };

    Object.assign(employee, updateEmployeeDto);
    const updatedEmployee = await this.employeeRepository.save(employee);

    await this.auditService.log(
      actorId,
      'UPDATE',
      'Employee',
      id,
      beforeUpdate,
      updatedEmployee,
    );

    return updatedEmployee;
  }

  async remove(id: string, actorId: string): Promise<void> {
    const employee = await this.findOne(id);

    // Archive instead of delete
    employee.status = EmployeeStatus.INACTIVE;
    employee.end_date = new Date();

    await this.employeeRepository.save(employee);
    await this.auditService.log(
      actorId,
      'ARCHIVE',
      'Employee',
      id,
      null,
      employee,
    );
  }

  async bulkImport(
    employees: CreateEmployeeDto[],
    actorId: string,
  ): Promise<{ success: number; errors: any[] }> {
    const results = { success: 0, errors: [] };

    for (const employeeData of employees) {
      try {
        await this.create(employeeData, actorId);
        results.success++;
      } catch (error) {
        results.errors.push({
          data: employeeData,
          error: error.message,
        });
      }
    }

    return results;
  }

  async getTerminalStatus(
    id: string,
  ): Promise<{ linked: boolean; last_attendance?: Date; pending: boolean }> {
    const employee = await this.findOne(id);

    if (!employee.terminal_user_id) {
      return { linked: false, pending: true };
    }

    // Get last attendance event
    const lastEvent = await this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoin('employee.attendance_events', 'event')
      .select('MAX(event.ts_local)', 'last_attendance')
      .where('employee.employee_id = :id', { id })
      .getRawOne();

    return {
      linked: true,
      pending: false,
      last_attendance: lastEvent?.last_attendance,
    };
  }
}
