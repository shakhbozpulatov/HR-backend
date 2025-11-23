import {
  PhotoUploadJobDto,
  PhotoUploadResult,
} from '../dto/photo-upload-job.dto';

/**
 * Photo Upload Service Interface
 *
 * SOLID Principles:
 * - Interface Segregation: Focused interface for photo upload operations
 * - Dependency Inversion: High-level modules depend on this abstraction
 *
 * This interface defines the contract for photo upload services,
 * allowing different implementations (queue-based, direct upload, etc.)
 */
export interface IPhotoUploadService {
  /**
   * Process photo upload job
   * @param jobData - Photo upload job data
   * @returns Upload result with success status
   */
  processPhotoUpload(jobData: PhotoUploadJobDto): Promise<PhotoUploadResult>;

  /**
   * Queue photo upload for background processing
   * @param jobData - Photo upload job data
   * @returns Job ID for tracking
   */
  queuePhotoUpload(jobData: PhotoUploadJobDto): Promise<string>;

  /**
   * Retry failed photo upload
   * @param userId - User ID to retry upload for
   * @returns Upload result
   */
  retryPhotoUpload(userId: string): Promise<PhotoUploadResult>;
}
