import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '@/modules/users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { CryptoUtils } from '@/common/utils/crypto.utils';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

  async validateUser(payload: any): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { user_id: payload.sub, active: true },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
