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
const employee_entity_1 = require("../employees/entities/employee.entity");
const company_entity_1 = require("../company/entities/company.entity");
const crypto_utils_1 = require("../../common/utils/crypto.utils");
let AuthService = class AuthService {
    constructor(userRepository, employeeRepository, companyRepository, jwtService, cryptoUtils) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.companyRepository = companyRepository;
        this.jwtService = jwtService;
        this.cryptoUtils = cryptoUtils;
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.userRepository.findOne({
            where: { email, active: true },
            relations: ['employee', 'company'],
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
            sub: user.user_id,
            email: user.email,
            role: user.role,
            employee_id: user.employee_id,
            company_id: user.company_id,
        };
        const access_token = this.jwtService.sign(payload);
        return {
            access_token,
            user: {
                user_id: user.user_id,
                email: user.email,
                role: user.role,
                company_id: user.company_id,
                employee: user.employee,
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
            const employeeCount = await this.employeeRepository.count({
                where: {
                    company_id: company.company_id,
                    status: employee_entity_1.EmployeeStatus.ACTIVE,
                },
            });
            if (employeeCount >= company.max_employees) {
                throw new common_1.BadRequestException(`Company has reached maximum employee limit (${company.max_employees}). Please contact company admin.`);
            }
            companyId = company.company_id;
            userRole = user_entity_1.UserRole.EMPLOYEE;
            console.log(`✅ User joining company: ${company.name} (${company.code})`);
        }
        let employee;
        if (registerDto.employee_code) {
            employee = await this.employeeRepository.findOne({
                where: {
                    company_id: companyId,
                    code: registerDto.employee_code.toUpperCase(),
                    status: employee_entity_1.EmployeeStatus.ACTIVE,
                },
            });
            if (!employee) {
                throw new common_1.BadRequestException(`Employee code '${registerDto.employee_code}' not found in this company`);
            }
            const existingUserForEmployee = await this.userRepository.findOne({
                where: { employee_id: employee.employee_id },
            });
            if (existingUserForEmployee) {
                throw new common_1.ConflictException('This employee already has a user account');
            }
            if (!employee.email || employee.email !== registerDto.email) {
                employee.email = registerDto.email;
                if (registerDto.phone)
                    employee.phone = registerDto.phone;
                await this.employeeRepository.save(employee);
            }
            console.log(`✅ Linked to existing employee: ${employee.code}`);
        }
        else {
            const employeeCode = await this.generateEmployeeCode(companyId);
            employee = this.employeeRepository.create({
                company_id: companyId,
                code: employeeCode,
                first_name: registerDto.first_name.trim(),
                last_name: registerDto.last_name.trim(),
                middle_name: registerDto.middle_name?.trim(),
                email: registerDto.email,
                phone: registerDto.phone,
                department: registerDto.department?.trim(),
                position: registerDto.position?.trim(),
                start_date: new Date(),
                tariff_type: employee_entity_1.TariffType.MONTHLY,
                monthly_salary: 0,
                status: employee_entity_1.EmployeeStatus.ACTIVE,
            });
            employee = await this.employeeRepository.save(employee);
            console.log(`✅ New employee created: ${employee.code}`);
        }
        const hashedPassword = this.cryptoUtils.hashPassword(registerDto.password);
        const user = this.userRepository.create({
            company_id: companyId,
            email: registerDto.email,
            password_hash: hashedPassword,
            role: userRole,
            employee_id: employee.employee_id,
            active: true,
        });
        const savedUser = await this.userRepository.save(user);
        const payload = {
            sub: savedUser.user_id,
            email: savedUser.email,
            role: savedUser.role,
            employee_id: savedUser.employee_id,
            company_id: savedUser.company_id,
        };
        const access_token = this.jwtService.sign(payload);
        return {
            access_token,
            user: {
                user_id: savedUser.user_id,
                email: savedUser.email,
                role: savedUser.role,
                company_id: savedUser.company_id,
                employee: employee,
                company: company,
            },
        };
    }
    async createUserByAdmin(createUserDto, actorUserId) {
        const actor = await this.userRepository.findOne({
            where: { user_id: actorUserId, active: true },
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
        let employeeId;
        if (createUserDto.employee_id) {
            const employee = await this.employeeRepository.findOne({
                where: {
                    employee_id: createUserDto.employee_id,
                    company_id: targetCompanyId,
                },
            });
            if (!employee) {
                throw new common_1.BadRequestException('Employee not found in target company');
            }
            const existingEmployeeUser = await this.userRepository.findOne({
                where: { employee_id: createUserDto.employee_id },
            });
            if (existingEmployeeUser) {
                throw new common_1.ConflictException('This employee already has a user account');
            }
            employeeId = employee.employee_id;
        }
        const temporaryPassword = this.generateTemporaryPassword();
        const hashedPassword = this.cryptoUtils.hashPassword(temporaryPassword);
        const newUser = this.userRepository.create({
            company_id: targetCompanyId,
            email: createUserDto.email,
            password_hash: hashedPassword,
            role: createUserDto.role,
            employee_id: employeeId,
            active: true,
        });
        const savedUser = await this.userRepository.save(newUser);
        console.log(`✅ User created by ${actor.email}: ${savedUser.email} (${savedUser.role})`);
        return {
            user: savedUser,
            temporary_password: temporaryPassword,
        };
    }
    async changePassword(userId, changePasswordDto) {
        const user = await this.userRepository.findOne({
            where: { user_id: userId, active: true },
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
            where: { user_id: adminUserId, active: true },
        });
        if (!admin) {
            throw new common_1.UnauthorizedException('Admin not found');
        }
        if (![user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.COMPANY_OWNER, user_entity_1.UserRole.ADMIN].includes(admin.role)) {
            throw new common_1.UnauthorizedException('Insufficient permissions to reset passwords');
        }
        const targetUser = await this.userRepository.findOne({
            where: { user_id: targetUserId, active: true },
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
            where: { user_id: payload.sub, active: true },
            relations: ['employee', 'company'],
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
    async generateEmployeeCode(companyId) {
        const lastEmployee = await this.employeeRepository
            .createQueryBuilder('employee')
            .where('employee.company_id = :companyId', { companyId })
            .andWhere('employee.code LIKE :prefix', { prefix: 'EMP%' })
            .orderBy('employee.code', 'DESC')
            .getOne();
        if (!lastEmployee) {
            return 'EMP001';
        }
        const match = lastEmployee.code.match(/EMP(\d+)/);
        if (!match) {
            return 'EMP001';
        }
        const lastNumber = parseInt(match[1], 10);
        const newNumber = lastNumber + 1;
        return `EMP${newNumber.toString().padStart(3, '0')}`;
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(2, (0, typeorm_1.InjectRepository)(company_entity_1.Company)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        crypto_utils_1.CryptoUtils])
], AuthService);
//# sourceMappingURL=auth.service.js.map