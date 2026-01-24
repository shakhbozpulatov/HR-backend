import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Repository } from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { HcService } from '@/modules/hc/hc.service';
import { UserPhotoStorageService } from '@/common/services/user-photo-storage.service';
import { readFile } from 'fs/promises';
import {
  PhotoUploadJobDto,
  PhotoUploadResult,
} from '../dto/photo-upload-job.dto';
import { IPhotoUploadService } from '../interfaces/photo-upload-service.interface';

/**
 * Photo Upload Service
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Handles only photo upload operations
 * - Open/Closed: Easy to extend with new upload strategies
 * - Liskov Substitution: Implements IPhotoUploadService interface
 * - Interface Segregation: Uses focused interfaces
 * - Dependency Inversion: Depends on HcService abstraction
 *
 * Responsibilities:
 * - Queue photo uploads for background processing
 * - Process photo uploads to HC system
 * - Handle upload retries and failures
 * - Update user records with photo URLs
 */
@Injectable()
export class PhotoUploadService implements IPhotoUploadService {
  private readonly logger = new Logger(PhotoUploadService.name);

  constructor(
    @InjectQueue('photo-upload') private photoUploadQueue: Queue,
    @InjectRepository(User) private userRepository: Repository<User>,
    private hcService: HcService,
    private userPhotoStorage: UserPhotoStorageService,
  ) {}

  /**
   * Queue photo upload for background processing
   *
   * @param jobData - Photo upload job data
   * @returns Job ID for tracking
   */
  async queuePhotoUpload(jobData: PhotoUploadJobDto): Promise<string> {
    this.logger.log(
      `📤 Queuing photo upload for user: ${jobData.userEmail} (HC: ${jobData.hcPersonId})`,
    );

    const job = await this.photoUploadQueue.add('upload-photo', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false, // Keep failed jobs for debugging
    });

    this.logger.log(
      `✅ Photo upload job queued with ID: ${job.id} for user: ${jobData.userEmail}`,
    );

    return job.id.toString();
  }

  /**
   * Process photo upload job
   * Called by queue processor
   *
   * @param jobData - Photo upload job data
   * @returns Upload result with success status
   */
  async processPhotoUpload(
    jobData: PhotoUploadJobDto,
  ): Promise<PhotoUploadResult> {
    this.logger.log(
      `🔄 Processing photo upload for user: ${jobData.userEmail}`,
    );

    try {
      // 1. Find user in database
      const user = await this.userRepository.findOne({
        where: { id: jobData.userId },
      });

      if (!user) {
        throw new NotFoundException(`User not found: ${jobData.userId}`);
      }

      // 2. Create photo URL for local storage (data URL)
      const photoPath = await this.userPhotoStorage.saveUserPhotoFromBase64(
        user.id,
        jobData.photoData,
        jobData.mimetype,
      );

      // 3. Save photo path locally first (ensures we have a backup)
      user.photo_url = photoPath;
      await this.userRepository.save(user);

      this.logger.log(
        `💾 Photo saved locally for user: ${jobData.userEmail}`,
      );

      // 4. Upload to HC system
      try {
        await this.hcService.uploadUserPhoto(
          jobData.hcPersonId,
          jobData.photoData,
        );

        this.logger.log(
          `✅ Photo uploaded to HC system for user: ${jobData.userEmail} (HC: ${jobData.hcPersonId})`,
        );

        return {
          success: true,
          message:
            'Photo uploaded successfully to both database and HC system',
          photo_url: photoPath,
        };
      } catch (hcError) {
        // HC upload failed, but local save succeeded
        this.logger.warn(
          `⚠️ Photo saved locally but HC upload failed for user: ${jobData.userEmail}`,
          hcError.message,
        );

        // Don't throw error - photo is saved locally
        // Job processor will retry if needed
        return {
          success: false,
          message: 'Photo saved locally but HC upload failed',
          photo_url: photoPath,
          error: hcError.message,
        };
      }
    } catch (error) {
      this.logger.error(
        `❌ Photo upload processing failed for user: ${jobData.userEmail}`,
        error.stack,
      );

      return {
        success: false,
        message: 'Photo upload failed',
        error: error.message,
      };
    }
  }

  /**
   * Retry failed photo upload for a user
   *
   * @param userId - User ID to retry upload for
   * @returns Upload result
   */
  async retryPhotoUpload(userId: string): Promise<PhotoUploadResult> {
    this.logger.log(`🔁 Retrying photo upload for user ID: ${userId}`);

    // Find user with photo data
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User not found: ${userId}`);
    }

    if (!user.photo_url) {
      throw new NotFoundException(`User has no photo to retry: ${userId}`);
    }

    if (!user.hcPersonId) {
      throw new NotFoundException(
        `User is not synced with HC system: ${userId}`,
      );
    }

    let mimetype: string;
    let photoData: string;

    // Legacy: base64 data URL stored in DB
    const matches = user.photo_url.match(/^data:(.+);base64,(.+)$/);
    if (matches) {
      mimetype = matches[1];
      photoData = matches[2];
    } else {
      // Current: file path stored in DB → read and convert to base64 for HC upload
      const absPath = this.userPhotoStorage.toAbsolutePath(user.photo_url);
      const buf = await readFile(absPath);
      mimetype = this.userPhotoStorage.contentTypeFromPath(absPath);
      photoData = buf.toString('base64');
    }

    // Queue photo upload
    const jobData: PhotoUploadJobDto = {
      userId: user.id,
      hcPersonId: user.hcPersonId,
      photoData,
      mimetype,
      userEmail: user.email,
      createdAt: new Date(),
    };

    await this.queuePhotoUpload(jobData);

    return {
      success: true,
      message: 'Photo upload retry queued successfully',
    };
  }
}