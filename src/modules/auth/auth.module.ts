import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '@/modules/users/entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { CryptoUtils } from '@/common/utils/crypto.utils';

@Module({
  imports: [TypeOrmModule.forFeature([User]), PassportModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, CryptoUtils],
  exports: [AuthService],
})
export class AuthModule {}
