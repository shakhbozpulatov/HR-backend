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
const crypto_utils_1 = require("../../common/utils/crypto.utils");
const employee_entity_1 = require("../employees/entities/employee.entity");
let AuthService = class AuthService {
    constructor(userRepository, employeeRepository, jwtService, cryptoUtils) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.jwtService = jwtService;
        this.cryptoUtils = cryptoUtils;
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.userRepository.findOne({
            where: { email, active: true },
            relations: ['employee'],
        });
        if (!user ||
            !this.cryptoUtils.comparePassword(password, user.password_hash)) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const payload = {
            sub: user.user_id,
            email: user.email,
            role: user.role,
            employee_id: user.employee_id,
        };
        const access_token = this.jwtService.sign(payload);
        return {
            access_token,
            user: {
                user_id: user.user_id,
                email: user.email,
                role: user.role,
                employee: user.employee,
            },
        };
    }
    async register(registerDto) {
        const existingUser = await this.userRepository.findOne({
            where: { email: registerDto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already registered');
        }
        let employeeId;
        let employee;
        if (registerDto.employee_code) {
            employee = await this.employeeRepository.findOne({
                where: {
                    code: registerDto.employee_code,
                    status: employee_entity_1.EmployeeStatus.ACTIVE,
                },
            });
            if (!employee) {
                throw new common_1.BadRequestException('Employee code not found or inactive');
            }
            const existingEmployeeUser = await this.userRepository.findOne({
                where: { employee_id: employee.employee_id },
            });
            if (existingEmployeeUser) {
                throw new common_1.ConflictException('Employee already has a user account');
            }
            employeeId = employee.employee_id;
            if (!employee.email) {
                employee.email = registerDto.email;
                await this.employeeRepository.save(employee);
            }
        }
        else {
            const employeeCode = await this.generateEmployeeCode();
            employee = this.employeeRepository.create({
                code: employeeCode,
                first_name: registerDto.first_name,
                last_name: registerDto.last_name,
                middle_name: registerDto.middle_name,
                email: registerDto.email,
                phone: registerDto.phone,
                department: registerDto.department || 'General',
                position: registerDto.position,
                start_date: new Date(),
                tariff_type: employee_entity_1.TariffType.MONTHLY,
                monthly_salary: 0,
                status: employee_entity_1.EmployeeStatus.ACTIVE,
            });
            employee = await this.employeeRepository.save(employee);
            employeeId = employee.employee_id;
        }
        const hashedPassword = this.cryptoUtils.hashPassword(registerDto.password);
        const user = this.userRepository.create({
            email: registerDto.email,
            password_hash: hashedPassword,
            role: user_entity_1.UserRole.EMPLOYEE,
            employee_id: employeeId,
            active: true,
        });
        const savedUser = await this.userRepository.save(user);
        const payload = {
            sub: savedUser.user_id,
            email: savedUser.email,
            role: savedUser.role,
            employee_id: savedUser.employee_id,
        };
        const access_token = this.jwtService.sign(payload);
        return {
            access_token,
            user: {
                user_id: savedUser.user_id,
                email: savedUser.email,
                role: savedUser.role,
                employee: employee,
            },
        };
    }
    async createUserByAdmin(adminRegisterDto, adminUserId) {
        const existingUser = await this.userRepository.findOne({
            where: { email: adminRegisterDto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already exists');
        }
        let employeeId;
        if (adminRegisterDto.employee_id) {
            const employee = await this.employeeRepository.findOne({
                where: { employee_id: adminRegisterDto.employee_id },
            });
            if (!employee) {
                throw new common_1.BadRequestException('Employee not found');
            }
            const existingEmployeeUser = await this.userRepository.findOne({
                where: { employee_id: adminRegisterDto.employee_id },
            });
            if (existingEmployeeUser) {
                throw new common_1.ConflictException('Employee already has a user account');
            }
            employeeId = adminRegisterDto.employee_id;
        }
        else if (adminRegisterDto.employee_code) {
            const employee = await this.employeeRepository.findOne({
                where: { code: adminRegisterDto.employee_code },
            });
            if (employee) {
                employeeId = employee.employee_id;
            }
        }
        const hashedPassword = this.cryptoUtils.hashPassword(adminRegisterDto.password);
        const user = this.userRepository.create({
            email: adminRegisterDto.email,
            password_hash: hashedPassword,
            role: adminRegisterDto.role,
            employee_id: employeeId,
            active: true,
        });
        return await this.userRepository.save(user);
    }
    async validateUser(payload) {
        const user = await this.userRepository.findOne({
            where: { user_id: payload.sub, active: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException();
        }
        return user;
    }
    async generateEmployeeCode() {
        const lastEmployee = await this.employeeRepository
            .createQueryBuilder('employee')
            .where('employee.code LIKE :prefix', { prefix: 'EMP%' })
            .orderBy('employee.code', 'DESC')
            .getOne();
        if (!lastEmployee) {
            return 'EMP001';
        }
        const lastNumber = parseInt(lastEmployee.code.replace('EMP', '')) || 0;
        const newNumber = lastNumber + 1;
        return `EMP${newNumber.toString().padStart(3, '0')}`;
    }
    async changePassword(userId, oldPassword, newPassword) {
        const user = await this.userRepository.findOne({
            where: { user_id: userId },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (!this.cryptoUtils.comparePassword(oldPassword, user.password_hash)) {
            throw new common_1.UnauthorizedException('Invalid old password');
        }
        user.password_hash = this.cryptoUtils.hashPassword(newPassword);
        await this.userRepository.save(user);
    }
    async forgotPassword(email) {
        const user = await this.userRepository.findOne({
            where: { email, active: true },
        });
        if (!user) {
            return { message: 'If email exists, reset instructions have been sent' };
        }
        return { message: 'If email exists, reset instructions have been sent' };
    }
    async resetPassword(token, newPassword) {
        return { message: 'Password has been reset successfully' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        crypto_utils_1.CryptoUtils])
], AuthService);
//# sourceMappingURL=auth.service.js.map