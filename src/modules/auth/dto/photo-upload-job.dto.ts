/**
 * Photo Upload Job DTO
 *
 * Single Responsibility: Data structure for photo upload queue jobs
 * Used by queue processor to upload user photos to HC system
 */
export class PhotoUploadJobDto {
  /**
   * User's database ID
   */
  userId: string;

  /**
   * HC person ID (required for HC API)
   */
  hcPersonId: string;

  /**
   * Base64 encoded photo data
   */
  photoData: string;

  /**
   * Photo MIME type (e.g., image/jpeg, image/png)
   */
  mimetype: string;

  /**
   * User email for logging purposes
   */
  userEmail: string;

  /**
   * Job metadata
   */
  createdAt: Date;
}

/**
 * Photo Upload Result
 *
 * Single Responsibility: Structure for photo upload results
 */
export interface PhotoUploadResult {
  success: boolean;
  message: string;
  photo_url?: string;
  error?: string;
}