import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee, EmployeeStatus } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeFilterDto } from './dto/employee-filter.dto';
import { UserRole } from '@/modules/users/entities/user.entity';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async create(
    createEmployeeDto: CreateEmployeeDto,
    companyId: string,
  ): Promise<Employee> {
    const existingEmployee = await this.employeeRepository.findOne({
      where: {
        email: createEmployeeDto.email,
        company_id: companyId,
      },
    });

    if (existingEmployee) {
      throw new BadRequestException(
        'Employee email already exists in this company',
      );
    }

    const employee = this.employeeRepository.create({
      ...createEmployeeDto,
      company_id: companyId,
    });
    return await this.employeeRepository.save(employee);
  }

  async findAll(
    filterDto: EmployeeFilterDto,
    companyId: string,
    userRole: UserRole,
  ): Promise<{ data: Employee[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      status,
      department,
      location,
      search,
    } = filterDto;

    const queryBuilder = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.manager', 'manager')
      .leftJoinAndSelect('employee.company', 'company');

    // SUPER_ADMIN can see all companies, others only their company
    if (userRole !== UserRole.SUPER_ADMIN) {
      queryBuilder.andWhere('employee.company_id = :companyId', { companyId });
    }

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

    if (search) {
      queryBuilder.andWhere(
        '(employee.first_name ILIKE :search OR employee.last_name ILIKE :search OR employee.code ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id },
      relations: ['manager'],
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async update(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const employee = await this.findOne(id);
    Object.assign(employee, updateEmployeeDto);
    return await this.employeeRepository.save(employee);
  }

  async remove(id: string): Promise<void> {
    const employee = await this.findOne(id);
    employee.status = EmployeeStatus.INACTIVE;
    employee.end_date = new Date();
    await this.employeeRepository.save(employee);
  }
}
