import { UserRole } from '@/modules/users/entities/user.entity';
export interface IPasswordService {
    hashPassword(password: string): string;
    comparePassword(plainPassword: string, hashedPassword: string): boolean;
    generateTemporaryPassword(): string;
}
export interface IPermissionService {
    validateUserCreationPermission(actorRole: UserRole, targetRole: UserRole): void;
    getUserPermissions(role: UserRole): string[];
}
export interface ICompanyService {
    generateUniqueCompanyCode(): Promise<string>;
    getCompanyStatistics(companyId: string): Promise<{
        total_users: number;
        active_users: number;
        inactive_users: number;
    }>;
}
