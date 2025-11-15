import { Injectable, BadRequestException } from '@nestjs/common';
import { UserRole } from '@/modules/users/entities/user.entity';
import { IPermissionService } from '../interfaces/auth-services.interface';

/**
 * Permission Service
 *
 * Single Responsibility: Handle role-based permissions
 * - Validate user creation permissions based on role hierarchy
 * - Get permissions for each role
 *
 * Open/Closed: Easy to extend with new roles/permissions without modifying existing code
 */
@Injectable()
export class PermissionService implements IPermissionService {
  /**
   * Permission matrix for user creation
   * Defines which roles can create which other roles
   */
  private readonly userCreationPermissionMatrix = {
    [UserRole.SUPER_ADMIN]: [
      UserRole.SUPER_ADMIN,
      UserRole.COMPANY_OWNER,
      UserRole.ADMIN,
      UserRole.HR_MANAGER,
      UserRole.PAYROLL,
      UserRole.MANAGER,
      UserRole.EMPLOYEE,
    ],
    [UserRole.COMPANY_OWNER]: [
      UserRole.ADMIN,
      UserRole.HR_MANAGER,
      UserRole.PAYROLL,
      UserRole.MANAGER,
      UserRole.EMPLOYEE,
    ],
    [UserRole.ADMIN]: [
      UserRole.HR_MANAGER,
      UserRole.PAYROLL,
      UserRole.MANAGER,
      UserRole.EMPLOYEE,
    ],
    [UserRole.HR_MANAGER]: [
      UserRole.PAYROLL,
      UserRole.MANAGER,
      UserRole.EMPLOYEE,
    ],
  };

  /**
   * Permission map for each role
   * Defines what actions each role can perform
   */
  private readonly rolePermissionMap = {
    [UserRole.SUPER_ADMIN]: [
      'view_all_companies',
      'create_company',
      'manage_companies',
      'manage_subscriptions',
      'view_all_users',
      'manage_all_users',
      'view_analytics',
      'manage_system_settings',
    ],
    [UserRole.COMPANY_OWNER]: [
      'view_company',
      'manage_company',
      'manage_subscription',
      'create_admin',
      'create_hr_manager',
      'view_all_users',
      'manage_users',
      'view_analytics',
      'manage_departments',
    ],
    [UserRole.ADMIN]: [
      'view_company',
      'manage_company_settings',
      'create_hr_manager',
      'create_manager',
      'view_all_users',
      'manage_users',
      'view_analytics',
      'manage_departments',
    ],
    [UserRole.HR_MANAGER]: [
      'view_company',
      'create_employee',
      'view_all_users',
      'manage_users',
    ],
    [UserRole.PAYROLL]: [
      'view_all_users',
      'view_payroll',
      'manage_payroll',
      'export_payroll',
    ],
    [UserRole.MANAGER]: ['view_team', 'view_team_users'],
    [UserRole.EMPLOYEE]: ['view_own_profile', 'update_own_profile'],
  };

  /**
   * Validate if an actor role can create a target role
   * @throws BadRequestException if permission denied
   */
  validateUserCreationPermission(
    actorRole: UserRole,
    targetRole: UserRole,
  ): void {
    const allowedRoles = this.userCreationPermissionMatrix[actorRole] || [];

    if (!allowedRoles.includes(targetRole)) {
      throw new BadRequestException(
        `${actorRole} role cannot create ${targetRole} users`,
      );
    }
  }

  /**
   * Get all permissions for a specific role
   */
  getUserPermissions(role: UserRole): string[] {
    return this.rolePermissionMap[role] || [];
  }

  /**
   * Check if a role has a specific permission
   */
  hasPermission(role: UserRole, permission: string): boolean {
    const permissions = this.getUserPermissions(role);
    return permissions.includes(permission);
  }

  /**
   * Get all roles that a specific role can create
   */
  getCreatableRoles(actorRole: UserRole): UserRole[] {
    return this.userCreationPermissionMatrix[actorRole] || [];
  }
}
