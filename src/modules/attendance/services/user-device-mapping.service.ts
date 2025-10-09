// ============================================
// FILE: services/user-device-mapping.service.ts
// Complete UserDeviceMappingService with all methods
// ============================================

import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDeviceMapping, EnrollmentStatus } from '@/modules/attendance';

@Injectable()
export class UserDeviceMappingService {
  private readonly logger = new Logger(UserDeviceMappingService.name);

  constructor(
    @InjectRepository(UserDeviceMapping)
    private mappingRepository: Repository<UserDeviceMapping>,
  ) {}

  /**
   * Enroll user to device with auto-generated terminal ID
   */
  async enrollUser(
    enrollDto: any,
    actorId: string,
  ): Promise<UserDeviceMapping> {
    // Check if already enrolled
    const existingMapping = await this.mappingRepository.findOne({
      where: {
        user_id: enrollDto.user_id,
        device_id: enrollDto.device_id,
      },
    });

    if (existingMapping) {
      throw new ConflictException('User already enrolled on this device');
    }

    // Generate terminal_user_id if not provided
    let terminalUserId = enrollDto.terminal_user_id;
    if (!terminalUserId && enrollDto.auto_generate_terminal_id) {
      terminalUserId = await this.generateTerminalUserId(enrollDto.device_id);
    }

    // Create mapping
    const mapping = this.mappingRepository.create({
      user_id: enrollDto.user_id,
      terminal_user_id: terminalUserId.toString(),
      device_id: enrollDto.device_id,
      card_number: enrollDto.card_number,
      pin_code: enrollDto.pin_code,
      enrollment_status: EnrollmentStatus.PENDING_BIOMETRIC,
      enrolled_by: actorId,
      enrolled_at: new Date(),
    });

    const saved = await this.mappingRepository.save(mapping);

    this.logger.log(
      `User ${enrollDto.user_id} enrolled to device ${enrollDto.device_id} with terminal_id: ${terminalUserId}`,
    );

    return saved;
  }

  /**
   * Generate next available terminal user ID
   */
  private async generateTerminalUserId(deviceId: string): Promise<number> {
    const lastMapping = await this.mappingRepository
      .createQueryBuilder('mapping')
      .where('mapping.device_id = :deviceId', { deviceId })
      .andWhere("mapping.terminal_user_id ~ '^[0-9]+$'") // Only numeric IDs
      .orderBy('CAST(mapping.terminal_user_id AS INTEGER)', 'DESC')
      .getOne();

    if (!lastMapping) {
      return 1;
    }

    const lastId = parseInt(lastMapping.terminal_user_id);
    return isNaN(lastId) ? 1 : lastId + 1;
  }

  /**
   * Get mapping by terminal_user_id and device_id
   */
  async getMapping(
    terminalUserId: string,
    deviceId: string,
  ): Promise<UserDeviceMapping | null> {
    return await this.mappingRepository.findOne({
      where: {
        terminal_user_id: terminalUserId,
        device_id: deviceId,
        is_active: true,
      },
      relations: ['user', 'device'],
    });
  }

  /**
   * Get all mappings for a user
   */
  async getUserMappings(userId: string): Promise<UserDeviceMapping[]> {
    return await this.mappingRepository.find({
      where: {
        user_id: userId,
        is_active: true,
      },
      relations: ['device'],
      order: {
        created_at: 'DESC',
      },
    });
  }

  /**
   * Get all mappings for a device
   */
  async getDeviceMappings(deviceId: string): Promise<UserDeviceMapping[]> {
    return await this.mappingRepository.find({
      where: {
        device_id: deviceId,
        is_active: true,
      },
      relations: ['user'],
      order: {
        terminal_user_id: 'ASC',
      },
    });
  }

  /**
   * Update enrollment status
   */
  async updateEnrollmentStatus(
    mappingId: string,
    status: EnrollmentStatus,
    metadata?: any,
  ): Promise<UserDeviceMapping> {
    const mapping = await this.mappingRepository.findOne({
      where: { mapping_id: mappingId },
    });

    if (!mapping) {
      throw new NotFoundException('Mapping not found');
    }

    mapping.enrollment_status = status;
    mapping.last_sync_at = new Date();

    if (metadata) {
      mapping.sync_metadata = {
        ...mapping.sync_metadata,
        ...metadata,
        updated_at: new Date(),
      };
    }

    const saved = await this.mappingRepository.save(mapping);

    this.logger.log(`Mapping ${mappingId} status updated to ${status}`);

    return saved;
  }

  /**
   * Update biometric enrollment status
   */
  async updateBiometric(
    mappingId: string,
    data: {
      fingerprint_enrolled?: boolean;
      fingerprint_count?: number;
      face_enrolled?: boolean;
    },
  ): Promise<UserDeviceMapping> {
    const mapping = await this.mappingRepository.findOne({
      where: { mapping_id: mappingId },
    });

    if (!mapping) {
      throw new NotFoundException('Mapping not found');
    }

    // Update biometric fields
    if (data.fingerprint_enrolled !== undefined) {
      mapping.fingerprint_enrolled = data.fingerprint_enrolled;
    }

    if (data.fingerprint_count !== undefined) {
      mapping.fingerprint_count = data.fingerprint_count;
    }

    if (data.face_enrolled !== undefined) {
      mapping.face_enrolled = data.face_enrolled;
    }

    // Update enrollment status if biometrics are enrolled
    if (
      (mapping.fingerprint_enrolled || mapping.face_enrolled) &&
      mapping.enrollment_status === EnrollmentStatus.PENDING_BIOMETRIC
    ) {
      mapping.enrollment_status = EnrollmentStatus.COMPLETED;
    }

    mapping.last_sync_at = new Date();

    const saved = await this.mappingRepository.save(mapping);

    this.logger.log(`Biometric data updated for mapping ${mappingId}`);

    return saved;
  }

  /**
   * Deactivate mapping
   */
  async deactivateMapping(mappingId: string): Promise<void> {
    const mapping = await this.mappingRepository.findOne({
      where: { mapping_id: mappingId },
    });

    if (!mapping) {
      throw new NotFoundException('Mapping not found');
    }

    mapping.is_active = false;

    await this.mappingRepository.save(mapping);

    this.logger.log(`Mapping ${mappingId} deactivated`);
  }

  /**
   * Reactivate mapping
   */
  async reactivateMapping(mappingId: string): Promise<UserDeviceMapping> {
    const mapping = await this.mappingRepository.findOne({
      where: { mapping_id: mappingId },
    });

    if (!mapping) {
      throw new NotFoundException('Mapping not found');
    }

    mapping.is_active = true;

    const saved = await this.mappingRepository.save(mapping);

    this.logger.log(`Mapping ${mappingId} reactivated`);

    return saved;
  }

  /**
   * Update sync status
   */
  async updateSyncStatus(
    mappingId: string,
    metadata?: any,
  ): Promise<UserDeviceMapping> {
    const mapping = await this.mappingRepository.findOne({
      where: { mapping_id: mappingId },
    });

    if (!mapping) {
      throw new NotFoundException('Mapping not found');
    }

    mapping.last_sync_at = new Date();

    if (metadata) {
      mapping.sync_metadata = {
        ...mapping.sync_metadata,
        ...metadata,
        last_sync: new Date().toISOString(),
      };
    }

    const saved = await this.mappingRepository.save(mapping);

    this.logger.log(`Sync status updated for mapping ${mappingId}`);

    return saved;
  }

  /**
   * Bulk enroll users to a device
   */
  async bulkEnroll(
    deviceId: string,
    userIds: string[],
    actorId: string,
    autoGenerateTerminalId: boolean = true,
  ): Promise<{
    success: UserDeviceMapping[];
    failed: Array<{ user_id: string; error: string }>;
  }> {
    const success: UserDeviceMapping[] = [];
    const failed: Array<{ user_id: string; error: string }> = [];

    for (const userId of userIds) {
      try {
        const mapping = await this.enrollUser(
          {
            user_id: userId,
            device_id: deviceId,
            auto_generate_terminal_id: autoGenerateTerminalId,
          },
          actorId,
        );

        success.push(mapping);
      } catch (error) {
        failed.push({
          user_id: userId,
          error: error.message,
        });

        this.logger.warn(
          `Failed to enroll user ${userId} to device ${deviceId}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Bulk enrollment completed. Success: ${success.length}, Failed: ${failed.length}`,
    );

    return { success, failed };
  }

  /**
   * Delete mapping permanently (use with caution)
   */
  async deleteMapping(mappingId: string): Promise<void> {
    const result = await this.mappingRepository.delete({
      mapping_id: mappingId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Mapping not found');
    }

    this.logger.log(`Mapping ${mappingId} deleted permanently`);
  }

  /**
   * Get mapping by ID
   */
  async getMappingById(mappingId: string): Promise<UserDeviceMapping> {
    const mapping = await this.mappingRepository.findOne({
      where: { mapping_id: mappingId },
      relations: ['user', 'device'],
    });

    if (!mapping) {
      throw new NotFoundException('Mapping not found');
    }

    return mapping;
  }

  /**
   * Check if user is enrolled on device
   */
  async isUserEnrolled(userId: string, deviceId: string): Promise<boolean> {
    const count = await this.mappingRepository.count({
      where: {
        user_id: userId,
        device_id: deviceId,
        is_active: true,
      },
    });

    return count > 0;
  }

  /**
   * Get enrollment statistics for a device
   */
  async getDeviceEnrollmentStats(deviceId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    pending: number;
    completed: number;
    failed: number;
  }> {
    const mappings = await this.mappingRepository.find({
      where: { device_id: deviceId },
    });

    return {
      total: mappings.length,
      active: mappings.filter((m) => m.is_active).length,
      inactive: mappings.filter((m) => !m.is_active).length,
      pending: mappings.filter(
        (m) =>
          m.enrollment_status === EnrollmentStatus.PENDING ||
          m.enrollment_status === EnrollmentStatus.PENDING_BIOMETRIC,
      ).length,
      completed: mappings.filter(
        (m) => m.enrollment_status === EnrollmentStatus.COMPLETED,
      ).length,
      failed: mappings.filter(
        (m) => m.enrollment_status === EnrollmentStatus.FAILED,
      ).length,
    };
  }

  /**
   * Get enrollment statistics for a user
   */
  async getUserEnrollmentStats(userId: string): Promise<{
    total_devices: number;
    active_devices: number;
    pending_devices: number;
  }> {
    const mappings = await this.mappingRepository.find({
      where: { user_id: userId },
    });

    return {
      total_devices: mappings.length,
      active_devices: mappings.filter((m) => m.is_active).length,
      pending_devices: mappings.filter(
        (m) =>
          m.is_active &&
          (m.enrollment_status === EnrollmentStatus.PENDING ||
            m.enrollment_status === EnrollmentStatus.PENDING_BIOMETRIC),
      ).length,
    };
  }
}
