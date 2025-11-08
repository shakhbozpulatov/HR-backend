import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '@/modules/company/entities/company.entity';
import { User, UserStatus } from '@/modules/users/entities/user.entity';
import { ICompanyService } from '../interfaces/auth-services.interface';

/**
 * Company Service (for Auth operations)
 *
 * Single Responsibility: Handle company-related operations in auth context
 * - Generate unique company codes
 * - Get company statistics
 *
 * Note: This is a lightweight service for auth-specific company operations
 * For full company management, use the Company module
 */
@Injectable()
export class CompanyService implements ICompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Generate a unique company code
   * Format: COM001, COM002, etc.
   */
  async generateUniqueCompanyCode(): Promise<string> {
    const lastCompany = await this.companyRepository
      .createQueryBuilder('company')
      .where('company.code LIKE :prefix', { prefix: 'COM%' })
      .orderBy('company.code', 'DESC')
      .getOne();

    if (!lastCompany) {
      return 'COM001';
    }

    const match = lastCompany.code.match(/COM(\d+)/);
    if (!match) {
      return 'COM001';
    }

    const lastNumber = parseInt(match[1], 10);
    const newNumber = lastNumber + 1;
    return `COM${newNumber.toString().padStart(3, '0')}`;
  }

  /**
   * Get company statistics
   */
  async getCompanyStatistics(companyId: string): Promise<{
    total_users: number;
    active_users: number;
    inactive_users: number;
  }> {
    // Total users
    const totalUsers = await this.userRepository.count({
      where: { company_id: companyId },
    });

    // Active users
    const activeUsers = await this.userRepository.count({
      where: {
        company_id: companyId,
        active: true,
        status: UserStatus.ACTIVE,
      },
    });

    return {
      total_users: totalUsers,
      active_users: activeUsers,
      inactive_users: totalUsers - activeUsers,
    };
  }
}
