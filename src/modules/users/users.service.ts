import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CryptoUtils } from '@/common/utils/crypto.utils';
import { HcService } from '@/modules/hc/hc.service';
import { HcDateFormatter } from '@/modules/hc/utils/hc-date.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private cryptoUtils: CryptoUtils,
    private hcService: HcService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Hash password
    const hashedPassword = this.cryptoUtils.hashPassword(
      createUserDto.password,
    );

    // Create new entity
    const user = this.userRepository.create({
      ...createUserDto,
      password_hash: hashedPassword,
    });

    // Save and return single User
    return await this.userRepository.save(user);
  }

  async findAll(role: UserRole, company_id: string): Promise<User[]> {
    if (role === UserRole.SUPER_ADMIN) {
      return await this.userRepository.find();
    }
    return await this.userRepository.find({
      where: {
        company_id,
        role: Not(In([UserRole.SUPER_ADMIN, UserRole.COMPANY_OWNER])),
      },
    });
  }

  async findOne(id: string, user: any): Promise<User> {
    const targetUser = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'role', 'active', 'created_at', 'company_id'],
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

    return targetUser;
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
      updateUserDto.password = this.cryptoUtils.hashPassword(
        updateUserDto.password,
      );
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
