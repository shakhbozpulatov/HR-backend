import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { HcService } from '@/modules/hc/hc.service';
import { TelegramNotificationService } from '@/common/services/telegram-notification.service';
import {
  AttendanceEvent,
  EventSource,
  EventType,
  ProcessingStatus,
} from '../entities/attendance-event.entity';

/**
 * HC Event Polling Service
 * Continuously polls HC API for new events and saves them to database
 * - Polls /combine/v1/mq/messages every 1 second
 * - Processes events and saves to attendance_events table
 * - Completes processed events via /combine/v1/mq/messages/complete
 * - Sends all logs to Telegram for monitoring
 */
@Injectable()
export class HcEventPollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HcEventPollingService.name);
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private readonly POLLING_INTERVAL_MS = 1000; // 1 second
  private readonly MAX_EVENTS_PER_REQUEST = 100;

  constructor(
    private readonly hcService: HcService,
    private readonly dataSource: DataSource,
    @InjectRepository(AttendanceEvent)
    private readonly attendanceEventRepository: Repository<AttendanceEvent>,
    private readonly telegramService: TelegramNotificationService,
  ) {}

  /**
   * Start polling on module initialization
   */
  async onModuleInit() {
    this.logger.log('HC Event Polling Service initialized');
    await this.startPolling();
  }

  /**
   * Stop polling on module destruction
   */
  onModuleDestroy() {
    this.stopPolling();
    this.logger.log('HC Event Polling Service destroyed');
  }

  /**
   * Start continuous polling
   */
  async startPolling() {
    if (this.isPolling) {
      this.logger.warn('Polling is already running');
      return;
    }

    this.isPolling = true;
    this.logger.log(
      `🔄 Starting HC event polling (interval: ${this.POLLING_INTERVAL_MS}ms)`,
    );

    // Initial subscription to ensure we receive events
    try {
      await this.hcService.subscribeEvent(1); // subscribeType 1 = alarm events
      this.logger.log('✅ Successfully subscribed to HC events');
    } catch (error) {
      this.logger.error('❌ Failed to subscribe to HC events', error.message);

      // Send Telegram error notification only on startup failure
      await this.telegramService.sendError(
        'Failed to Subscribe to HC Events',
        error,
        {
          'Subscribe Type': 'Alarm Events (1)',
          'Polling Interval': `${this.POLLING_INTERVAL_MS}ms`,
        },
      );
    }

    // Start polling loop
    this.pollingInterval = setInterval(() => {
      this.pollMessages();
    }, this.POLLING_INTERVAL_MS);

    this.logger.log('✅ Polling started successfully');
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPolling = false;
      this.logger.log('⏹️ Polling stopped');
    }
  }

  /**
   * Poll messages from HC API
   * Called every 1 second
   */
  private async pollMessages() {
    if (!this.isPolling) {
      return;
    }

    try {
      // Fetch events from HC MQ API
      const response = await this.hcService.getAllEvents(
        this.MAX_EVENTS_PER_REQUEST,
      );

      // Check if we have events
      if (!response.data?.events || response.data.events.length === 0) {
        // No events, continue polling silently
        return;
      }

      const batchId = response.data.batchId;
      const events = response.data.events;

      this.logger.log(
        `📨 Received ${events.length} events from HC (batchId: ${batchId})`,
      );

      // Process and save events (sends individual notifications)
      await this.processAndSaveEvents(events);

      // Complete the batch
      await this.hcService.completeEvent(batchId);
      this.logger.log(`✅ Completed batch: ${batchId}`);
    } catch (error) {
      // Check if error is OPEN000016 (subscription required)
      const errorResponse =
        typeof error.getResponse === 'function' ? error.getResponse() : error;

      const isOpen000016Error =
        errorResponse?.errorCode === 'OPEN000016' ||
        errorResponse?.details?.errorCode === 'OPEN000016' ||
        (errorResponse?.error &&
          typeof errorResponse.error === 'string' &&
          errorResponse.error.includes('OPEN000016')) ||
        (errorResponse?.message &&
          typeof errorResponse.message === 'string' &&
          errorResponse.message.includes('OPEN000016'));

      if (isOpen000016Error) {
        this.logger.warn(
          '⚠️ OPEN000016 error detected - resubscribing to HC events',
        );

        try {
          // Resubscribe to events
          await this.hcService.subscribeEvent(1);
          this.logger.log('✅ Successfully resubscribed to HC events');
        } catch (resubscribeError) {
          this.logger.error(
            '❌ Failed to resubscribe to HC events',
            resubscribeError.message,
          );

          // Send Telegram error notification only for critical failures
          await this.telegramService.sendError(
            'Failed to Resubscribe - Polling Stopped',
            resubscribeError,
            {
              'Original Error': 'OPEN000016',
              'Subscribe Type': 'Alarm Events (1)',
              'Polling Status': 'Stopped',
            },
          );

          this.stopPolling();
        }
      } else {
        // Unknown error - stop polling and log
        this.logger.error('❌ Polling error - stopping polling', {
          error: error.message,
          stack: error.stack,
          response: errorResponse,
        });

        // Send Telegram error notification only for critical errors
        await this.telegramService.sendError(
          'Critical Polling Error - Polling Stopped',
          error,
          {
            'Error Response': errorResponse,
            'Polling Status': 'Stopped',
            Action: 'Manual intervention required',
          },
        );

        this.stopPolling();
      }
    }
  }

  /**
   * Process events and save to database
   * Loops through all events and saves to DB
   */
  private async processAndSaveEvents(events: any[]): Promise<void> {
    try {
      // Get time range for certificate records (last 10 seconds)
      const endTime = new Date().toISOString();
      const beginTime = new Date(Date.now() - 10 * 1000).toISOString();

      // Fetch certificate records from HC
      const hcRecords = await this.hcService.searchCertificateRecords({
        pageIndex: 1,
        pageSize: this.MAX_EVENTS_PER_REQUEST,
        searchCreteria: {
          beginTime: beginTime,
          endTime: endTime,
        },
      });

      // Validate we have records
      if (
        !hcRecords.data?.recordList ||
        hcRecords.data.recordList.length === 0
      ) {
        this.logger.warn('No certificate records found from HC service');
        return;
      }

      this.logger.log(
        `📋 Fetched ${hcRecords.data.recordList.length} certificate records from HC`,
      );

      let savedCount = 0;
      const failedEvents: any[] = [];

      // Process each event
      for (const event of events) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let userName: string = 'Unknown';
        let deviceName: string = 'Unknown';

        try {
          // Validate event structure
          if (!event?.basicInfo?.resourceInfo?.deviceInfo?.id) {
            this.logger.warn(
              `Invalid event structure - eventId: ${event.eventId}`,
            );
            await queryRunner.rollbackTransaction();
            await queryRunner.release();

            // Send error notification
            await this.sendEventErrorNotification(
              'Unknown',
              'Invalid event structure',
              event.eventId || 'Unknown',
            );
            continue;
          }

          const deviceId = event.basicInfo.resourceInfo.deviceInfo.id;
          deviceName =
            event.basicInfo?.resourceInfo?.deviceInfo?.name || 'Unknown';

          // Find matching certificate record for this event
          const matchingRecord = hcRecords.data.recordList.find(
            (record) => record.deviceId === deviceId,
          );

          if (!matchingRecord) {
            this.logger.warn(
              `No matching certificate record for device ${deviceId}`,
            );
            await queryRunner.rollbackTransaction();
            await queryRunner.release();

            // Send error notification
            await this.sendEventErrorNotification(
              'Unknown',
              'No matching certificate record',
              deviceId,
              deviceName,
            );
            continue;
          }

          // Validate record has user info
          if (!matchingRecord.personInfo?.id) {
            this.logger.warn(
              `Certificate record missing personInfo for device ${deviceId}`,
            );
            await queryRunner.rollbackTransaction();
            await queryRunner.release();

            // Send error notification
            await this.sendEventErrorNotification(
              'Unknown',
              'Missing person information',
              deviceId,
              deviceName,
            );
            continue;
          }

          // Get user info for notification
          const firstName = matchingRecord.personInfo.baseInfo?.firstName || '';
          const lastName = matchingRecord.personInfo.baseInfo?.lastName || '';
          userName = `${firstName} ${lastName}`.trim() || 'Unknown Employee';
          const userId = matchingRecord.personInfo.id;

          // Create attendance event
          const attendanceEvent = this.attendanceEventRepository.create({
            user_id: userId,
            device_id: matchingRecord.deviceId,
            event_type:
              matchingRecord.attendanceStatus === 1
                ? EventType.CLOCK_IN
                : EventType.CLOCK_OUT,
            event_source: EventSource.BIOMETRIC_DEVICE,
            ts_utc: new Date(matchingRecord.occurTime),
            ts_local: new Date(matchingRecord.deviceTime),
            source_payload: {
              event: event,
              certificateRecord: matchingRecord,
            },
            signature_valid: true,
            processing_status: ProcessingStatus.PENDING,
          });

          // Save within transaction
          const savedEvent = await queryRunner.manager.save(attendanceEvent);

          await queryRunner.commitTransaction();

          this.logger.log(
            `✅ Saved event ${savedEvent.event_id} for user ${savedEvent.user_id} (${savedEvent.event_type})`,
          );

          // Send success notification for this event
          await this.sendEventSuccessNotification(
            userName,
            savedEvent.event_type,
            matchingRecord.occurTime,
            deviceName,
          );

          savedCount++;
        } catch (error) {
          await queryRunner.rollbackTransaction();
          const errorMsg = error.message || 'Unknown error';

          // Check if this is a duplicate key error (PostgreSQL error code 23505)
          const isDuplicateError =
            error.code === '23505' || errorMsg.includes('duplicate key');

          if (isDuplicateError) {
            // This is a duplicate event - just log it and skip notification
            this.logger.warn(
              `⚠️ Duplicate event detected for user ${userName} at device ${deviceName} - skipping`,
            );
          } else {
            // This is a real error - log and send notification
            this.logger.error(
              `Failed to save event ${event.eventId}: ${errorMsg}`,
            );

            // Send error notification
            if (!deviceName || deviceName === 'Unknown') {
              deviceName =
                event?.basicInfo?.resourceInfo?.deviceInfo?.name || 'Unknown';
            }
            await this.sendEventErrorNotification(
              userName,
              errorMsg,
              event.eventId || 'Unknown',
              deviceName,
            );

            failedEvents.push({
              eventId: event.eventId,
              error: errorMsg,
            });
          }
        } finally {
          await queryRunner.release();
        }
      }

      this.logger.log(
        `✅ Batch processing complete: ${savedCount}/${events.length} events saved`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to process events: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send success notification for a single attendance event
   */
  private async sendEventSuccessNotification(
    userName: string,
    eventType: EventType,
    occurTime: string,
    deviceName: string,
  ): Promise<void> {
    try {
      const eventIcon = eventType === EventType.CLOCK_IN ? '🟢' : '🔴';
      const eventTypeText =
        eventType === EventType.CLOCK_IN ? 'KIRISH' : 'CHIQISH';

      // Format time in Tashkent timezone
      const occurTimeFormatted = new Date(occurTime).toLocaleString('uz-UZ', {
        timeZone: 'Asia/Tashkent',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const message = `${eventIcon} <b>${eventTypeText} - Muvaffaqiyatli</b>

👤 <b>Xodim:</b> ${userName}
⏰ <b>Vaqt:</b> ${occurTimeFormatted}
📱 <b>Qurilma:</b> ${deviceName}

✅ <b>Holat:</b> Muvaffaqiyatli saqlandi`;

      await this.telegramService.sendRawHtml(message);
    } catch (error) {
      this.logger.error(
        `Failed to send success notification: ${error.message}`,
      );
    }
  }

  /**
   * Send error notification for a failed attendance event
   */
  private async sendEventErrorNotification(
    userName: string,
    errorMessage: string,
    eventId: string,
    deviceName?: string,
  ): Promise<void> {
    try {
      const timestamp = new Date().toLocaleString('uz-UZ', {
        timeZone: 'Asia/Tashkent',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      let message = `🔴 <b>KIRISH/CHIQISH - Xatolik</b>

👤 <b>Xodim:</b> ${userName}
⏰ <b>Vaqt:</b> ${timestamp}`;

      if (deviceName) {
        message += `\n📱 <b>Qurilma:</b> ${deviceName}`;
      }

      message += `\n❌ <b>Xatolik:</b> ${errorMessage}
🆔 <b>Event ID:</b> <code>${eventId}</code>`;

      await this.telegramService.sendRawHtml(message);
    } catch (error) {
      this.logger.error(`Failed to send error notification: ${error.message}`);
    }
  }

  /**
   * Get polling status
   */
  getStatus(): { isPolling: boolean; intervalMs: number } {
    return {
      isPolling: this.isPolling,
      intervalMs: this.POLLING_INTERVAL_MS,
    };
  }
}
