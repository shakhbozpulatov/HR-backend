import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '@/modules/users/entities/user.entity';
import { Company } from '@/modules/company/entities/company.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { CryptoUtils } from '@/common/utils/crypto.utils';
import { HcService } from '@/modules/hc/hc.service';
import { HcApiConfig } from '@/modules/hc/config/hc-api.config';
import { HcApiClient } from '@/modules/hc/services/hc-api-client.service';

// SOLID: New specialized services
import { PasswordService } from './services/password.service';
import { PermissionService } from './services/permission.service';
import { CompanyService } from './services/company.service';
import { HcAuthService } from '@/modules/hc/services/hc-auth.service';

/**
 * Auth Module
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Each service handles one specific concern
 * - Interface Segregation: Small, focused interfaces for each service
 * - Dependency Inversion: Services depend on abstractions (interfaces)
 * - Open/Closed: Easy to extend with new services
 *
 * Services:
 * - AuthService: Main authentication service (login, register, user creation)
 * - PasswordService: Password hashing, comparison, generation
 * - PermissionService: Role-based permission validation
 * - CompanyService: Company-related operations (code generation, statistics)
 * - HcService: HC Cabinet integration
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, Company]), PassportModule],
  controllers: [AuthController],
  providers: [
    // Core services
    AuthService,
    JwtStrategy,
    CryptoUtils,

    // SOLID: Specialized services (SRP - Single Responsibility Principle)
    PasswordService,
    PermissionService,
    CompanyService,
    HcAuthService,

    // HC Integration services
    HcService,
    HcApiConfig,
    HcApiClient,
  ],
  exports: [
    AuthService,
    PasswordService, // Export for use in other modules
    PermissionService, // Export for use in other modules
  ],
})
export class AuthModule {}
