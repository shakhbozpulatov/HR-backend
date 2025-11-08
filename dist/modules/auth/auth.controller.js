"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const register_dto_1 = require("./dto/register.dto");
const admin_create_user_dto_1 = require("./dto/admin-create-user.dto");
const change_password_dto_1 = require("./dto/change-password.dto");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const auth_guard_1 = require("../../common/guards/auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const update_profile_dto_1 = require("./dto/update-profile.dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async login(loginDto) {
        return await this.authService.login(loginDto);
    }
    async register(registerDto) {
        return await this.authService.register(registerDto);
    }
    async createUserByAdmin(createUserDto, req) {
        const result = await this.authService.createUserByAdmin(createUserDto, req.user.user_id);
        const response = {
            message: 'User created successfully',
            user: {
                user_id: result.user.id,
                email: result.user.email,
                role: result.user.role,
                company_id: result.user.company_id,
                status: result.user.status,
            },
            temporary_password: result.temporary_password,
            note: 'Please share this temporary password securely with the new user',
        };
        if (result.hcError || result.syncStatus === 'FAILED_SYNC') {
            response.warning = result.warning || 'User created but HC sync failed';
            response.syncStatus = result.syncStatus;
            response.hcError = result.hcError;
            response.hcUser = null;
        }
        else {
            response.hcUser = result.hcUser;
            response.syncStatus = 'SYNCED';
        }
        return response;
    }
    async changePassword(changePasswordDto, req) {
        return await this.authService.changePassword(req.user.user_id, changePasswordDto);
    }
    async resetUserPassword(userId, req) {
        const result = await this.authService.resetUserPassword(req.user.user_id, userId);
        return {
            message: 'Password reset successfully',
            temporary_password: result.temporary_password,
            note: 'Please share this temporary password securely with the user',
        };
    }
    async getProfile(req) {
        console.log('emplId', req.user);
        const profile = await this.authService.getProfile(req.user.user_id);
        return {
            success: true,
            data: profile,
            message: 'Profile retrieved successfully',
        };
    }
    async getQuickProfile(req) {
        return {
            success: true,
            data: {
                user_id: req.user.user_id,
                email: req.user.email,
                role: req.user.role,
                company_id: req.user.company_id,
                user: req.user.user
                    ? {
                        code: req.user.code,
                        full_name: `${req.user.first_name} ${req.user.last_name}`,
                        position: req.user.position,
                    }
                    : null,
                company: req.user.company
                    ? {
                        code: req.user.company.code,
                        name: req.user.company.name,
                    }
                    : null,
            },
            message: 'Quick profile retrieved successfully',
        };
    }
    async updateProfile(updateProfileDto, req) {
        const updatedProfile = await this.authService.updateProfile(req.user.user_id, updateProfileDto);
        return {
            success: true,
            data: updatedProfile,
            message: 'Profile updated successfully',
        };
    }
    async logout() {
        return { message: 'Logged out successfully' };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('create-user'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.HR_MANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_create_user_dto_1.AdminCreateUserDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "createUserByAdmin", null);
__decorate([
    (0, common_1.Patch)('change-password'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [change_password_dto_1.ChangePasswordDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)('reset-password/:userId'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetUserPassword", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('profile/quick'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getQuickProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_profile_dto_1.UpdateProfileDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map