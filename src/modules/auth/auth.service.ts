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
import {
  User,
  UserRole,
  UserStatus,
} from '@/modules/users/entities/user.entity';
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
import { HcService } from '@/modules/hc/hc.service';

// SOLID: Dependency Inversion - depend on abstractions (services)
import { PasswordService } from './services/password.service';
import { PermissionService } from './services/permission.service';
import { CompanyService } from './services/company.service';
import { PhotoUploadService } from './services/photo-upload.service';
import { PhotoUploadJobDto } from './dto/photo-upload-job.dto';

/**
 * Auth Service
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Focus on authentication and user management
 * - Dependency Inversion: Depends on abstractions (injected services)
 * - Open/Closed: Easy to extend without modifying existing code
 *
 * Delegates responsibilities to specialized services:
 * - PasswordService: Password operations
 * - PermissionService: Permission validation
 * - CompanyService: Company operations
 * - PhotoUploadService: Background photo upload processing
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    private jwtService: JwtService,
    private cryptoUtils: CryptoUtils,
    private hcService: HcService,

    // SOLID: Dependency Injection - inject specialized services
    private passwordService: PasswordService,
    private permissionService: PermissionService,
    private companyService: CompanyService,
    private photoUploadService: PhotoUploadService,
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
      relations: ['company'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // SOLID: Use PasswordService for password comparison
    const isPasswordValid = this.passwordService.comparePassword(
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
      user_id: user.id,
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

      // SOLID: Use CompanyService for code generation
      const companyCode = await this.companyService.generateUniqueCompanyCode();

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
      companyId = company.id;
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
      const userCount = await this.userRepository.count({
        where: {
          company_id: company.id,
          status: UserStatus.ACTIVE,
        },
      });

      if (userCount >= company.max_employees) {
        throw new BadRequestException(
          `Company has reached maximum employee limit (${company.max_employees}). Please contact company admin.`,
        );
      }

      companyId = company.id;
      userRole = UserRole.EMPLOYEE;

      console.log(`✅ User joining company: ${company.name} (${company.code})`);
    }

    // Hash password
    const hashedPassword = this.cryptoUtils.hashPassword(registerDto.password);

    // Create user
    const user = this.userRepository.create({
      company_id: companyId,
      email: registerDto.email,
      password_hash: hashedPassword,
      role: userRole,
      first_name: registerDto.first_name.trim(),
      last_name: registerDto.last_name.trim(),
      middle_name: registerDto.middle_name?.trim(),
      phone: registerDto.phone,
      // department_id: null, // Will be assigned later by admin
      position: registerDto.position?.trim(),
      start_date: new Date(),
      status: UserStatus.ACTIVE,
      active: true,
    });

    const savedUser = await this.userRepository.save(user);

    console.log(`✅ New user created: ${savedUser.email}`);

    // Generate JWT
    const payload = {
      user_id: savedUser.id,
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

  /**
   * ADMIN USER CREATION
   * Used by privileged roles to create other users
   * Permission hierarchy enforced
   * Photo upload is queued for background processing
   */
  async createUserByAdmin(
    createUserDto: AdminCreateUserDto,
    actorUserId: string,
    photoBuffer?: Buffer,
    photoMimetype?: string,
  ): Promise<{
    user: User;
    temporary_password: string;
    hcUser: any;
    hcError?: any;
    syncStatus?: string;
    warning?: string;
    photoUploadJobId?: string;
  }> {
    // Get actor user with relations
    const actor = await this.userRepository.findOne({
      where: { id: actorUserId, active: true },
      relations: ['company'],
    });

    if (!actor) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // SOLID: Use PermissionService for validation
    this.permissionService.validateUserCreationPermission(
      actor.role,
      createUserDto.role,
    );

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      // If user exists and is not synced, attempt to sync with HC
      if (existingUser.status !== UserStatus.SYNCED) {
        console.log(
          `⚠️ User already exists but not synced: ${existingUser.email}. Attempting re-sync...`,
        );

        try {
          const hcPersonCode = this.cryptoUtils.generateHcPersonId();

          // Build HC user data - only include fields with values
          const hcResyncData: any = {
            groupId: '1',
            personCode: hcPersonCode,
            firstName: createUserDto.first_name,
            lastName: createUserDto.last_name,
            gender: 2,
            startDate: createUserDto.start_date,
          };

          if (createUserDto.phone) {
            hcResyncData.phone = createUserDto.phone;
          }

          if (createUserDto.end_date) {
            hcResyncData.endDate = createUserDto.end_date;
          }

          const hcResponse =
            await this.hcService.createUserOnCabinet(hcResyncData);

          // Update existing user with HC data
          existingUser.hcPersonId = hcResponse.data?.personId || hcPersonCode;
          existingUser.status = UserStatus.SYNCED;
          await this.userRepository.save(existingUser);

          console.log(
            `✅ Existing user re-synced with HC: ${existingUser.email}`,
          );

          // Queue photo upload for re-synced user (if photo provided)
          let photoUploadJobId: string | undefined;
          if (photoBuffer && photoMimetype && existingUser.hcPersonId) {
            try {
              const photoJobData: PhotoUploadJobDto = {
                userId: existingUser.id,
                hcPersonId: existingUser.hcPersonId,
                photoData: photoBuffer.toString('base64'),
                mimetype: photoMimetype,
                userEmail: existingUser.email,
                createdAt: new Date(),
              };

              photoUploadJobId =
                await this.photoUploadService.queuePhotoUpload(photoJobData);

              console.log(
                `📸 Photo upload queued for re-synced user: ${existingUser.email} (Job ID: ${photoUploadJobId})`,
              );
            } catch (photoQueueError) {
              console.warn(
                `⚠️ Failed to queue photo upload for re-synced user: ${existingUser.email}`,
                photoQueueError.message,
              );
            }
          }

          return {
            user: existingUser,
            hcUser: hcResponse,
            temporary_password:
              'N/A - User already exists (re-synced with HC system)',
            photoUploadJobId,
          };
        } catch (err) {
          existingUser.status = UserStatus.FAILED_SYNC;
          await this.userRepository.save(existingUser);

          console.error(
            `❌ Re-sync failed for existing user: ${existingUser.email}`,
            err.message,
          );

          // Extract HC error details
          let errorMessage = err.message;
          if (err.getResponse && typeof err.getResponse === 'function') {
            const errorResponse = err.getResponse();
            if (typeof errorResponse === 'object') {
              errorMessage = `${errorResponse.error || errorResponse.message} (errorCode: ${errorResponse.errorCode})`;
            }
          }

          throw new ConflictException(
            `User with email ${existingUser.email} already exists but HC sync failed: ${errorMessage}`,
          );
        }
      }

      // User already exists and is fully synced
      throw new ConflictException(
        `Email ${createUserDto.email} is already registered and synced`,
      );
    }

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
        where: { id: createUserDto.company_id },
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

    // SOLID: Use PasswordService for password generation and hashing
    const temporaryPassword = this.passwordService.generateTemporaryPassword();
    const hashedPassword = this.passwordService.hashPassword(temporaryPassword);

    // Validate department_id if provided
    if (createUserDto.department_id) {
      const department = await this.companyRepository
        .createQueryBuilder('company')
        .leftJoinAndSelect('company.departments', 'department')
        .where('department.id = :deptId', {
          deptId: createUserDto.department_id,
        })
        .andWhere('company.id = :companyId', { companyId: targetCompanyId })
        .getOne();

      if (!department) {
        throw new BadRequestException(
          `Department with ID ${createUserDto.department_id} not found in this company`,
        );
      }
    }

    // Validate manager_id if provided
    if (createUserDto.manager_id) {
      const manager = await this.userRepository.findOne({
        where: {
          id: createUserDto.manager_id,
          company_id: targetCompanyId,
          active: true,
        },
      });

      if (!manager) {
        throw new BadRequestException(
          `Manager with ID ${createUserDto.manager_id} not found in this company`,
        );
      }
    }

    let savedUser: User;
    let hcResponse: any;

    try {
      // First, create user in HC system (atomic operation)
      const hcPersonCode = this.cryptoUtils.generateHcPersonId();
      const hcUserData: any = {
        groupId: '1',
        personCode: hcPersonCode,
        firstName: createUserDto.first_name,
        lastName: createUserDto.last_name,
        gender: 2,
        startDate: createUserDto.start_date,
      };

      // Only include optional fields if they have values
      if (createUserDto.phone) {
        hcUserData.phone = createUserDto.phone;
      }

      if (createUserDto.end_date) {
        hcUserData.endDate = createUserDto.end_date;
      }

      console.log('📝 Prepared HC user data:', {
        firstName: createUserDto.first_name,
        lastName: createUserDto.last_name,
        hasPhone: !!createUserDto.phone,
        hasEndDate: !!createUserDto.end_date,
        hcUserData,
      });

      // Step 1: Create user in HC system first
      console.log(`🔄 Creating user in HC system: ${createUserDto.email}`);

      hcResponse = await this.hcService.createUserOnCabinet(hcUserData);

      console.log(
        `✅ User created in HC system: ${createUserDto.email} (HC Person ID: ${hcResponse.data?.personId || hcPersonCode})`,
      );

      // Step 2: Only if HC creation succeeds, save to database
      const newUser = this.userRepository.create({
        password_hash: hashedPassword,
        company_id: targetCompanyId,
        status: UserStatus.SYNCED,
        active: true,
        hcPersonId: hcResponse.data?.personId || hcPersonCode,
        email: createUserDto.email,
        role: createUserDto.role,
        first_name: createUserDto.first_name,
        last_name: createUserDto.last_name,
        middle_name: createUserDto.middle_name,
        phone: createUserDto.phone,
        dob: createUserDto.dob,
        position: createUserDto.position,
        location: createUserDto.location,
        start_date: createUserDto.start_date,
        end_date: createUserDto.end_date,
        tariff_type: createUserDto.tariff_type,
        hourly_rate: createUserDto.hourly_rate,
        monthly_salary: createUserDto.monthly_salary,
        // Only set department_id and manager_id if they exist in the database
        department_id: createUserDto.department_id || null,
        manager_id: createUserDto.manager_id || null,
      });

      savedUser = await this.userRepository.save(newUser);

      console.log(
        `✅ User saved to database: ${savedUser.email} (${savedUser.role})`,
      );

      // Step 3: Bind user to terminal if accessLevelIdList is provided
      if (
        createUserDto.accessLevelIdList &&
        createUserDto.accessLevelIdList.length > 0
      ) {
        try {
          await this.hcService.bindUserWithTerminal(
            savedUser.hcPersonId,
            createUserDto.accessLevelIdList,
          );

          console.log(
            `✅ User bound to terminal: ${savedUser.email} (Access Levels: ${createUserDto.accessLevelIdList.join(', ')})`,
          );
        } catch (bindError) {
          console.warn(
            `⚠️ User created but terminal binding failed: ${savedUser.email}`,
            bindError.message,
          );
          // Don't fail - user is already created in both systems
        }
      }

      // SOLID: Use PhotoUploadService to queue photo upload (if provided)
      let photoUploadJobId: string | undefined;
      if (photoBuffer && photoMimetype && savedUser.hcPersonId) {
        try {
          const photoJobData: PhotoUploadJobDto = {
            userId: savedUser.id,
            hcPersonId: savedUser.hcPersonId,
            photoData: photoBuffer.toString('base64'),
            mimetype: photoMimetype,
            userEmail: savedUser.email,
            createdAt: new Date(),
          };

          photoUploadJobId =
            await this.photoUploadService.queuePhotoUpload(photoJobData);

          console.log(
            `📸 Photo upload queued for user: ${savedUser.email} (Job ID: ${photoUploadJobId})`,
          );
        } catch (photoQueueError) {
          console.warn(
            `⚠️ Failed to queue photo upload for user: ${savedUser.email}`,
            photoQueueError.message,
          );
          // Don't fail user creation if photo queue fails
          // Photo can be uploaded manually later
        }
      }

      // TODO: Send email to new user with temporary password
      // await this.emailService.sendWelcomeEmail(savedUser.email, temporaryPassword);

      return {
        user: savedUser,
        hcUser: hcResponse,
        temporary_password: temporaryPassword,
        photoUploadJobId,
      };
    } catch (error) {
      console.error('❌ Failed to create user:', error.message);
      throw new BadRequestException(
        `Failed to create user: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * GET USER PROFILE - Complete user information
   * Returns full profile with company and statistics
   */
  async getProfile(userId: string): Promise<any> {
    // Get user with all relations
    const user = await this.userRepository.findOne({
      where: { id: userId, active: true },
      relations: ['company', 'company.departments'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Build base profile
    const profile: any = {
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
      hcPersonId: user.hcPersonId,
      photo: user.photo_url,
    };

    // Add company information
    if (user.company) {
      profile.company = {
        company_id: user.company.id,
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

      // SOLID: Use CompanyService for statistics
      profile.company.statistics =
        await this.companyService.getCompanyStatistics(user.company.id);
    }

    // SOLID: Use PermissionService for permissions
    profile.permissions = this.permissionService.getUserPermissions(user.role);

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

    // Update other fields
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

    // SOLID: Use PasswordService
    const temporaryPassword = this.passwordService.generateTemporaryPassword();
    targetUser.password_hash =
      this.passwordService.hashPassword(temporaryPassword);
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
      relations: ['company'],
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
   * UPLOAD USER PHOTO
   * Upload photo to both local database and HC system
   * Accepts either database UUID or HC person ID
   */
  async uploadUserPhoto(
    personId: string,
    photoBuffer: Buffer,
    mimetype: string,
  ): Promise<{ message: string; photo_url: string }> {
    // Check if personId is UUID format or HC person ID
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        personId,
      );

    // Get user by either UUID or HC person ID
    const user = await this.userRepository.findOne({
      where: isUuid
        ? { id: personId, active: true }
        : { hcPersonId: personId, active: true },
    });

    if (!user) {
      throw new NotFoundException(
        `User not found with ${isUuid ? 'ID' : 'HC person ID'}: ${personId}`,
      );
    }

    // Check if user has HC person ID
    if (!user.hcPersonId) {
      throw new BadRequestException(
        'User is not synced with HC system. Cannot upload photo.',
      );
    }

    // Convert buffer to base64
    const photoData = photoBuffer.toString('base64');

    // Save photo locally (as base64 URL for now - can be changed to file storage)
    const photoUrl = `data:${mimetype};base64,${photoData}`;
    user.photo_url = photoUrl;
    await this.userRepository.save(user);

    console.log(`📸 Photo saved locally for user: ${user.email}`);

    // Upload to HC system
    try {
      await this.hcService.uploadUserPhoto(user.hcPersonId, photoData);

      console.log(
        `✅ Photo uploaded to HC system for user: ${user.email} (HC Person ID: ${user.hcPersonId})`,
      );

      return {
        message: 'Photo uploaded successfully to both database and HC system',
        photo_url: photoUrl,
      };
    } catch (hcError) {
      console.warn(
        `⚠️ Photo saved locally but HC upload failed: ${user.email}`,
        hcError.message,
      );

      // Photo is already saved locally, so we return success with warning
      return {
        message:
          'Photo uploaded to database but HC upload failed. Please try again later.',
        photo_url: photoUrl,
      };
    }
  }

  // Note: All helper methods have been moved to specialized services:
  // - validateUserCreationPermissions → PermissionService
  // - generateCompanyCode → CompanyService
  // - generateTemporaryPassword → PasswordService
  // - getCompanyStatistics → CompanyService
  // - getUserPermissions → PermissionService
}
