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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const user_entity_1 = require("../users/entities/user.entity");
const company_entity_1 = require("../company/entities/company.entity");
const crypto_utils_1 = require("../../common/utils/crypto.utils");
let AuthService = class AuthService {
    constructor(userRepository, companyRepository, jwtService, cryptoUtils) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.jwtService = jwtService;
        this.cryptoUtils = cryptoUtils;
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.userRepository.findOne({
            where: { email, active: true },
            relations: ['company'],
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = this.cryptoUtils.comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.role !== user_entity_1.UserRole.SUPER_ADMIN && user.company) {
            if (user.company.status === company_entity_1.CompanyStatus.SUSPENDED) {
                throw new common_1.UnauthorizedException('Company is suspended. Please contact support.');
            }
            if (user.company.status === company_entity_1.CompanyStatus.INACTIVE) {
                throw new common_1.UnauthorizedException('Company is inactive');
            }
        }
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            company_id: user.company_id,
        };
        const access_token = this.jwtService.sign(payload);
        return {
            access_token,
            user: {
                user_id: user.id,
                email: user.email,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
                company_id: user.company_id,
                company: user.company,
            },
        };
    }
    async register(registerDto) {
        if (!registerDto.create_company && !registerDto.company_code) {
            throw new common_1.BadRequestException('Please provide company_code to join existing company, or set create_company=true to create new company');
        }
        if (registerDto.create_company && registerDto.company_code) {
            throw new common_1.BadRequestException('Cannot create_company and join company_code at the same time. Choose one option.');
        }
        const existingUser = await this.userRepository.findOne({
            where: { email: registerDto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already registered');
        }
        let companyId;
        let userRole;
        let company;
        if (registerDto.create_company) {
            if (!registerDto.company_name ||
                registerDto.company_name.trim().length === 0) {
                throw new common_1.BadRequestException('company_name is required when creating a new company');
            }
            const companyCode = await this.generateCompanyCode();
            company = this.companyRepository.create({
                code: companyCode,
                name: registerDto.company_name.trim(),
                email: registerDto.email,
                status: company_entity_1.CompanyStatus.ACTIVE,
                subscription_plan: company_entity_1.SubscriptionPlan.FREE,
                max_employees: 10,
                settings: {
                    timezone: 'Asia/Tashkent',
                    currency: 'UZS',
                    date_format: 'DD/MM/YYYY',
                    time_format: '24h',
                    week_start: 'Monday',
                    fiscal_year_start: '01-01',
                    default_language: 'uz',
                },
                payroll_settings: {
                    overtime_multiplier: 1.5,
                    grace_in_minutes: 5,
                    grace_out_minutes: 0,
                    rounding_minutes: 5,
                    overtime_threshold_minutes: 15,
                },
            });
            company = await this.companyRepository.save(company);
            companyId = company.company_id;
            userRole = user_entity_1.UserRole.COMPANY_OWNER;
            console.log(`✅ New company created: ${company.name} (${company.code})`);
        }
        else if (registerDto.company_code) {
            company = await this.companyRepository.findOne({
                where: { code: registerDto.company_code.toUpperCase() },
            });
            if (!company) {
                throw new common_1.BadRequestException('Invalid company code');
            }
            if (company.status !== company_entity_1.CompanyStatus.ACTIVE) {
                throw new common_1.BadRequestException('Company is not active. Cannot join at this time.');
            }
            const userCount = await this.userRepository.count({
                where: {
                    company_id: company.company_id,
                    status: user_entity_1.UserStatus.ACTIVE,
                },
            });
            if (userCount >= company.max_employees) {
                throw new common_1.BadRequestException(`Company has reached maximum employee limit (${company.max_employees}). Please contact company admin.`);
            }
            companyId = company.company_id;
            userRole = user_entity_1.UserRole.EMPLOYEE;
            console.log(`✅ User joining company: ${company.name} (${company.code})`);
        }
        const hashedPassword = this.cryptoUtils.hashPassword(registerDto.password);
        const user = this.userRepository.create({
            company_id: companyId,
            email: registerDto.email,
            password_hash: hashedPassword,
            role: userRole,
            first_name: registerDto.first_name.trim(),
            last_name: registerDto.last_name.trim(),
            middle_name: registerDto.middle_name?.trim(),
            phone: registerDto.phone,
            department: registerDto.department?.trim(),
            position: registerDto.position?.trim(),
            start_date: new Date(),
            status: user_entity_1.UserStatus.ACTIVE,
            active: true,
        });
        const savedUser = await this.userRepository.save(user);
        console.log(`✅ New user created: ${savedUser.email}`);
        const payload = {
            sub: savedUser.id,
            email: savedUser.email,
            role: savedUser.role,
            company_id: savedUser.company_id,
        };
        const access_token = this.jwtService.sign(payload);
        return {
            access_token,
            user: {
                user_id: savedUser.id,
                email: savedUser.email,
                role: savedUser.role,
                first_name: savedUser.first_name,
                last_name: savedUser.last_name,
                company_id: savedUser.company_id,
                company: company,
            },
        };
    }
    async createUserByAdmin(createUserDto, actorUserId) {
        const actor = await this.userRepository.findOne({
            where: { id: actorUserId, active: true },
            relations: ['company'],
        });
        if (!actor) {
            throw new common_1.UnauthorizedException('Actor not found or inactive');
        }
        this.validateUserCreationPermissions(actor.role, createUserDto.role);
        const existingUser = await this.userRepository.findOne({
            where: { email: createUserDto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already exists');
        }
        let targetCompanyId;
        if (actor.role === user_entity_1.UserRole.SUPER_ADMIN) {
            if (!createUserDto.company_id) {
                throw new common_1.BadRequestException('company_id is required when SUPER_ADMIN creates users');
            }
            const targetCompany = await this.companyRepository.findOne({
                where: { company_id: createUserDto.company_id },
            });
            if (!targetCompany) {
                throw new common_1.NotFoundException('Target company not found');
            }
            targetCompanyId = createUserDto.company_id;
        }
        else {
            if (!actor.company_id) {
                throw new common_1.BadRequestException('Actor must belong to a company');
            }
            targetCompanyId = actor.company_id;
        }
        const temporaryPassword = this.generateTemporaryPassword();
        const hashedPassword = this.cryptoUtils.hashPassword(temporaryPassword);
        const newUser = this.userRepository.create({
            password_hash: hashedPassword,
            company_id: targetCompanyId,
            ...createUserDto,
        });
        const savedUser = await this.userRepository.save(newUser);
        console.log(`✅ User created by ${actor.email}: ${savedUser.email} (${savedUser.role})`);
        return {
            user: savedUser,
            temporary_password: temporaryPassword,
        };
    }
    async getProfile(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId, active: true },
            relations: ['company', 'company.departments'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const profile = {
            user_id: user.id,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
            middle_name: user.middle_name,
            full_name: `${user.first_name} ${user.last_name}`,
            phone: user.phone,
            dob: user.dob,
            position: user.position,
            department: user.department,
            start_date: user.start_date,
            status: user.status,
            active: user.active,
            mfa_enabled: user.mfa_enabled,
            created_at: user.created_at,
        };
        if (user.company) {
            profile.company = {
                company_id: user.company.company_id,
                code: user.company.code,
                name: user.company.name,
                legal_name: user.company.legal_name,
                email: user.company.email,
                phone: user.company.phone,
                address: user.company.address,
                city: user.company.city,
                status: user.company.status,
                subscription_plan: user.company.subscription_plan,
                subscription_end_date: user.company.subscription_end_date,
                max_employees: user.company.max_employees,
                settings: user.company.settings,
                created_at: user.company.created_at,
            };
            profile.company.statistics = await this.getCompanyStatistics(user.company.company_id);
        }
        profile.permissions = this.getUserPermissions(user.role);
        return profile;
    }
    async updateProfile(userId, updateProfileDto) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (updateProfileDto.email && updateProfileDto.email !== user.email) {
            const existingUser = await this.userRepository.findOne({
                where: { email: updateProfileDto.email },
            });
            if (existingUser && existingUser.id !== userId) {
                throw new common_1.ConflictException('Email already in use');
            }
            user.email = updateProfileDto.email;
        }
        if (updateProfileDto.first_name) {
            user.first_name = updateProfileDto.first_name;
        }
        if (updateProfileDto.last_name) {
            user.last_name = updateProfileDto.last_name;
        }
        if (updateProfileDto.middle_name !== undefined) {
            user.middle_name = updateProfileDto.middle_name;
        }
        if (updateProfileDto.phone) {
            user.phone = updateProfileDto.phone;
        }
        if (updateProfileDto.dob) {
            user.dob = updateProfileDto.dob;
        }
        await this.userRepository.save(user);
        return await this.getProfile(userId);
    }
    async changePassword(userId, changePasswordDto) {
        const user = await this.userRepository.findOne({
            where: { id: userId, active: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isOldPasswordValid = this.cryptoUtils.comparePassword(changePasswordDto.old_password, user.password_hash);
        if (!isOldPasswordValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        if (changePasswordDto.old_password === changePasswordDto.new_password) {
            throw new common_1.BadRequestException('New password must be different from current password');
        }
        user.password_hash = this.cryptoUtils.hashPassword(changePasswordDto.new_password);
        await this.userRepository.save(user);
        console.log(`✅ Password changed for user: ${user.email}`);
        return { message: 'Password changed successfully' };
    }
    async resetUserPassword(adminUserId, targetUserId) {
        const admin = await this.userRepository.findOne({
            where: { id: adminUserId, active: true },
        });
        if (!admin) {
            throw new common_1.UnauthorizedException('Admin not found');
        }
        if (![user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN].includes(admin.role)) {
            throw new common_1.UnauthorizedException('Insufficient permissions to reset passwords');
        }
        const targetUser = await this.userRepository.findOne({
            where: { id: targetUserId, active: true },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException('Target user not found');
        }
        if (admin.role !== user_entity_1.UserRole.SUPER_ADMIN &&
            admin.company_id !== targetUser.company_id) {
            throw new common_1.UnauthorizedException('Cannot reset password for users in other companies');
        }
        const temporaryPassword = this.generateTemporaryPassword();
        targetUser.password_hash = this.cryptoUtils.hashPassword(temporaryPassword);
        await this.userRepository.save(targetUser);
        console.log(`✅ Password reset by ${admin.email} for user: ${targetUser.email}`);
        return { temporary_password: temporaryPassword };
    }
    async validateUser(payload) {
        const user = await this.userRepository.findOne({
            where: { id: payload.sub, active: true },
            relations: ['company'],
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found or inactive');
        }
        if (user.role !== user_entity_1.UserRole.SUPER_ADMIN && user.company) {
            if (user.company.status !== company_entity_1.CompanyStatus.ACTIVE) {
                throw new common_1.UnauthorizedException('Company is not active');
            }
        }
        return user;
    }
    validateUserCreationPermissions(actorRole, targetRole) {
        const permissionMatrix = {
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
        const allowedRoles = permissionMatrix[actorRole] || [];
        if (!allowedRoles.includes(targetRole)) {
            throw new common_1.BadRequestException(`${actorRole} role cannot create ${targetRole} users`);
        }
    }
    async generateCompanyCode() {
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
    generateTemporaryPassword() {
        const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const lowercase = 'abcdefghjkmnpqrstuvwxyz';
        const numbers = '23456789';
        const special = '!@#$%';
        let password = '';
        password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
        password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
        password += numbers.charAt(Math.floor(Math.random() * numbers.length));
        password += special.charAt(Math.floor(Math.random() * special.length));
        const allChars = uppercase + lowercase + numbers;
        for (let i = 4; i < 12; i++) {
            password += allChars.charAt(Math.floor(Math.random() * allChars.length));
        }
        return password
            .split('')
            .sort(() => Math.random() - 0.5)
            .join('');
    }
    async getCompanyStatistics(companyId) {
        const totalUsers = await this.userRepository.count({
            where: { company_id: companyId },
        });
        const activeUsers = await this.userRepository.count({
            where: { company_id: companyId, active: true, status: user_entity_1.UserStatus.ACTIVE },
        });
        return {
            total_users: totalUsers,
            active_users: activeUsers,
            inactive_users: totalUsers - activeUsers,
        };
    }
    getUserPermissions(role) {
        const permissionMap = {
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
        return permissionMap[role] || [];
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        crypto_utils_1.CryptoUtils])
], AuthService);
//# sourceMappingURL=auth.service.js.map