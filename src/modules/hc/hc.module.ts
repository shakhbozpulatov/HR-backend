import { Module } from '@nestjs/common';
import { HcService } from './hc.service';
import { HcApiClient } from './services/hc-api-client.service';
import { HcAuthService } from './services/hc-auth.service';
import { HcApiConfig } from './config/hc-api.config';

/**
 * HC Module
 * Provides all HC-related services following SOLID principles
 */
@Module({
  providers: [
    HcApiConfig, // Configuration service
    HcAuthService, // Authentication service (token management)
    HcApiClient, // HTTP client service
    HcService, // Main business logic service
  ],
  exports: [HcService], // Only export the main service
})
export class HcModule {}
