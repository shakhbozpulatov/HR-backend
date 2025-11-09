"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionService = void 0;
const common_1 = require("@nestjs/common");
const user_entity_1 = require("../../users/entities/user.entity");
let PermissionService = class PermissionService {
    constructor() {
        this.userCreationPermissionMatrix = {
            [user_entity_1.UserRole.SUPER_ADMIN]: [
                user_entity_1.UserRole.SUPER_ADMIN,
                user_entity_1.UserRole.COMPANY_OWNER,
                user_entity_1.UserRole.ADMIN,
                user_entity_1.UserRole.HR_MANAGER,
                user_entity_1.UserRole.PAYROLL,
                user_entity_1.UserRole.MANAGER,
                user_entity_1.UserRole.EMPLOYEE,
            ],
            [user_entity_1.UserRole.COMPANY_OWNER]: [
                user_entity_1.UserRole.ADMIN,
                user_entity_1.UserRole.HR_MANAGER,
                user_entity_1.UserRole.PAYROLL,
                user_entity_1.UserRole.MANAGER,
                user_entity_1.UserRole.EMPLOYEE,
            ],
            [user_entity_1.UserRole.ADMIN]: [
                user_entity_1.UserRole.HR_MANAGER,
                user_entity_1.UserRole.PAYROLL,
                user_entity_1.UserRole.MANAGER,
                user_entity_1.UserRole.EMPLOYEE,
            ],
            [user_entity_1.UserRole.HR_MANAGER]: [
                user_entity_1.UserRole.PAYROLL,
                user_entity_1.UserRole.MANAGER,
                user_entity_1.UserRole.EMPLOYEE,
            ],
        };
        this.rolePermissionMap = {
            [user_entity_1.UserRole.SUPER_ADMIN]: [
                'view_all_companies',
                'create_company',
                'manage_companies',
                'manage_subscriptions',
                'view_all_users',
                'manage_all_users',
                'view_analytics',
                'manage_system_settings',
            ],
            [user_entity_1.UserRole.COMPANY_OWNER]: [
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
            [user_entity_1.UserRole.ADMIN]: [
                'view_company',
                'manage_company_settings',
                'create_hr_manager',
                'create_manager',
                'view_all_users',
                'manage_users',
                'view_analytics',
                'manage_departments',
            ],
            [user_entity_1.UserRole.HR_MANAGER]: [
                'view_company',
                'create_employee',
                'view_all_users',
                'manage_users',
            ],
            [user_entity_1.UserRole.PAYROLL]: [
                'view_all_users',
                'view_payroll',
                'manage_payroll',
                'export_payroll',
            ],
            [user_entity_1.UserRole.MANAGER]: ['view_team', 'view_team_users'],
            [user_entity_1.UserRole.EMPLOYEE]: ['view_own_profile', 'update_own_profile'],
        };
    }
    validateUserCreationPermission(actorRole, targetRole) {
        const allowedRoles = this.userCreationPermissionMatrix[actorRole] || [];
        if (!allowedRoles.includes(targetRole)) {
            throw new common_1.BadRequestException(`${actorRole} role cannot create ${targetRole} users`);
        }
    }
    getUserPermissions(role) {
        return this.rolePermissionMap[role] || [];
    }
    hasPermission(role, permission) {
        const permissions = this.getUserPermissions(role);
        return permissions.includes(permission);
    }
    getCreatableRoles(actorRole) {
        return this.userCreationPermissionMatrix[actorRole] || [];
    }
};
exports.PermissionService = PermissionService;
exports.PermissionService = PermissionService = __decorate([
    (0, common_1.Injectable)()
], PermissionService);
//# sourceMappingURL=permission.service.js.map