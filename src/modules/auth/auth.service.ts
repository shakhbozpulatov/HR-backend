import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@/modules/users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { CryptoUtils } from '@/common/utils/crypto.utils';
import { AdminRegisterDto, RegisterDto } from '@/modules/auth/dto/register.dto';
import {
  Employee,
  EmployeeStatus,
  TariffType,
} from '@/modules/employees/entities/employee.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private jwtService: JwtService,
    private cryptoUtils: CryptoUtils,
  ) {}

  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; user: Partial<User> }> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email, active: true },
      relations: ['employee'],
    });

    if (
      !user ||
      !this.cryptoUtils.comparePassword(password, user.password_hash)
    ) {
      throw new UnauthorizedException('Invalid credentials');
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

  async register(
    registerDto: RegisterDto,
  ): Promise<{ access_token: string; user: Partial<User> }> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    let employeeId: string | undefined;
    let employee: Employee | undefined;

    // If employee_code provided, try to link with existing employee
    if (registerDto.employee_code) {
      employee = await this.employeeRepository.findOne({
        where: {
          code: registerDto.employee_code,
          status: EmployeeStatus.ACTIVE,
        },
      });

      if (!employee) {
        throw new BadRequestException('Employee code not found or inactive');
      }

      // Check if employee already has a user account
      const existingEmployeeUser = await this.userRepository.findOne({
        where: { employee_id: employee.employee_id },
      });

      if (existingEmployeeUser) {
        throw new ConflictException('Employee already has a user account');
      }

      employeeId = employee.employee_id;

      // Update employee email if not set
      if (!employee.email) {
        employee.email = registerDto.email;
        await this.employeeRepository.save(employee);
      }
    } else {
      // Create new employee record automatically
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
        tariff_type: TariffType.MONTHLY,
        monthly_salary: 0, // Will be set by HR later
        status: EmployeeStatus.ACTIVE,
      });

      employee = await this.employeeRepository.save(employee);
      employeeId = employee.employee_id;
    }

    // Create user account
    const hashedPassword = this.cryptoUtils.hashPassword(registerDto.password);

    const user = this.userRepository.create({
      email: registerDto.email,
      password_hash: hashedPassword,
      role: UserRole.EMPLOYEE, // Default role for public registration
      employee_id: employeeId,
      active: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate JWT token
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

  async createUserByAdmin(
    adminRegisterDto: AdminRegisterDto,
    adminUserId: string,
  ): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: adminRegisterDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    let employeeId: string | undefined;

    // If employee_id provided, validate it
    if (adminRegisterDto.employee_id) {
      const employee = await this.employeeRepository.findOne({
        where: { employee_id: adminRegisterDto.employee_id },
      });

      if (!employee) {
        throw new BadRequestException('Employee not found');
      }

      // Check if employee already has a user
      const existingEmployeeUser = await this.userRepository.findOne({
        where: { employee_id: adminRegisterDto.employee_id },
      });

      if (existingEmployeeUser) {
        throw new ConflictException('Employee already has a user account');
      }

      employeeId = adminRegisterDto.employee_id;
    } else if (adminRegisterDto.employee_code) {
      // Link by employee code
      const employee = await this.employeeRepository.findOne({
        where: { code: adminRegisterDto.employee_code },
      });

      if (employee) {
        employeeId = employee.employee_id;
      }
    }

    const hashedPassword = this.cryptoUtils.hashPassword(
      adminRegisterDto.password,
    );

    const user = this.userRepository.create({
      email: adminRegisterDto.email,
      password_hash: hashedPassword,
      role: adminRegisterDto.role,
      employee_id: employeeId,
      active: true,
    });

    return await this.userRepository.save(user);
  }

  async validateUser(payload: any): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { user_id: payload.sub, active: true },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }

  private async generateEmployeeCode(): Promise<string> {
    // Generate unique employee code
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

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!this.cryptoUtils.comparePassword(oldPassword, user.password_hash)) {
      throw new UnauthorizedException('Invalid old password');
    }

    user.password_hash = this.cryptoUtils.hashPassword(newPassword);
    await this.userRepository.save(user);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email, active: true },
    });

    if (!user) {
      // Don't reveal if email exists or not
      return { message: 'If email exists, reset instructions have been sent' };
    }

    // TODO: Implement password reset token and email sending
    // For now, just return success message
    return { message: 'If email exists, reset instructions have been sent' };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // TODO: Implement token validation and password reset
    return { message: 'Password has been reset successfully' };
  }
}
