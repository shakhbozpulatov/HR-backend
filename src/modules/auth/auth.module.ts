import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { BullModule } from '@nestjs/bull';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '@/modules/users/entities/user.entity';
import { Company } from '@/modules/company/entities/company.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { CryptoUtils } from '@/common/utils/crypto.utils';
import { HcService } from '@/modules/hc/hc.service';
import { HcApiConfig } from '@/modules/hc/config/hc-api.config';
import { HcApiClient } from '@/modules/hc/services/hc-api-client.service';

// SOLID: Specialized services
import { PasswordService } from './services/password.service';
import { PermissionService } from './services/permission.service';
import { CompanyService } from './services/company.service';
import { PhotoUploadService } from './services/photo-upload.service';
import { HcAuthService } from '@/modules/hc/services/hc-auth.service';

// Queue processor
import { PhotoUploadQueueProcessor } from './processors/photo-upload-queue.processor';

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
 * - PhotoUploadService: Background photo upload processing
 * - HcService: HC Cabinet integration
 *
 * Queue:
 * - photo-upload: Background processing of user photo uploads to HC system
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company]),
    PassportModule,
    // Register photo upload queue
    BullModule.registerQueue({
      name: 'photo-upload',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 seconds, then 4s, 8s
        },
        removeOnComplete: true,
        removeOnFail: false, // Keep failed jobs for debugging
      },
    }),
  ],
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
    PhotoUploadService,
    HcAuthService,

    // HC Integration services
    HcService,
    HcApiConfig,
    HcApiClient,

    // Queue processor
    PhotoUploadQueueProcessor,
  ],
  exports: [
    AuthService,
    PasswordService, // Export for use in other modules
    PermissionService, // Export for use in other modules
    PhotoUploadService, // Export for manual photo upload operations
  ],
})
export class AuthModule {}
