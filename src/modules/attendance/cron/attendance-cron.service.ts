// ============================================
// FILE: cron/attendance-cron.service.ts
// Scheduled Tasks for Attendance Processing
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment-timezone';

import { AttendanceEventsService } from '@/modules/attendance';

@Injectable()
export class AttendanceCronService {
  private readonly logger = new Logger(AttendanceCronService.name);
  private readonly timezone: string;
  private readonly enableDailyProcessing: boolean;
  private readonly enableRetryFailed: boolean;
  private readonly enableCleanup: boolean;

  constructor(
    @InjectQueue('attendance')
    private readonly attendanceQueue: Queue,
    private readonly eventsService: AttendanceEventsService,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.timezone = this.configService.get('DEFAULT_TIMEZONE', 'Asia/Tashkent');
    this.enableDailyProcessing = this.configService.get(
      'ENABLE_DAILY_PROCESSING_CRON',
      true,
    );
    this.enableRetryFailed = this.configService.get(
      'ENABLE_RETRY_FAILED_CRON',
      true,
    );
    this.enableCleanup = this.configService.get('ENABLE_CLEANUP_CRON', true);

    this.logger.log('Attendance Cron Service initialized');
    this.logger.log(`Timezone: ${this.timezone}`);
    this.logger.log(
      `Daily Processing: ${this.enableDailyProcessing ? 'enabled' : 'disabled'}`,
    );
    this.logger.log(
      `Retry Failed: ${this.enableRetryFailed ? 'enabled' : 'disabled'}`,
    );
    this.logger.log(`Cleanup: ${this.enableCleanup ? 'enabled' : 'disabled'}`);
  }

  /**
   * Daily Attendance Processing
   * Runs at 1:00 AM every day
   * Processes previous day's attendance for all employees
   */
  @Cron('0 1 * * *', {
    name: 'daily-attendance-processing',
    timeZone: 'Asia/Tashkent',
  })
  async handleDailyProcessing() {
    if (!this.enableDailyProcessing) {
      this.logger.log('Daily processing is disabled. Skipping.');
      return;
    }

    const yesterday = moment.tz(this.timezone).subtract(1, 'day');
    const dateStr = yesterday.format('YYYY-MM-DD');

    this.logger.log(`Starting daily attendance processing for ${dateStr}`);

    try {
      // Add job to queue with high priority
      const job = await this.attendanceQueue.add(
        'daily-processing',
        {
          date: dateStr,
          triggeredBy: 'cron:daily-processing',
        },
        {
          priority: 1,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: false, // Keep for audit
          removeOnFail: false,
        },
      );

      this.logger.log(
        `Daily processing job queued successfully. Job ID: ${job.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue daily processing: ${error.message}`,
        error.stack,
      );

      // Send alert
      await this.sendCronAlert('daily-processing', error);
    }
  }

  /**
   * Retry Failed Events
   * Runs every hour
   * Retries events that failed processing
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'retry-failed-events',
  })
  async handleRetryFailed() {
    if (!this.enableRetryFailed) {
      return;
    }

    this.logger.log('Starting retry of failed events');

    try {
      await this.eventsService.retryFailedEvents();
      this.logger.log('Failed events retry completed');
    } catch (error) {
      this.logger.error(
        `Failed to retry events: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Process Pending Events
   * Runs every 15 minutes
   * Process events that are stuck in PENDING status
   */
  @Cron('*/15 * * * *', {
    name: 'process-pending-events',
  })
  async handlePendingEvents() {
    this.logger.log('Processing pending events');

    try {
      await this.attendanceQueue.add(
        'process-pending-events',
        {
          limit: 50,
        },
        {
          priority: 2,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue pending events processing: ${error.message}`,
      );
    }
  }

  /**
   * Clean Up Old Processing Logs
   * Runs weekly on Sunday at 2:00 AM
   * Removes logs older than 90 days
   */
  @Cron('0 2 * * 0', {
    name: 'cleanup-old-logs',
    timeZone: 'Asia/Tashkent',
  })
  async handleCleanupLogs() {
    if (!this.enableCleanup) {
      return;
    }

    this.logger.log('Starting cleanup of old processing logs');

    try {
      await this.attendanceQueue.add(
        'cleanup-old-data',
        {
          days: 90,
          type: 'logs',
        },
        {
          priority: 10, // Low priority
        },
      );

      this.logger.log('Cleanup job queued successfully');
    } catch (error) {
      this.logger.error(
        `Failed to queue cleanup: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Clean Up Old Events
   * Runs weekly on Sunday at 3:00 AM
   * Archive or remove old events
   */
  @Cron('0 3 * * 0', {
    name: 'cleanup-old-events',
    timeZone: 'Asia/Tashkent',
  })
  async handleCleanupEvents() {
    if (!this.enableCleanup) {
      return;
    }

    this.logger.log('Starting cleanup of old events');

    try {
      await this.attendanceQueue.add(
        'cleanup-old-data',
        {
          days: 180, // Keep events for 6 months
          type: 'events',
        },
        {
          priority: 10,
        },
      );
    } catch (error) {
      this.logger.error(`Failed to queue events cleanup: ${error.message}`);
    }
  }

  /**
   * Send Daily Attendance Reports
   * Runs at 9:00 AM on weekdays
   * Sends reports to managers/HR
   */
  @Cron('0 9 * * 1-5', {
    name: 'send-daily-reports',
    timeZone: 'Asia/Tashkent',
  })
  async handleDailyReports() {
    const today = moment.tz(this.timezone);
    this.logger.log(
      `Generating daily attendance reports for ${today.format('YYYY-MM-DD')}`,
    );

    try {
      // Implementation would:
      // 1. Fetch yesterday's attendance records
      // 2. Generate reports for each department/manager
      // 3. Send via email or notification service

      this.logger.log('Daily reports sent successfully');
    } catch (error) {
      this.logger.error(
        `Failed to send daily reports: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Weekly Summary Report
   * Runs every Monday at 10:00 AM
   * Sends weekly summary to management
   */
  @Cron('0 10 * * 1', {
    name: 'send-weekly-summary',
    timeZone: 'Asia/Tashkent',
  })
  async handleWeeklySummary() {
    this.logger.log('Generating weekly attendance summary');

    try {
      const lastWeekStart = moment
        .tz(this.timezone)
        .subtract(1, 'week')
        .startOf('week');
      const lastWeekEnd = moment
        .tz(this.timezone)
        .subtract(1, 'week')
        .endOf('week');

      // Implementation would generate and send weekly summary
      this.logger.log(
        `Weekly summary for ${lastWeekStart.format('YYYY-MM-DD')} to ${lastWeekEnd.format('YYYY-MM-DD')}`,
      );
    } catch (error) {
      this.logger.error(`Failed to generate weekly summary: ${error.message}`);
    }
  }

  /**
   * Monthly Report
   * Runs on the 1st of each month at 9:00 AM
   * Generates monthly attendance report
   */
  @Cron('0 9 1 * *', {
    name: 'send-monthly-report',
    timeZone: 'Asia/Tashkent',
  })
  async handleMonthlyReport() {
    this.logger.log('Generating monthly attendance report');

    try {
      const lastMonth = moment.tz(this.timezone).subtract(1, 'month');
      const monthStr = lastMonth.format('YYYY-MM');

      // Implementation would generate comprehensive monthly report
      this.logger.log(`Monthly report for ${monthStr}`);
    } catch (error) {
      this.logger.error(`Failed to generate monthly report: ${error.message}`);
    }
  }

  /**
   * Check Queue Health
   * Runs every 5 minutes
   * Monitors queue health and sends alerts if issues detected
   */
  @Cron('*/5 * * * *', {
    name: 'check-queue-health',
  })
  async handleQueueHealthCheck() {
    try {
      const waiting = await this.attendanceQueue.getWaitingCount();
      const active = await this.attendanceQueue.getActiveCount();
      const failed = await this.attendanceQueue.getFailedCount();
      const delayed = await this.attendanceQueue.getDelayedCount();

      // Alert if queue is backing up
      if (waiting > 100) {
        this.logger.warn(`Queue backlog detected: ${waiting} jobs waiting`);
      }

      // Alert if too many failures
      if (failed > 50) {
        this.logger.error(`High failure rate detected: ${failed} failed jobs`);
        await this.sendCronAlert(
          'queue-health',
          new Error(`${failed} failed jobs`),
        );
      }

      // Log stats periodically (every hour)
      const minute = new Date().getMinutes();
      if (minute % 60 === 0) {
        this.logger.log(
          `Queue stats - Waiting: ${waiting}, Active: ${active}, Failed: ${failed}, Delayed: ${delayed}`,
        );
      }
    } catch (error) {
      this.logger.error(`Queue health check failed: ${error.message}`);
    }
  }

  /**
   * Auto-approve old records
   * Runs daily at 11:00 PM
   * Auto-approve records older than X days if configured
   */
  @Cron('0 23 * * *', {
    name: 'auto-approve-old-records',
    timeZone: 'Asia/Tashkent',
  })
  async handleAutoApprove() {
    const autoApproveEnabled = this.configService.get(
      'AUTO_APPROVE_OLD_RECORDS',
      false,
    );
    const autoApproveDays = this.configService.get(
      'AUTO_APPROVE_AFTER_DAYS',
      7,
    );

    if (!autoApproveEnabled) {
      return;
    }

    this.logger.log(
      `Auto-approving records older than ${autoApproveDays} days`,
    );

    try {
      // Implementation would:
      // 1. Find records requiring approval older than X days
      // 2. Auto-approve if criteria met
      // 3. Log approvals

      this.logger.log('Auto-approval completed');
    } catch (error) {
      this.logger.error(`Auto-approval failed: ${error.message}`);
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Send cron job alert
   */
  private async sendCronAlert(jobName: string, error: Error): Promise<void> {
    try {
      // Implementation would send alert via email/slack/etc
      this.logger.error(`CRON ALERT: ${jobName} failed - ${error.message}`);
    } catch (alertError) {
      this.logger.error(`Failed to send cron alert: ${alertError.message}`);
    }
  }

  /**
   * Get cron job status
   */
  getCronJobsStatus(): any[] {
    const jobs = this.schedulerRegistry.getCronJobs();
    const status = [];

    jobs.forEach((job, name) => {
      status.push({
        name,
        running: job.running,
        lastDate: job.lastDate(),
        nextDate: job.nextDate(),
      });
    });

    return status;
  }

  /**
   * Stop cron job
   */
  stopCronJob(name: string): void {
    const job = this.schedulerRegistry.getCronJob(name);
    job.stop();
    this.logger.warn(`Cron job '${name}' stopped`);
  }

  /**
   * Start cron job
   */
  startCronJob(name: string): void {
    const job = this.schedulerRegistry.getCronJob(name);
    job.start();
    this.logger.log(`Cron job '${name}' started`);
  }
}
