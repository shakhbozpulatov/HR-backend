// ============================================
// FILE: processors/attendance-queue.processor.ts
// Bull Queue Processor for Attendance Jobs
// ============================================

import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  OnQueueError,
  OnQueueStalled,
} from '@nestjs/bull';
import { Job } from 'bull';
import { Logger, Injectable } from '@nestjs/common';
import { AttendanceProcessorService } from '@/modules/attendance';

@Injectable()
@Processor('attendance')
export class AttendanceQueueProcessor {
  private readonly logger = new Logger(AttendanceQueueProcessor.name);

  constructor(
    private readonly attendanceProcessor: AttendanceProcessorService,
  ) {}

  /**
   * Process single employee day
   * Called when an event is received or manual reprocess is triggered
   */
  @Process('process-employee-day')
  async processEmployeeDay(
    job: Job<{
      employeeId: string;
      date: string;
      triggeredBy?: string;
      priority?: number;
    }>,
  ) {
    const { employeeId, date, triggeredBy } = job.data;

    try {
      this.logger.log(
        `[Job ${job.id}] Processing attendance for employee ${employeeId} on ${date}`,
      );

      // Update job progress
      await job.progress(10);

      const record = await this.attendanceProcessor.processEmployeeDay(
        employeeId,
        new Date(date),
        triggeredBy,
      );

      await job.progress(100);

      this.logger.log(
        `[Job ${job.id}] Successfully processed attendance. Status: ${record.status}`,
      );

      return {
        success: true,
        record_id: record.record_id,
        status: record.status,
        worked_minutes: record.worked_minutes,
        late_minutes: record.late_minutes,
        overtime_minutes: record.overtime_minutes,
      };
    } catch (error) {
      this.logger.error(
        `[Job ${job.id}] Failed to process attendance: ${error.message}`,
        error.stack,
      );

      // Log error details for debugging
      await job.log(`Error: ${error.message}`);
      await job.log(`Stack: ${error.stack}`);

      throw error; // Re-throw to trigger retry mechanism
    }
  }

  /**
   * Reprocess date range for an employee
   * Used for bulk corrections or recalculations
   */
  @Process('reprocess-date-range')
  async reprocessDateRange(
    job: Job<{
      employeeId: string;
      startDate: string;
      endDate: string;
      triggeredBy?: string;
      force?: boolean;
    }>,
  ) {
    const { employeeId, startDate, endDate, triggeredBy, force } = job.data;

    try {
      this.logger.log(
        `[Job ${job.id}] Reprocessing date range for ${employeeId}: ${startDate} to ${endDate}`,
      );

      await job.progress(10);

      const records = await this.attendanceProcessor.reprocessDateRange(
        employeeId,
        new Date(startDate),
        new Date(endDate),
        triggeredBy,
      );

      await job.progress(100);

      this.logger.log(
        `[Job ${job.id}] Successfully reprocessed ${records.length} records`,
      );

      return {
        success: true,
        records_processed: records.length,
        records: records.map((r) => ({
          date: r.date,
          status: r.status,
          worked_minutes: r.worked_minutes,
        })),
      };
    } catch (error) {
      this.logger.error(
        `[Job ${job.id}] Failed to reprocess date range: ${error.message}`,
        error.stack,
      );

      await job.log(`Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Daily batch processing
   * Process all employees for a specific date
   */
  @Process('daily-processing')
  async dailyProcessing(
    job: Job<{
      date: string;
      userIds?: string[];
      triggeredBy?: string;
      batchSize?: number;
    }>,
  ) {
    const { date, userIds, triggeredBy, batchSize = 100 } = job.data;

    try {
      this.logger.log(
        `[Job ${job.id}] Starting daily batch processing for ${date}`,
      );

      await job.progress(10);

      const result = await this.attendanceProcessor.batchProcessDate(
        new Date(date),
        userIds,
        triggeredBy,
      );

      await job.progress(100);

      this.logger.log(
        `[Job ${job.id}] Daily processing completed. Success: ${result.success}, Failed: ${result.failed}`,
      );

      return {
        success: true,
        date,
        total: result.total,
        successful: result.success,
        failed: result.failed,
        success_rate:
          result.total > 0
            ? ((result.success / result.total) * 100).toFixed(2) + '%'
            : '0%',
      };
    } catch (error) {
      this.logger.error(
        `[Job ${job.id}] Daily processing failed: ${error.message}`,
        error.stack,
      );

      await job.log(`Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process pending events
   * Events that are in PENDING status
   */
  @Process('process-pending-events')
  async processPendingEvents(
    job: Job<{
      eventIds?: string[];
      limit?: number;
    }>,
  ) {
    const { eventIds, limit = 50 } = job.data;

    try {
      this.logger.log(`[Job ${job.id}] Processing pending events`);

      // Implementation would fetch pending events and process them
      // This is a placeholder for the logic

      return {
        success: true,
        events_processed: eventIds?.length || 0,
      };
    } catch (error) {
      this.logger.error(
        `[Job ${job.id}] Failed to process pending events: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Cleanup old data
   * Remove old processing logs, temporary data, etc.
   */
  @Process('cleanup-old-data')
  async cleanupOldData(
    job: Job<{
      days: number;
      type: 'logs' | 'events' | 'all';
    }>,
  ) {
    const { days, type } = job.data;

    try {
      this.logger.log(
        `[Job ${job.id}] Cleaning up data older than ${days} days`,
      );

      // Implementation would clean up old data
      // This is a placeholder

      return {
        success: true,
        message: `Cleaned up ${type} data older than ${days} days`,
      };
    } catch (error) {
      this.logger.error(`[Job ${job.id}] Cleanup failed: ${error.message}`);
      throw error;
    }
  }

  // ============================================
  // Event Handlers
  // ============================================

  /**
   * Called when job becomes active
   */
  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`[Job ${job.id}] Started processing: ${job.name}`);
  }

  /**
   * Called when job completes successfully
   */
  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`[Job ${job.id}] Completed successfully: ${job.name}`);

    // Could send notifications here
    // Could update statistics
  }

  /**
   * Called when job fails
   */
  @OnQueueFailed()
  async onFailed(job: Job, error: Error) {
    this.logger.error(
      `[Job ${job.id}] Failed after ${job.attemptsMade} attempts: ${error.message}`,
      error.stack,
    );

    // Log failure details
    await job.log(`Failed: ${error.message}`);

    // Send alert if max attempts reached
    if (job.attemptsMade >= (job.opts.attempts || 3)) {
      this.logger.error(
        `[Job ${job.id}] Max attempts reached. Job will not be retried.`,
      );

      // Could send email/slack notification here
      // Could create incident ticket
      await this.sendFailureAlert(job, error);
    }
  }

  /**
   * Called when queue encounters an error
   */
  @OnQueueError()
  onError(error: Error) {
    this.logger.error(`Queue error occurred: ${error.message}`, error.stack);

    // Could send critical alert here
  }

  /**
   * Called when job is stalled (worker died)
   */
  @OnQueueStalled()
  onStalled(job: Job) {
    this.logger.warn(
      `[Job ${job.id}] Job stalled. Will be reprocessed by another worker.`,
    );
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Send failure alert
   * Notify admins about job failures
   */
  private async sendFailureAlert(job: Job, error: Error): Promise<void> {
    try {
      // Implementation would send email/slack notification
      this.logger.error(
        `ALERT: Job ${job.id} (${job.name}) failed permanently. Error: ${error.message}`,
      );

      // Example: Send to monitoring service
      // await this.monitoringService.sendAlert({
      //   level: 'critical',
      //   service: 'attendance-queue',
      //   message: `Job ${job.id} failed permanently`,
      //   data: { jobId: job.id, jobName: job.name, error: error.message }
      // });
    } catch (alertError) {
      this.logger.error(`Failed to send alert: ${alertError.message}`);
    }
  }

  /**
   * Get job statistics
   * Helper method for monitoring
   */
  async getJobStatistics(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    // Implementation would query Bull queue
    // This is a placeholder
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
  }
}
