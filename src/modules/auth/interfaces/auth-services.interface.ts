import { User, UserRole } from '@/modules/users/entities/user.entity';

/**
 * Interface Segregation Principle (ISP)
 * Small, focused interfaces instead of one large interface
 */

/**
 * Password Service Interface
 * Responsible for password-related operations
 */
export interface IPasswordService {
  hashPassword(password: string): string;
  comparePassword(plainPassword: string, hashedPassword: string): boolean;
  generateTemporaryPassword(): string;
}

/**
 * Permission Service Interface
 * Responsible for role-based permission validation
 */
export interface IPermissionService {
  validateUserCreationPermission(
    actorRole: UserRole,
    targetRole: UserRole,
  ): void;
  getUserPermissions(role: UserRole): string[];
}

/**
 * Company Service Interface (for auth operations)
 * Responsible for company-related operations in auth context
 */
export interface ICompanyService {
  generateUniqueCompanyCode(): Promise<string>;
  getCompanyStatistics(companyId: string): Promise<{
    total_users: number;
    active_users: number;
    inactive_users: number;
  }>;
}
