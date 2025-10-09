// ============================================
// FILE: controllers/device-enrollment.controller.ts
// ============================================

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';

import { UserDeviceMappingService } from '@/modules/attendance';
import { EnrollUserDto } from '../dto';
import { EnrollmentStatus } from '@/modules/attendance';

import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/modules/users/entities/user.entity';

@Controller('attendance/enrollment')
@UseGuards(AuthGuard, RolesGuard)
export class DeviceEnrollmentController {
  constructor(private readonly mappingService: UserDeviceMappingService) {}

  /**
   * Enroll user to device
   * Creates mapping between platform user_id and device terminal_user_id
   */
  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  @HttpCode(HttpStatus.CREATED)
  async enrollUser(
    @Body(ValidationPipe) enrollDto: EnrollUserDto,
    @CurrentUser('user_id') actorId: string,
  ) {
    const mapping = await this.mappingService.enrollUser(enrollDto, actorId);

    return {
      success: true,
      data: mapping,
      message: `User enrolled successfully. Terminal User ID: ${mapping.terminal_user_id}`,
    };
  }

  /**
   * Get mapping by terminal_user_id and device_id
   * Lookup which platform user corresponds to device user
   */
  @Get(':terminalUserId/:deviceId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async getMapping(
    @Param('terminalUserId') terminalUserId: string,
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
  ) {
    const mapping = await this.mappingService.getMapping(
      terminalUserId,
      deviceId,
    );

    if (!mapping) {
      return {
        success: false,
        message: 'Mapping not found',
      };
    }

    return {
      success: true,
      data: mapping,
    };
  }

  /**
   * Get all mappings for a user
   * List all devices where user is enrolled
   */
  @Get('user/:userId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async getUserMappings(@Param('userId', ParseUUIDPipe) userId: string) {
    const mappings = await this.mappingService.getUserMappings(userId);

    return {
      success: true,
      data: mappings,
      total: mappings.length,
    };
  }

  /**
   * Get all mappings for a device
   * List all users enrolled on a device
   */
  @Get('device/:deviceId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async getDeviceMappings(@Param('deviceId', ParseUUIDPipe) deviceId: string) {
    const mappings = await this.mappingService.getDeviceMappings(deviceId);

    return {
      success: true,
      data: mappings,
      total: mappings.length,
    };
  }

  /**
   * Update enrollment status
   * Change status (pending, pending_biometric, completed, etc.)
   */
  @Post(':mappingId/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async updateEnrollmentStatus(
    @Param('mappingId', ParseUUIDPipe) mappingId: string,
    @Body('status') status: EnrollmentStatus,
    @Body('metadata') metadata?: any,
  ) {
    const mapping = await this.mappingService.updateEnrollmentStatus(
      mappingId,
      status,
      metadata,
    );

    return {
      success: true,
      data: mapping,
      message: 'Enrollment status updated successfully',
    };
  }

  /**
   * Update biometric enrollment
   * Mark fingerprint/face as enrolled
   */
  @Post(':mappingId/biometric')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async updateBiometric(
    @Param('mappingId', ParseUUIDPipe) mappingId: string,
    @Body()
    data: {
      fingerprint_enrolled?: boolean;
      fingerprint_count?: number;
      face_enrolled?: boolean;
    },
  ) {
    const mapping = await this.mappingService.updateBiometric(mappingId, data);

    return {
      success: true,
      data: mapping,
      message: 'Biometric enrollment updated successfully',
    };
  }

  /**
   * Deactivate mapping
   * Soft delete - set is_active to false
   */
  @Delete(':mappingId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivateMapping(
    @Param('mappingId', ParseUUIDPipe) mappingId: string,
  ) {
    await this.mappingService.deactivateMapping(mappingId);
    // No content returned for 204
  }

  /**
   * Reactivate mapping
   * Re-enable deactivated mapping
   */
  @Post(':mappingId/reactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async reactivateMapping(
    @Param('mappingId', ParseUUIDPipe) mappingId: string,
  ) {
    const mapping = await this.mappingService.reactivateMapping(mappingId);

    return {
      success: true,
      data: mapping,
      message: 'Mapping reactivated successfully',
    };
  }

  /**
   * Sync mapping with device
   * Update last_sync_at timestamp
   */
  @Post(':mappingId/sync')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async syncMapping(
    @Param('mappingId', ParseUUIDPipe) mappingId: string,
    @Body('metadata') metadata?: any,
  ) {
    const mapping = await this.mappingService.updateSyncStatus(
      mappingId,
      metadata,
    );

    return {
      success: true,
      data: mapping,
      message: 'Mapping synced successfully',
    };
  }

  /**
   * Bulk enroll users
   * Enroll multiple users to a device at once
   */
  @Post('bulk-enroll')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async bulkEnroll(
    @Body()
    data: {
      device_id: string;
      user_ids: string[];
      auto_generate_terminal_id?: boolean;
    },
    @CurrentUser('user_id') actorId: string,
  ) {
    const results = await this.mappingService.bulkEnroll(
      data.device_id,
      data.user_ids,
      actorId,
      data.auto_generate_terminal_id,
    );

    return {
      success: true,
      data: results,
      message: `${results.success.length} users enrolled successfully, ${results.failed.length} failed`,
    };
  }
}
