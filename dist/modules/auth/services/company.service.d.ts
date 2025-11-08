import { Repository } from 'typeorm';
import { Company } from '@/modules/company/entities/company.entity';
import { User } from '@/modules/users/entities/user.entity';
import { ICompanyService } from '../interfaces/auth-services.interface';
export declare class CompanyService implements ICompanyService {
    private readonly companyRepository;
    private readonly userRepository;
    constructor(companyRepository: Repository<Company>, userRepository: Repository<User>);
    generateUniqueCompanyCode(): Promise<string>;
    getCompanyStatistics(companyId: string): Promise<{
        total_users: number;
        active_users: number;
        inactive_users: number;
    }>;
}
