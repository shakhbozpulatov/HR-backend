import { UserRole } from '@/modules/users/entities/user.entity';
import { IPermissionService } from '../interfaces/auth-services.interface';
export declare class PermissionService implements IPermissionService {
    private readonly userCreationPermissionMatrix;
    private readonly rolePermissionMap;
    validateUserCreationPermission(actorRole: UserRole, targetRole: UserRole): void;
    getUserPermissions(role: UserRole): string[];
    hasPermission(role: UserRole, permission: string): boolean;
    getCreatableRoles(actorRole: UserRole): UserRole[];
}
