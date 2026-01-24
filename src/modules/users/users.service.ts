import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CryptoUtils } from '@/common/utils/crypto.utils';
import { HcService } from '@/modules/hc/hc.service';
import { HcDateFormatter } from '@/modules/hc/utils/hc-date.util';
import { UserPhotoStorageService } from '@/common/services/user-photo-storage.service';
import { GetUsersDto } from './dto/get-users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private cryptoUtils: CryptoUtils,
    private hcService: HcService,
    private userPhotoStorage: UserPhotoStorageService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    photo?: Express.Multer.File,
  ): Promise<any> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    if (!photo?.buffer) {
      throw new BadRequestException('User photo is required');
    }

    // Hash password
    const hashedPassword = this.cryptoUtils.hashPassword(
      createUserDto.password,
    );

    // Create new entity
    const { password: _password, ...rest } = createUserDto as any;
    const user = this.userRepository.create({
      ...rest,
      password_hash: hashedPassword,
    });

    // Save and return single User
    const savedAny = await this.userRepository.save(user as any);
    const saved = Array.isArray(savedAny) ? savedAny[0] : savedAny;

    const photoPath = await this.userPhotoStorage.saveUserPhotoFromBuffer(
      saved.id,
      photo.buffer,
      photo.mimetype,
    );
    saved.photo_url = photoPath;
    await this.userRepository.save(saved);

    return this.toUserResponse(saved);
  }

  async findAll(
    role: UserRole,
    company_id: string,
    dto: GetUsersDto,
  ): Promise<{
    data: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;

    const qb = this.userRepository.createQueryBuilder('u');

    // Never return secrets
    qb.select([
      'u.id',
      'u.email',
      'u.role',
      'u.company_id',
      'u.active',
      'u.status',
      'u.first_name',
      'u.last_name',
      'u.middle_name',
      'u.phone',
      'u.department_id',
      'u.position',
      'u.start_date',
      'u.end_date',
      'u.photo_url',
      'u.created_at',
      'u.updated_at',
    ]);

    if (role !== UserRole.SUPER_ADMIN) {
      qb.andWhere('u.company_id = :company_id', { company_id });
      qb.andWhere('u.role NOT IN (:...blockedRoles)', {
        blockedRoles: [UserRole.SUPER_ADMIN, UserRole.COMPANY_OWNER],
      });
    }

    const [users, total] = await qb
      .orderBy('u.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Migrate legacy base64 photos to file paths (no Base64 returned)
    await Promise.all(users.map((u) => this.migratePhotoIfNeeded(u)));

    return {
      data: users.map((u) => this.toUserResponse(u)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: any): Promise<any> {
    const targetUser = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'role',
        'active',
        'created_at',
        'company_id',
        'status',
        'first_name',
        'last_name',
        'middle_name',
        'phone',
        'department_id',
        'position',
        'start_date',
        'end_date',
        'photo_url',
      ],
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // 🔒 Agar SUPER_ADMIN bo‘lmasa — faqat o‘z kompaniyasini ko‘ra oladi
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      targetUser.company_id !== user.company_id
    ) {
      throw new ForbiddenException(
        'Access denied: user belongs to another company',
      );
    }

    await this.migratePhotoIfNeeded(targetUser);
    return this.toUserResponse(targetUser) as any;
  }

  private toUserResponse(u: User) {
    return {
      id: u.id,
      email: u.email,
      role: u.role,
      company_id: u.company_id,
      active: u.active,
      status: u.status,
      first_name: u.first_name,
      last_name: u.last_name,
      middle_name: u.middle_name,
      phone: u.phone,
      department_id: u.department_id,
      position: u.position,
      start_date: u.start_date,
      end_date: u.end_date,
      photo_url: u.photo_url ? `/${u.photo_url}` : null,
      created_at: u.created_at,
      updated_at: u.updated_at,
    };
  }

  private async migratePhotoIfNeeded(u: User): Promise<void> {
    if (!u?.photo_url) return;
    if (!this.userPhotoStorage.isDataUrl(u.photo_url)) return;

    const migrated = await this.userPhotoStorage.saveUserPhotoFromDataUrl(
      u.id,
      u.photo_url,
    );
    u.photo_url = migrated.path;
    await this.userRepository.save(u);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    company: any,
  ): Promise<User> {
    // Get full user data including hcPersonId
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check company access
    if (
      company.role !== UserRole.SUPER_ADMIN &&
      user.company_id !== company.company_id
    ) {
      throw new ForbiddenException(
        'Access denied: user belongs to another company',
      );
    }

    // Check if email is being updated and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    if (updateUserDto.password) {
      // NOTE: entity column is password_hash
      (updateUserDto as any).password_hash = this.cryptoUtils.hashPassword(
        updateUserDto.password,
      );
      delete (updateUserDto as any).password;
    }

    // Apply updates to user entity
    Object.assign(user, updateUserDto);

    // Update HC Cabinet if user is synced
    if (user.hcPersonId) {
      try {
        // Get current user data from HC Cabinet
        const hcUserResponse = await this.hcService.getUserFromCabinet(
          user.hcPersonId,
        );

        if (hcUserResponse.data?.personInfo) {
          const hcUser = hcUserResponse.data.personInfo;

          // Prepare update data with all required fields
          const hcUpdateData: any = {
            groupId: hcUser.groupId,
            personCode: hcUser.personCode,
            firstName: user.first_name || hcUser.firstName,
            lastName: user.last_name || hcUser.lastName,
            gender: hcUser.gender,
          };

          // Add phone if updated
          if (updateUserDto.phone !== undefined) {
            hcUpdateData.phone = user.phone || '';
          }

          // Add startDate if updated
          if (updateUserDto.start_date) {
            hcUpdateData.startDate = HcDateFormatter.toHcFormat(
              user.start_date,
            );
          } else if (hcUser.startDate) {
            // Keep existing startDate
            hcUpdateData.startDate = HcDateFormatter.toHcFormat(
              new Date(hcUser.startDate),
            );
          }

          // Add endDate if updated
          if (updateUserDto.end_date) {
            hcUpdateData.endDate = HcDateFormatter.toHcFormat(user.end_date);
          } else if (hcUser.endDate) {
            // Keep existing endDate if any
            hcUpdateData.endDate = HcDateFormatter.toHcFormat(
              new Date(hcUser.endDate),
            );
          }

          // Update HC Cabinet
          await this.hcService.updateUserOnCabinet(
            user.hcPersonId,
            hcUpdateData,
          );
          console.log('✅ HC Cabinet updated for user:', user.hcPersonId);
        }
      } catch (error) {
        console.error('❌ Failed to update HC Cabinet:', error.message);
        // Continue with local update even if HC update fails
      }
    }

    return await this.userRepository.save(user);
  }

  async remove(id: string, company: any): Promise<void> {
    // Find user with hcPersonId
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check company access
    if (
      company.role !== UserRole.SUPER_ADMIN &&
      user.company_id !== company.company_id
    ) {
      throw new ForbiddenException(
        'Access denied: user belongs to another company',
      );
    }

    // Set user as inactive
    user.active = false;
    user.status = UserStatus.INACTIVE;

    // Update HC Cabinet endDate if user is synced with HC
    if (user.hcPersonId) {
      try {
        // Get current user data from HC Cabinet
        const hcUserResponse = await this.hcService.getUserFromCabinet(
          user.hcPersonId,
        );

        if (hcUserResponse.data?.personInfo) {
          const hcUser = hcUserResponse.data.personInfo;
          const now = HcDateFormatter.toHcFormat(new Date());

          // Update user with all required fields and set both dates to now
          await this.hcService.updateUserOnCabinet(user.hcPersonId, {
            groupId: hcUser.groupId,
            personCode: hcUser.personCode,
            firstName: hcUser.firstName,
            lastName: hcUser.lastName,
            gender: hcUser.gender,
            startDate: now,
            endDate: now,
          });
          console.log(
            '✅ HC Cabinet dates updated to now for user:',
            user.hcPersonId,
          );
        }
      } catch (error) {
        console.error('❌ Failed to update HC Cabinet:', error.message);
        // Continue with local update even if HC update fails
      }
    }

    await this.userRepository.save(user);
  }
}
