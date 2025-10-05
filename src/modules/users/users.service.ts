import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CryptoUtils } from '@/common/utils/crypto.utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private cryptoUtils: CryptoUtils,
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
    const user = await this.findOne(id, company);

    if (updateUserDto.password) {
      updateUserDto.password = this.cryptoUtils.hashPassword(
        updateUserDto.password,
      );
    }

    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async remove(id: string, company: string): Promise<void> {
    const user = await this.findOne(id, company);
    user.active = false;
    await this.userRepository.save(user);
  }
}
