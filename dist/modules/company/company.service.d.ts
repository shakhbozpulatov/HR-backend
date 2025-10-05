import { Repository } from 'typeorm';
import { Company, CompanyStatus, SubscriptionPlan } from './entities/company.entity';
import { Department } from './entities/department.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateDepartmentDto } from './dto/create-company.dto';
export declare class CompaniesService {
    private companyRepository;
    private departmentRepository;
    constructor(companyRepository: Repository<Company>, departmentRepository: Repository<Department>);
    create(createCompanyDto: CreateCompanyDto): Promise<Company>;
    findAll(status?: CompanyStatus): Promise<Company[]>;
    findOne(id: string): Promise<Company>;
    update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<Company>;
    updateStatus(id: string, status: CompanyStatus): Promise<Company>;
    updateSubscription(id: string, plan: SubscriptionPlan, startDate: Date, endDate: Date): Promise<Company>;
    getCompanyStats(companyId: string): Promise<any>;
    private createDefaultDepartments;
    createDepartment(companyId: string, createDepartmentDto: CreateDepartmentDto): Promise<Department>;
    getDepartments(companyId: string): Promise<Department[]>;
    updateDepartment(departmentId: string, updateDto: Partial<CreateDepartmentDto>): Promise<Department>;
}
