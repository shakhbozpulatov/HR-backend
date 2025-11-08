import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '@/modules/users/entities/user.entity';
import { Company } from '@/modules/company/entities/company.entity'; // ← QO'SHILDI
import { JwtStrategy } from './strategies/jwt.strategy';
import { CryptoUtils } from '@/common/utils/crypto.utils';
import { HcService } from '@/modules/hc/hc.service';
import { HcApiConfig } from '@/modules/hc/config/hc-api.config';
import { HcApiClient } from '@/modules/hc/services/hc-api-client.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Company, // ← MUHIM: Company entity qo'shildi
    ]),
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    CryptoUtils,
    HcService,
    HcApiConfig,
    HcApiClient,
  ],
  exports: [AuthService],
})
export class AuthModule {}
