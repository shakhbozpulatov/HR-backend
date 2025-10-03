import { CompaniesService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateDepartmentDto } from './dto/create-company.dto';
import { CompanyStatus, SubscriptionPlan } from './entities/company.entity';
export declare class CompaniesController {
    private readonly companiesService;
    constructor(companiesService: CompaniesService);
    create(createCompanyDto: CreateCompanyDto): Promise<import("./entities/company.entity").Company>;
    findAll(status?: CompanyStatus): Promise<import("./entities/company.entity").Company[]>;
    findOne(id: string, req: any): Promise<import("./entities/company.entity").Company>;
    update(id: string, updateCompanyDto: UpdateCompanyDto, req: any): Promise<import("./entities/company.entity").Company>;
    suspend(id: string): Promise<import("./entities/company.entity").Company>;
    activate(id: string): Promise<import("./entities/company.entity").Company>;
    updateSubscription(id: string, subscriptionDto: {
        plan: SubscriptionPlan;
        start_date: string;
        end_date: string;
    }): Promise<import("./entities/company.entity").Company>;
    getStats(id: string, req: any): Promise<any>;
    createDepartment(companyId: string, createDepartmentDto: CreateDepartmentDto, req: any): Promise<import("./entities/department.entity").Department>;
    getDepartments(companyId: string, req: any): Promise<import("./entities/department.entity").Department[]>;
}
