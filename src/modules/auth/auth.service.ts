import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@/modules/users/entities/user.entity';
import {
  Employee,
  EmployeeStatus,
  TariffType,
} from '@/modules/employees/entities/employee.entity';
import {
  Company,
  CompanyStatus,
  SubscriptionPlan,
} from '@/modules/company/entities/company.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CryptoUtils } from '@/common/utils/crypto.utils';
import { UpdateProfileDto } from '@/modules/auth/dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    private jwtService: JwtService,
    private cryptoUtils: CryptoUtils,
  ) {}

  /**
   * LOGIN - Standard authentication
   */
  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; user: any }> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email, active: true },
      relations: ['employee', 'company'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = this.cryptoUtils.comparePassword(
      password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if company is active (skip for SUPER_ADMIN)
    if (user.role !== UserRole.SUPER_ADMIN && user.company) {
      if (user.company.status === CompanyStatus.SUSPENDED) {
        throw new UnauthorizedException(
          'Company is suspended. Please contact support.',
        );
      }
      if (user.company.status === CompanyStatus.INACTIVE) {
        throw new UnauthorizedException('Company is inactive');
      }
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      employee_id: user.employee_id,
      company_id: user.company_id,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        user_id: user.id,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        employee: user.employee,
        company: user.company,
      },
    };
  }

  /**
   * PUBLIC REGISTRATION
   * Scenario 1: Create new company (becomes COMPANY_OWNER)
   * Scenario 2: Join existing company (becomes EMPLOYEE)
   */
  async register(
    registerDto: RegisterDto,
  ): Promise<{ access_token: string; user: any }> {
    // Validate: must provide either create_company or company_code
    if (!registerDto.create_company && !registerDto.company_code) {
      throw new BadRequestException(
        'Please provide company_code to join existing company, or set create_company=true to create new company',
      );
    }

    if (registerDto.create_company && registerDto.company_code) {
      throw new BadRequestException(
        'Cannot create_company and join company_code at the same time. Choose one option.',
      );
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    let companyId: string;
    let userRole: UserRole;
    let company: Company;

    // SCENARIO 1: Create new company
    if (registerDto.create_company) {
      if (
        !registerDto.company_name ||
        registerDto.company_name.trim().length === 0
      ) {
        throw new BadRequestException(
          'company_name is required when creating a new company',
        );
      }

      // Generate unique company code
      const companyCode = await this.generateCompanyCode();

      // Create company
      company = this.companyRepository.create({
        code: companyCode,
        name: registerDto.company_name.trim(),
        email: registerDto.email,
        status: CompanyStatus.ACTIVE,
        subscription_plan: SubscriptionPlan.FREE,
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
      userRole = UserRole.COMPANY_OWNER;

      console.log(`✅ New company created: ${company.name} (${company.code})`);
    }
    // SCENARIO 2: Join existing company
    else if (registerDto.company_code) {
      company = await this.companyRepository.findOne({
        where: { code: registerDto.company_code.toUpperCase() },
      });

      if (!company) {
        throw new BadRequestException('Invalid company code');
      }

      if (company.status !== CompanyStatus.ACTIVE) {
        throw new BadRequestException(
          'Company is not active. Cannot join at this time.',
        );
      }

      // Check employee limit
      const employeeCount = await this.employeeRepository.count({
        where: {
          company_id: company.company_id,
          status: EmployeeStatus.ACTIVE,
        },
      });

      if (employeeCount >= company.max_employees) {
        throw new BadRequestException(
          `Company has reached maximum employee limit (${company.max_employees}). Please contact company admin.`,
        );
      }

      companyId = company.company_id;
      userRole = UserRole.EMPLOYEE;

      console.log(`✅ User joining company: ${company.name} (${company.code})`);
    }

    // Handle employee record
    let employee: Employee;

    // Option A: Link to existing employee record
    if (registerDto.employee_code) {
      employee = await this.employeeRepository.findOne({
        where: {
          company_id: companyId,
          email: registerDto.email,
          status: EmployeeStatus.ACTIVE,
        },
      });

      if (!employee) {
        throw new BadRequestException(
          `Employee code '${registerDto.employee_code}' not found in this company`,
        );
      }

      // Check if employee already has user account
      const existingUserForEmployee = await this.userRepository.findOne({
        where: { id: employee.id },
      });

      if (existingUserForEmployee) {
        throw new ConflictException('This employee already has a user account');
      }

      // Update employee email if not set
      if (!employee.email || employee.email !== registerDto.email) {
        employee.email = registerDto.email;
        if (registerDto.phone) employee.phone = registerDto.phone;
        await this.employeeRepository.save(employee);
      }

      console.log(`✅ Linked to existing employee: ${employee.email}`);
    }
    // Option B: Create new employee record
    else {
      // const employeeCode = await this.generateEmployeeCode(companyId);

      employee = this.employeeRepository.create({
        company_id: companyId,
        first_name: registerDto.first_name.trim(),
        last_name: registerDto.last_name.trim(),
        middle_name: registerDto.middle_name?.trim(),
        email: registerDto.email,
        phone: registerDto.phone,
        department: registerDto.department?.trim(),
        position: registerDto.position?.trim(),
        start_date: new Date(),
        tariff_type: TariffType.MONTHLY,
        monthly_salary: 0, // Will be set by HR later
        status: EmployeeStatus.ACTIVE,
      });

      employee = await this.employeeRepository.save(employee);
      console.log(`✅ New employee created: ${employee.email}`);
    }

    // Create user account
    const hashedPassword = this.cryptoUtils.hashPassword(registerDto.password);

    const user = this.userRepository.create({
      company_id: companyId,
      email: registerDto.email,
      password_hash: hashedPassword,
      role: userRole,
      id: employee.id,
      active: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate JWT
    const payload = {
      email: savedUser.email,
      role: savedUser.role,
      id: savedUser.id,
      company_id: savedUser.company_id,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        user_id: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
        company_id: savedUser.company_id,
        employee: employee,
        company: company,
      },
    };
  }

  /**
   * ADMIN USER CREATION
   * Used by privileged roles to create other users
   * Permission hierarchy enforced
   */
  async createUserByAdmin(
    createUserDto: AdminCreateUserDto,
    actorUserId: string,
  ): Promise<{ user: User; temporary_password: string }> {
    // Get actor user with relations
    const actor = await this.userRepository.findOne({
      where: { id: actorUserId, active: true },
      relations: ['company'],
    });

    if (!actor) {
      throw new UnauthorizedException('Actor not found or inactive');
    }

    // Validate actor has permission to create this role
    this.validateUserCreationPermissions(actor.role, createUserDto.role);

    // Determine target company_id
    let targetCompanyId: string;

    if (actor.role === UserRole.SUPER_ADMIN) {
      // SUPER_ADMIN can create users for any company
      if (!createUserDto.company_id) {
        throw new BadRequestException(
          'company_id is required when SUPER_ADMIN creates users',
        );
      }

      // Verify company exists
      const targetCompany = await this.companyRepository.findOne({
        where: { company_id: createUserDto.company_id },
      });

      if (!targetCompany) {
        throw new NotFoundException('Target company not found');
      }

      targetCompanyId = createUserDto.company_id;
    } else {
      // Other roles can only create users for their own company
      if (!actor.company_id) {
        throw new BadRequestException('Actor must belong to a company');
      }
      targetCompanyId = actor.company_id;
    }

    // Handle employee linking (optional)
    const employee = await this.employeeRepository.findOne({
      where: {
        id: createUserDto.employee_id,
        company_id: targetCompanyId,
      },
    });

    if (!employee) {
      throw new BadRequestException('Employee not found in target company');
    }

    // Check if employee already has user
    const existingEmployeeUser = await this.userRepository.findOne({
      where: { employee_id: createUserDto.employee_id },
    });

    if (existingEmployeeUser) {
      throw new ConflictException('This employee already has a user account');
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: employee.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Generate secure temporary password
    const temporaryPassword = this.generateTemporaryPassword();
    const hashedPassword = this.cryptoUtils.hashPassword(temporaryPassword);

    // Create user
    const newUser = this.userRepository.create({
      company_id: targetCompanyId,
      email: employee.email,
      password_hash: hashedPassword,
      role: createUserDto.role,
      employee_id: employee.id,
      active: true,
    });

    const savedUser = await this.userRepository.save(newUser);

    console.log(
      `✅ User created by ${actor.email}: ${savedUser.email} (${savedUser.role})`,
    );

    // TODO: Send email to new user with temporary password
    // await this.emailService.sendWelcomeEmail(savedUser.email, temporaryPassword);

    return {
      user: savedUser,
      temporary_password: temporaryPassword,
    };
  }

  /**
   * GET USER PROFILE - Complete user information
   * Returns full profile with company, employee, and statistics
   */
  async getProfile(userId: string): Promise<any> {
    console.log('getProfile', userId);
    // Get user with all relations
    const user = await this.userRepository.findOne({
      where: { employee_id: userId, active: true },
      relations: [
        'employee',
        'employee.manager',
        'employee.department_entity',
        'company',
        'company.departments',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Build base profile
    const profile: any = {
      user_id: user.id,
      email: user.email,
      role: user.role,
      active: user.active,
      mfa_enabled: user.mfa_enabled,
      created_at: user.created_at,
    };

    // Add company information
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

      // Get company statistics
      profile.company.statistics = await this.getCompanyStatistics(
        user.company.company_id,
      );
    }

    // Add employee information
    if (user.employee) {
      profile.employee = {
        employee_id: user.employee.id,
        first_name: user.employee.first_name,
        last_name: user.employee.last_name,
        middle_name: user.employee.middle_name,
        full_name: `${user.employee.first_name} ${user.employee.last_name}`,
        email: user.employee.email,
        phone: user.employee.phone,
        dob: user.employee.dob,
        position: user.employee.position,
        department: user.employee.department,
        location: user.employee.location,
        start_date: user.employee.start_date,
        status: user.employee.status,
        tariff_type: user.employee.tariff_type,
        hourly_rate: user.employee.hourly_rate,
        monthly_salary: user.employee.monthly_salary,
        terminal_user_id: user.employee.terminal_user_id,
      };

      // Add department details if exists
      if (user.employee.department_entity) {
        profile.employee.department_details = {
          department_id: user.employee.department_entity.department_id,
          code: user.employee.department_entity.code,
          name: user.employee.department_entity.name,
          description: user.employee.department_entity.description,
        };
      }

      // Add manager details if exists
      if (user.employee.manager) {
        profile.employee.manager = {
          employee_id: user.employee.manager.id,
          full_name: `${user.employee.manager.first_name} ${user.employee.manager.last_name}`,
          email: user.employee.manager.email,
          position: user.employee.manager.position,
        };
      }

      // Get employee statistics
      profile.employee.statistics = await this.getEmployeeStatistics(
        user.employee.id,
      );
    }

    // Add permissions based on role
    profile.permissions = this.getUserPermissions(user.role);

    return profile;
  }

  /**
   * UPDATE USER PROFILE
   * Allows users to update their own profile information
   */
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['employee'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user email if provided
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      // Check if email is already taken
      const existingUser = await this.userRepository.findOne({
        where: { email: updateProfileDto.email },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Email already in use');
      }

      user.email = updateProfileDto.email;
    }

    await this.userRepository.save(user);

    // Update employee information if exists
    if (user.employee) {
      if (updateProfileDto.first_name) {
        user.employee.first_name = updateProfileDto.first_name;
      }
      if (updateProfileDto.last_name) {
        user.employee.last_name = updateProfileDto.last_name;
      }
      if (updateProfileDto.middle_name !== undefined) {
        user.employee.middle_name = updateProfileDto.middle_name;
      }
      if (updateProfileDto.email) {
        user.employee.email = updateProfileDto.email;
      }
      if (updateProfileDto.phone) {
        user.employee.phone = updateProfileDto.phone;
      }

      await this.employeeRepository.save(user.employee);
    }

    // Return updated profile
    return await this.getProfile(userId);
  }

  /**
   * CHANGE PASSWORD - User changes their own password
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId, active: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify old password
    const isOldPasswordValid = this.cryptoUtils.comparePassword(
      changePasswordDto.old_password,
      user.password_hash,
    );

    if (!isOldPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Validate new password is different
    if (changePasswordDto.old_password === changePasswordDto.new_password) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash and save new password
    user.password_hash = this.cryptoUtils.hashPassword(
      changePasswordDto.new_password,
    );
    await this.userRepository.save(user);

    console.log(`✅ Password changed for user: ${user.email}`);

    return { message: 'Password changed successfully' };
  }

  /**
   * RESET PASSWORD - Admin resets user password
   */
  async resetUserPassword(
    adminUserId: string,
    targetUserId: string,
  ): Promise<{ temporary_password: string }> {
    // Get admin user
    const admin = await this.userRepository.findOne({
      where: { id: adminUserId, active: true },
    });

    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    // Check admin has permission
    if (
      ![UserRole.SUPER_ADMIN, UserRole.COMPANY_OWNER, UserRole.ADMIN].includes(
        admin.role,
      )
    ) {
      throw new UnauthorizedException(
        'Insufficient permissions to reset passwords',
      );
    }

    // Get target user
    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId, active: true },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Company isolation check (except SUPER_ADMIN)
    if (
      admin.role !== UserRole.SUPER_ADMIN &&
      admin.company_id !== targetUser.company_id
    ) {
      throw new UnauthorizedException(
        'Cannot reset password for users in other companies',
      );
    }

    // Generate new temporary password
    const temporaryPassword = this.generateTemporaryPassword();
    targetUser.password_hash = this.cryptoUtils.hashPassword(temporaryPassword);
    await this.userRepository.save(targetUser);

    console.log(
      `✅ Password reset by ${admin.email} for user: ${targetUser.email}`,
    );

    // TODO: Send email to user
    // await this.emailService.sendPasswordResetEmail(targetUser.email, temporaryPassword);

    return { temporary_password: temporaryPassword };
  }

  /**
   * VALIDATE USER - For JWT strategy
   */
  async validateUser(payload: any): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, active: true },
      relations: ['employee', 'company'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Check company status (except SUPER_ADMIN)
    if (user.role !== UserRole.SUPER_ADMIN && user.company) {
      if (user.company.status !== CompanyStatus.ACTIVE) {
        throw new UnauthorizedException('Company is not active');
      }
    }

    return user;
  }

  /**
   * PERMISSION VALIDATION
   * Enforce role hierarchy for user creation
   */
  private validateUserCreationPermissions(
    actorRole: UserRole,
    targetRole: UserRole,
  ): void {
    const permissionMatrix = {
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

    const allowedRoles = permissionMatrix[actorRole] || [];

    if (!allowedRoles.includes(targetRole)) {
      throw new BadRequestException(
        `${actorRole} role cannot create ${targetRole} users`,
      );
    }
  }

  /**
   * HELPER: Generate unique company code
   */
  private async generateCompanyCode(): Promise<string> {
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

  /**
   * HELPER: Generate unique employee code within company
   */
  // private async generateEmployeeCode(companyId: string): Promise<string> {
  //   const lastEmployee = await this.employeeRepository
  //     .createQueryBuilder('employee')
  //     .where('employee.company_id = :companyId', { companyId })
  //     .andWhere('employee.code LIKE :prefix', { prefix: 'EMP%' })
  //     .orderBy('employee.code', 'DESC')
  //     .getOne();
  //
  //   if (!lastEmployee) {
  //     return 'EMP001';
  //   }
  //
  //   const match = lastEmployee.code.match(/EMP(\d+)/);
  //   if (!match) {
  //     return 'EMP001';
  //   }
  //
  //   const lastNumber = parseInt(match[1], 10);
  //   const newNumber = lastNumber + 1;
  //   return `EMP${newNumber.toString().padStart(3, '0')}`;
  // }

  /**
   * HELPER: Generate secure temporary password
   */
  private generateTemporaryPassword(): string {
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

    // Shuffle password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * Get company statistics
   */
  private async getCompanyStatistics(companyId: string): Promise<any> {
    // Total employees
    const totalEmployees = await this.employeeRepository.count({
      where: { company_id: companyId },
    });

    // Active employees
    const activeEmployees = await this.employeeRepository.count({
      where: { company_id: companyId, status: EmployeeStatus.ACTIVE },
    });

    // Total users
    const totalUsers = await this.userRepository.count({
      where: { company_id: companyId },
    });

    // Active users
    const activeUsers = await this.userRepository.count({
      where: { company_id: companyId, active: true },
    });

    return {
      total_employees: totalEmployees,
      active_employees: activeEmployees,
      inactive_employees: totalEmployees - activeEmployees,
      total_users: totalUsers,
      active_users: activeUsers,
      employees_remaining: 0, // Will be calculated with company data
    };
  }

  /**
   * Get employee statistics
   */
  private async getEmployeeStatistics(employeeId: string): Promise<any> {
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );

    try {
      // This month attendance (if AttendanceRecord exists)
      const attendanceRecords = await this.employeeRepository.manager
        .getRepository('AttendanceRecord')
        .count({
          where: {
            employee_id: employeeId,
            date: { $gte: firstDayOfMonth } as any,
          },
        })
        .catch(() => 0);

      return {
        attendance_this_month: attendanceRecords,
        working_days_this_month: attendanceRecords,
        // Can add more stats like late_days, overtime_hours, etc.
      };
    } catch (error) {
      // Return empty stats if tables don't exist yet
      return {
        attendance_this_month: 0,
        working_days_this_month: 0,
      };
    }
  }

  /**
   * Get user permissions based on role
   */
  private getUserPermissions(role: UserRole): string[] {
    const permissionMap = {
      [UserRole.SUPER_ADMIN]: [
        'view_all_companies',
        'create_company',
        'manage_companies',
        'manage_subscriptions',
        'view_all_users',
        'manage_all_users',
        'view_all_employees',
        'manage_all_employees',
        'view_all_payroll',
        'manage_all_payroll',
        'view_analytics',
        'manage_system_settings',
      ],
      [UserRole.COMPANY_OWNER]: [
        'view_company',
        'manage_company',
        'manage_subscription',
        'create_admin',
        'create_hr_manager',
        'view_all_employees',
        'manage_employees',
        'view_attendance',
        'manage_attendance',
        'view_payroll',
        'manage_payroll',
        'approve_payroll',
        'view_analytics',
        'manage_departments',
        'manage_terminals',
      ],
      [UserRole.ADMIN]: [
        'view_company',
        'manage_company_settings',
        'create_hr_manager',
        'create_manager',
        'view_all_employees',
        'manage_employees',
        'view_attendance',
        'manage_attendance',
        'view_payroll',
        'manage_payroll',
        'view_analytics',
        'manage_departments',
      ],
      [UserRole.HR_MANAGER]: [
        'view_company',
        'create_employee',
        'view_all_employees',
        'manage_employees',
        'view_attendance',
        'approve_attendance',
        'manage_schedules',
        'view_payroll',
        'run_payroll',
        'manage_holidays',
      ],
      [UserRole.PAYROLL]: [
        'view_all_employees',
        'view_attendance',
        'view_payroll',
        'manage_payroll',
        'export_payroll',
        'add_bonuses',
        'add_deductions',
      ],
      [UserRole.MANAGER]: [
        'view_team',
        'view_team_attendance',
        'approve_team_attendance',
        'view_team_schedules',
        'request_corrections',
      ],
      [UserRole.EMPLOYEE]: [
        'view_own_profile',
        'view_own_attendance',
        'view_own_schedule',
        'view_own_payslip',
        'update_own_profile',
      ],
    };

    return permissionMap[role] || [];
  }
}
