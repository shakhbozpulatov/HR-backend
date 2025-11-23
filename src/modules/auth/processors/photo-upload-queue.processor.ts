import { Processor, Process, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PhotoUploadJobDto, PhotoUploadResult } from '../dto/photo-upload-job.dto';
import { PhotoUploadService } from '../services/photo-upload.service';

/**
 * Photo Upload Queue Processor
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Only processes photo upload queue jobs
 * - Open/Closed: Easy to add new job types without modifying existing code
 * - Dependency Inversion: Depends on PhotoUploadService abstraction
 *
 * Responsibilities:
 * - Process queued photo upload jobs
 * - Handle job completion and failures
 * - Log job lifecycle events
 */
@Processor('photo-upload')
export class PhotoUploadQueueProcessor {
  private readonly logger = new Logger(PhotoUploadQueueProcessor.name);

  constructor(private readonly photoUploadService: PhotoUploadService) {}

  /**
   * Process upload-photo job
   *
   * @param job - Bull job containing photo upload data
   * @returns Upload result
   */
  @Process('upload-photo')
  async handlePhotoUpload(job: Job<PhotoUploadJobDto>): Promise<PhotoUploadResult> {
    const { data } = job;

    this.logger.log(
      `🎯 Processing photo upload job ${job.id} for user: ${data.userEmail}`,
    );

    try {
      // Delegate to PhotoUploadService (Single Responsibility)
      const result = await this.photoUploadService.processPhotoUpload(data);

      if (!result.success) {
        this.logger.warn(
          `⚠️ Photo upload job ${job.id} completed with warnings: ${result.message}`,
        );
        // Throw error to trigger retry if HC upload failed
        throw new Error(result.error || result.message);
      }

      this.logger.log(
        `✅ Photo upload job ${job.id} completed successfully for user: ${data.userEmail}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `❌ Photo upload job ${job.id} failed for user: ${data.userEmail}`,
        error.stack,
      );
      throw error; // Re-throw to trigger Bull retry mechanism
    }
  }

  /**
   * Handle job completion event
   *
   * @param job - Completed job
   * @param result - Job result
   */
  @OnQueueCompleted()
  async onCompleted(job: Job<PhotoUploadJobDto>, result: PhotoUploadResult) {
    const { data } = job;

    this.logger.log(
      `🎉 Photo upload completed for user: ${data.userEmail} (Job ${job.id})`,
    );
    this.logger.debug(`Result: ${JSON.stringify(result)}`);
  }

  /**
   * Handle job failure event
   *
   * @param job - Failed job
   * @param error - Error that caused failure
   */
  @OnQueueFailed()
  async onFailed(job: Job<PhotoUploadJobDto>, error: Error) {
    const { data } = job;

    this.logger.error(
      `💥 Photo upload failed for user: ${data.userEmail} (Job ${job.id})`,
      error.stack,
    );

    // Log failure details for debugging
    this.logger.error(`Job attempts: ${job.attemptsMade}/${job.opts.attempts}`);
    this.logger.error(`HC Person ID: ${data.hcPersonId}`);
    this.logger.error(`Photo size: ${data.photoData.length} characters`);

    // After all retries exhausted, the job will be marked as failed
    if (job.attemptsMade >= (job.opts.attempts || 3)) {
      this.logger.error(
        `🚨 Photo upload permanently failed for user: ${data.userEmail} after ${job.attemptsMade} attempts`,
      );
      // Here you could:
      // - Send notification to admin
      // - Update user status in database
      // - Log to monitoring system
    }
  }
}