import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Company,
  CompanyStatus,
  SubscriptionPlan,
} from './entities/company.entity';
import { Department } from './entities/department.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateDepartmentDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    // Check if company code or tax_id already exists
    const existingCompany = await this.companyRepository.findOne({
      where: [
        { code: createCompanyDto.code },
        { tax_id: createCompanyDto.tax_id },
      ],
    });

    if (existingCompany) {
      throw new BadRequestException('Company code or tax ID already exists');
    }

    const company = this.companyRepository.create({
      ...createCompanyDto,
      settings: {
        timezone: createCompanyDto.timezone || 'Asia/Tashkent',
        currency: createCompanyDto.currency || 'UZS',
        date_format: 'YYYY-MM-DD',
        time_format: '24h',
        week_start: 'Monday',
        fiscal_year_start: '01-01',
        default_language: 'uz',
      },
      payroll_settings: {
        overtime_multiplier: 1.5,
        grace_in_minutes: 5,
        grace_out_minutes: 0,
        rounding_minutes: 5,
        overtime_threshold_minutes: 15,
      },
    });

    const savedCompany = await this.companyRepository.save(company);

    // Create default departments
    await this.createDefaultDepartments(savedCompany.company_id);

    return savedCompany;
  }

  async findAll(status?: CompanyStatus): Promise<Company[]> {
    const query = this.companyRepository.createQueryBuilder('company');

    if (status) {
      query.where('company.status = :status', { status });
    }

    return await query
      .leftJoinAndSelect('company.departments', 'departments')
      .orderBy('company.name', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { company_id: id },
      relations: ['departments', 'employees', 'users'],
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    const company = await this.findOne(id);
    Object.assign(company, updateCompanyDto);
    return await this.companyRepository.save(company);
  }

  async suspend(id: string): Promise<Company> {
    const company = await this.findOne(id);
    company.status = CompanyStatus.SUSPENDED;
    return await this.companyRepository.save(company);
  }

  async activate(id: string): Promise<Company> {
    const company = await this.findOne(id);
    company.status = CompanyStatus.ACTIVE;
    return await this.companyRepository.save(company);
  }

  async updateSubscription(
    id: string,
    plan: SubscriptionPlan,
    startDate: Date,
    endDate: Date,
  ): Promise<Company> {
    const company = await this.findOne(id);

    company.subscription_plan = plan;
    company.subscription_start_date = startDate;
    company.subscription_end_date = endDate;

    // Set max employees based on plan
    switch (plan) {
      case SubscriptionPlan.FREE:
        company.max_employees = 10;
        break;
      case SubscriptionPlan.BASIC:
        company.max_employees = 50;
        break;
      case SubscriptionPlan.PROFESSIONAL:
        company.max_employees = 200;
        break;
      case SubscriptionPlan.ENTERPRISE:
        company.max_employees = 9999;
        break;
    }

    return await this.companyRepository.save(company);
  }

  async getCompanyStats(companyId: string): Promise<any> {
    const company = await this.findOne(companyId);

    const stats = await this.companyRepository
      .createQueryBuilder('company')
      .leftJoin('company.employees', 'employee')
      .leftJoin('company.users', 'user')
      .leftJoin('company.departments', 'department')
      .select([
        'COUNT(DISTINCT employee.employee_id) as total_employees',
        'COUNT(DISTINCT CASE WHEN employee.status = :active THEN employee.employee_id END) as active_employees',
        'COUNT(DISTINCT user.user_id) as total_users',
        'COUNT(DISTINCT department.department_id) as total_departments',
      ])
      .where('company.company_id = :companyId', { companyId })
      .setParameter('active', 'active')
      .getRawOne();

    return {
      company: {
        id: company.company_id,
        name: company.name,
        status: company.status,
        subscription_plan: company.subscription_plan,
        max_employees: company.max_employees,
      },
      stats: {
        total_employees: parseInt(stats.total_employees) || 0,
        active_employees: parseInt(stats.active_employees) || 0,
        total_users: parseInt(stats.total_users) || 0,
        total_departments: parseInt(stats.total_departments) || 0,
        employees_remaining:
          company.max_employees - (parseInt(stats.total_employees) || 0),
      },
    };
  }

  private async createDefaultDepartments(companyId: string): Promise<void> {
    const defaultDepartments = [
      { code: 'ADMIN', name: 'Administration' },
      { code: 'HR', name: 'Human Resources' },
      { code: 'IT', name: 'Information Technology' },
      { code: 'FIN', name: 'Finance' },
      { code: 'OPS', name: 'Operations' },
    ];

    for (const dept of defaultDepartments) {
      const department = this.departmentRepository.create({
        company_id: companyId,
        ...dept,
      });
      await this.departmentRepository.save(department);
    }
  }

  // Department methods
  async createDepartment(
    companyId: string,
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<Department> {
    const company = await this.findOne(companyId);

    const department = this.departmentRepository.create({
      ...createDepartmentDto,
      company_id: companyId,
    });

    return await this.departmentRepository.save(department);
  }

  async getDepartments(companyId: string): Promise<Department[]> {
    return await this.departmentRepository.find({
      where: { company_id: companyId, active: true },
      relations: ['parent_department', 'sub_departments', 'employees'],
      order: { name: 'ASC' },
    });
  }

  async updateDepartment(
    departmentId: string,
    updateDto: Partial<CreateDepartmentDto>,
  ): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { department_id: departmentId },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    Object.assign(department, updateDto);
    return await this.departmentRepository.save(department);
  }
}
