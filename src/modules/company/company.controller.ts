import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { CompaniesService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateDepartmentDto } from './dto/create-company.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/users/entities/user.entity';
import { CompanyStatus, SubscriptionPlan } from './entities/company.entity';

@Controller('companies')
@UseGuards(AuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  async create(@Body() createCompanyDto: CreateCompanyDto) {
    return await this.companiesService.create(createCompanyDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  async findAll(@Query('status') status?: CompanyStatus) {
    return await this.companiesService.findAll(status);
  }

  @Get('departments')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
    UserRole.MANAGER,
  )
  async getDepartments(@Req() req) {
    // Agar super admin bo‘lsa, query orqali boshqa company_id yuborish imkoniyati qoldiramiz
    const companyId =
      req.user.role === UserRole.SUPER_ADMIN
        ? req.query.company_id || req.user.company_id
        : req.user.company_id;

    return await this.companiesService.getDepartments(companyId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_OWNER, UserRole.ADMIN)
  async findOne(@Param('id') id: string, @Req() req) {
    // Check if user has access to this company
    if (req.user.role !== UserRole.SUPER_ADMIN && req.user.company_id !== id) {
      throw new ForbiddenException('Access denied');
    }
    return await this.companiesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_OWNER)
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Req() req,
  ) {
    if (req.user.role !== UserRole.SUPER_ADMIN && req.user.company_id !== id) {
      throw new ForbiddenException('Access denied');
    }
    return await this.companiesService.update(id, updateCompanyDto);
  }

  @Post('status/:id')
  @Roles(UserRole.SUPER_ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: CompanyStatus,
  ) {
    return await this.companiesService.updateStatus(id, status);
  }

  @Post('subscription/:id')
  @Roles(UserRole.SUPER_ADMIN)
  async updateSubscription(
    @Param('id') id: string,
    @Body()
    subscriptionDto: {
      plan: SubscriptionPlan;
      start_date: string;
      end_date: string;
    },
  ) {
    return await this.companiesService.updateSubscription(
      id,
      subscriptionDto.plan,
      new Date(subscriptionDto.start_date),
      new Date(subscriptionDto.end_date),
    );
  }

  @Get('stats/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_OWNER, UserRole.ADMIN)
  async getStats(@Param('id') id: string, @Req() req) {
    if (req.user.role !== UserRole.SUPER_ADMIN && req.user.company_id !== id) {
      throw new ForbiddenException('Access denied');
    }
    return await this.companiesService.getCompanyStats(id);
  }

  // Department endpoints
  @Post('department')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async createDepartment(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @Req() req,
  ) {
    const companyId =
      req.user.role === UserRole.SUPER_ADMIN
        ? createDepartmentDto.company_id // super admin xohlasa boshqa company uchun ham yaratadi
        : req.user.company_id; // boshqalar faqat o'z company’si uchun

    return await this.companiesService.createDepartment(
      companyId,
      createDepartmentDto,
    );
  }
}
