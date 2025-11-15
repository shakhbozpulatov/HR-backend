import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as crypto from 'crypto';
import moment from 'moment-timezone';

import {
  AttendanceEvent,
  EnrollmentStatus,
  EventSource,
  EventType,
  ProcessingStatus,
  ResolveQuarantineDto,
  UserDeviceMapping,
  WebhookEventDto,
} from '@/modules/attendance';
import { HcService } from '@/modules/hc/hc.service';
import { HcApiResponse } from '@/modules/hc/interfaces/hc-api.interface';
import { User } from '@/modules/users/entities/user.entity';
import {
  FetchAttendanceEventsDto,
  GetEventsDto,
} from '@/modules/attendance/dto/fetch-attendance-events.dto';

@Injectable()
export class AttendanceEventsService {
  private readonly logger = new Logger(AttendanceEventsService.name);
  private readonly webhookSecret: string;

  constructor(
    @InjectRepository(AttendanceEvent)
    private eventRepository: Repository<AttendanceEvent>,
    @InjectRepository(UserDeviceMapping)
    private mappingRepository: Repository<UserDeviceMapping>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectQueue('attendance')
    private attendanceQueue: Queue,
    private configService: ConfigService,
    private hcService: HcService,
    private dataSource: DataSource,
    @InjectRepository(AttendanceEvent)
    private readonly attendanceEventRepository: Repository<AttendanceEvent>,
  ) {
    this.webhookSecret = this.configService.get('WEBHOOK_SECRET', '');
  }

  async subscribeService(subscribeType: number): Promise<HcApiResponse<any>> {
    if (!subscribeType) {
      throw new BadRequestException({ message: 'Subscribe type not provided' });
    }
    return await this.hcService.subscribeEvent(subscribeType);
  }

  async writeEvent(maxNumberPerTime: number) {
    if (!maxNumberPerTime) {
      throw new BadRequestException({
        message: 'maxNumberPerTime type not provided',
      });
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Fetch events from HC
      const events = await this.hcService.getAllEvents(maxNumberPerTime);
      this.logger.log(
        `Fetched ${events.data?.events?.length || 0} events from HC`,
      );

      if (!events.data?.events || events.data.events.length === 0) {
        this.logger.warn('No events found from HC service');
        await queryRunner.commitTransaction();
        return {
          data: null,
          message: 'No events found',
        };
      }

      // Fix: Time range was backwards - beginTime should be BEFORE endTime
      const endTime = new Date().toISOString();
      const beginTime = new Date(Date.now() - 3 * 1000).toISOString();

      // Fetch certificate records from HC
      const hcRecords = await this.hcService.searchCertificateRecords({
        pageIndex: 1,
        pageSize: maxNumberPerTime,
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
        await queryRunner.commitTransaction();
        return {
          data: null,
          message: 'No certificate records found',
        };
      }

      this.logger.log(
        `Fetched ${hcRecords.data.recordList.length} certificate records from HC`,
      );

      const firstEvent = events.data.events[0];
      const firstRecord = hcRecords.data.recordList[0];

      // Validate required data exists
      if (!firstEvent?.basicInfo?.resourceInfo?.deviceInfo?.id) {
        throw new BadRequestException('Invalid event structure from HC');
      }

      if (!firstRecord?.deviceId || !firstRecord?.personInfo?.id) {
        throw new BadRequestException('Invalid record structure from HC');
      }

      // Check if device IDs match
      if (
        firstEvent.basicInfo.resourceInfo.deviceInfo.id !== firstRecord.deviceId
      ) {
        this.logger.warn(
          `Device ID mismatch: Event device ${firstEvent.basicInfo.resourceInfo.deviceInfo.id} vs Record device ${firstRecord.deviceId}`,
        );
        await queryRunner.commitTransaction();
        return {
          data: null,
          message: 'Device ID mismatch between event and record',
        };
      }

      // Create attendance event
      const attendanceEvent = this.attendanceEventRepository.create({
        user_id: firstRecord.personInfo.id,
        device_id: firstRecord.deviceId,
        event_type:
          firstRecord.attendanceStatus === 1
            ? EventType.CLOCK_IN
            : EventType.CLOCK_OUT,
        event_source: EventSource.BIOMETRIC_DEVICE,
        ts_utc: new Date(firstRecord.occurTime),
        ts_local: new Date(firstRecord.deviceTime),
        source_payload: firstRecord,
        signature_valid: true,
        processing_status: ProcessingStatus.PENDING,
      });

      // Save within transaction
      const savedEvent = await queryRunner.manager.save(attendanceEvent);

      // Complete the event batch
      if (events.data?.batchId) {
        await this.hcService.completeEvent(events.data.batchId);
        this.logger.log(`Completed event batch: ${events.data.batchId}`);
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Successfully saved attendance event ${savedEvent.event_id} for user ${savedEvent.user_id}`,
      );

      return {
        data: savedEvent,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to write events: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Process webhook event with idempotency check and mapping resolution
   */
  async processWebhookEvent(
    eventData: WebhookEventDto,
  ): Promise<AttendanceEvent> {
    // 3. Resolve user_id from terminal_user_id
    let userId: string | null = null;
    let processingStatus = ProcessingStatus.PENDING;

    if (eventData.terminal_user_id) {
      const mapping = await this.mappingRepository.findOne({
        where: {
          terminal_user_id: eventData.terminal_user_id,
          device_id: eventData.device_id,
          is_active: true,
        },
      });

      if (mapping) {
        userId = mapping.user_id;
        processingStatus = ProcessingStatus.PROCESSED;
      } else {
        this.logger.warn(
          `Unknown terminal_user_id: ${eventData.terminal_user_id} on device: ${eventData.device_id}`,
        );
        processingStatus = ProcessingStatus.QUARANTINED;
      }
    }

    // 4. Parse timestamps with timezone handling
    const timezone =
      eventData.timezone ||
      this.configService.get('DEFAULT_TIMEZONE', 'Asia/Tashkent');
    const tsUtc = moment.utc(eventData.timestamp).toDate();
    const tsLocal = moment.tz(eventData.timestamp, timezone).toDate();

    // 5. Create event with transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const event = this.eventRepository.create({
        user_id: userId,
        terminal_user_id: eventData.terminal_user_id,
        device_id: eventData.device_id,
        event_type: eventData.event_type,
        event_source: EventSource.BIOMETRIC_DEVICE,
        ts_utc: tsUtc,
        ts_local: tsLocal,
        source_payload: eventData.metadata,
        processing_status: processingStatus,
        processed_at:
          processingStatus === ProcessingStatus.PROCESSED ? new Date() : null,
      });

      const savedEvent = await queryRunner.manager.save(event);

      // 6. Queue for processing if user is resolved
      if (userId) {
        await this.queueEventProcessing(savedEvent);
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Event ${savedEvent.event_id} ingested successfully. Status: ${processingStatus}`,
      );

      return savedEvent;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      this.logger.error(
        `Failed to process webhook event: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find single event by ID
   */
  async findOne(eventId: string): Promise<AttendanceEvent> {
    const event = await this.eventRepository.findOne({
      where: { event_id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    return event;
  }

  /**
   * Get events by user ID
   */
  async findByUserId(
    userId: string,
    options?: {
      from?: Date;
      to?: Date;
      limit?: number;
    },
  ): Promise<AttendanceEvent[]> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .where('event.user_id = :userId', { userId })
      .orderBy('event.ts_local', 'DESC');

    if (options?.from) {
      queryBuilder.andWhere('event.ts_local >= :from', { from: options.from });
    }

    if (options?.to) {
      queryBuilder.andWhere('event.ts_local <= :to', { to: options.to });
    }

    if (options?.limit) {
      queryBuilder.take(options.limit);
    }

    return await queryBuilder.getMany();
  }

  /**
   * Get events by device ID
   */
  async findByDeviceId(
    deviceId: string,
    options?: {
      from?: Date;
      to?: Date;
      limit?: number;
    },
  ): Promise<AttendanceEvent[]> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .where('event.device_id = :deviceId', { deviceId })
      .orderBy('event.ts_local', 'DESC');

    if (options?.from) {
      queryBuilder.andWhere('event.ts_local >= :from', { from: options.from });
    }

    if (options?.to) {
      queryBuilder.andWhere('event.ts_local <= :to', { to: options.to });
    }

    if (options?.limit) {
      queryBuilder.take(options.limit);
    }

    return await queryBuilder.getMany();
  }

  /**
   * Delete event by ID (use with caution)
   */
  async deleteEvent(eventId: string): Promise<void> {
    const result = await this.eventRepository.delete({ event_id: eventId });

    if (result.affected === 0) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    this.logger.log(`Event ${eventId} deleted`);
  }

  /**
   * Get event statistics
   */
  async getEventStatistics(filters: {
    userId?: string;
    deviceId?: string;
    from?: Date;
    to?: Date;
  }): Promise<{
    total: number;
    clockIn: number;
    clockOut: number;
    processed: number;
    pending: number;
    failed: number;
    quarantined: number;
  }> {
    const queryBuilder = this.eventRepository.createQueryBuilder('event');

    if (filters.userId) {
      queryBuilder.andWhere('event.user_id = :userId', {
        userId: filters.userId,
      });
    }

    if (filters.deviceId) {
      queryBuilder.andWhere('event.device_id = :deviceId', {
        deviceId: filters.deviceId,
      });
    }

    if (filters.from) {
      queryBuilder.andWhere('event.ts_local >= :from', { from: filters.from });
    }

    if (filters.to) {
      queryBuilder.andWhere('event.ts_local <= :to', { to: filters.to });
    }

    const events = await queryBuilder.getMany();

    return {
      total: events.length,
      clockIn: events.filter((e) => e.event_type === EventType.CLOCK_IN).length,
      clockOut: events.filter((e) => e.event_type === EventType.CLOCK_OUT)
        .length,
      processed: events.filter(
        (e) => e.processing_status === ProcessingStatus.PROCESSED,
      ).length,
      pending: events.filter(
        (e) => e.processing_status === ProcessingStatus.PENDING,
      ).length,
      failed: events.filter(
        (e) => e.processing_status === ProcessingStatus.FAILED,
      ).length,
      quarantined: events.filter(
        (e) => e.processing_status === ProcessingStatus.QUARANTINED,
      ).length,
    };
  }

  /**
   * Update device status
   */
  async updateDeviceStatus(statusData: any): Promise<{ success: boolean }> {
    // Implementation for device status update
    // This could update a DeviceStatus table or send to monitoring service
    this.logger.log('Device status updated:', statusData);

    // Example: Update device last_seen timestamp
    // await this.deviceRepository.update(
    //   { device_id: statusData.device_id },
    //   {
    //     status: statusData.status,
    //     last_seen: new Date(statusData.last_seen || Date.now()),
    //     ip_address: statusData.ip_address,
    //   }
    // );

    return { success: true };
  }

  /**
   * Get incomplete events (missing clock-out)
   */
  async getIncompleteEvents(
    userId: string,
    date?: Date,
  ): Promise<AttendanceEvent[]> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .where('event.user_id = :userId', { userId })
      .andWhere('event.event_type = :eventType', {
        eventType: EventType.CLOCK_IN,
      })
      .orderBy('event.ts_local', 'ASC');

    if (date) {
      const startOfDay = moment(date).startOf('day').toDate();
      const endOfDay = moment(date).endOf('day').toDate();
      queryBuilder.andWhere('event.ts_local BETWEEN :start AND :end', {
        start: startOfDay,
        end: endOfDay,
      });
    }

    const clockInEvents = await queryBuilder.getMany();

    // Filter out events that have a corresponding clock-out
    const incompleteEvents: AttendanceEvent[] = [];

    for (const clockIn of clockInEvents) {
      const clockOut = await this.eventRepository.findOne({
        where: {
          user_id: userId,
          event_type: EventType.CLOCK_OUT,
          ts_local: Between(
            clockIn.ts_local,
            moment(clockIn.ts_local).add(24, 'hours').toDate(),
          ),
        },
        order: { ts_local: 'ASC' },
      });

      if (!clockOut) {
        incompleteEvents.push(clockIn);
      }
    }

    return incompleteEvents;
  }

  /**
   * Validate webhook signature
   */
  private validateSignature(eventData: any, signature: string): boolean {
    if (!this.webhookSecret) {
      return true; // Skip validation if no secret configured
    }

    const payload = JSON.stringify(eventData);
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Queue event for async processing
   */
  private async queueEventProcessing(event: AttendanceEvent): Promise<void> {
    const dateStr = moment(event.ts_local).format('YYYY-MM-DD');

    await this.attendanceQueue.add(
      'process-employee-day',
      {
        employeeId: event.user_id,
        date: dateStr,
      },
      {
        jobId: `process-${event.user_id}-${dateStr}`,
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );
  }

  /**
   * Get quarantined events
   */
  async getQuarantinedEvents(): Promise<AttendanceEvent[]> {
    return await this.eventRepository.find({
      where: { processing_status: ProcessingStatus.QUARANTINED },
      order: { created_at: 'DESC' },
      take: 100,
    });
  }

  /**
   * Resolve quarantined event
   */
  async resolveQuarantinedEvent(
    eventId: string,
    resolveDto: ResolveQuarantineDto,
    actorId: string,
  ): Promise<AttendanceEvent> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const event = await queryRunner.manager.findOne(AttendanceEvent, {
        where: { event_id: eventId },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      if (event.processing_status !== ProcessingStatus.QUARANTINED) {
        throw new BadRequestException('Event is not in quarantine');
      }

      // Update event
      event.user_id = resolveDto.user_id;
      event.processing_status = ProcessingStatus.PROCESSED;
      event.processed_at = new Date();
      event.resolved_by = actorId;
      event.resolved_at = new Date();

      await queryRunner.manager.save(event);

      // Create mapping if requested
      if (resolveDto.create_mapping && event.terminal_user_id) {
        const existingMapping = await queryRunner.manager.findOne(
          UserDeviceMapping,
          {
            where: {
              terminal_user_id: event.terminal_user_id,
              device_id: event.device_id,
            },
          },
        );

        if (!existingMapping) {
          const mapping = queryRunner.manager.create(UserDeviceMapping, {
            user_id: resolveDto.user_id,
            terminal_user_id: event.terminal_user_id,
            device_id: event.device_id,
            enrollment_status: EnrollmentStatus.COMPLETED,
            fingerprint_enrolled: true,
            enrolled_by: actorId,
            enrolled_at: new Date(),
          });

          await queryRunner.manager.save(mapping);
          this.logger.log(
            `Mapping created for terminal_user_id: ${event.terminal_user_id}`,
          );
        }
      }

      // Reprocess record if requested
      if (resolveDto.reprocess_record) {
        const dateStr = moment(event.ts_local).format('YYYY-MM-DD');
        await this.attendanceQueue.add('process-employee-day', {
          employeeId: resolveDto.user_id,
          date: dateStr,
        });
      }

      await queryRunner.commitTransaction();

      this.logger.log(`Event ${eventId} resolved successfully`);
      return event;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to resolve quarantined event: ${error.message}`,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Retry failed events
   */
  async retryFailedEvents(): Promise<void> {
    const failedEvents = await this.eventRepository.find({
      where: {
        processing_status: ProcessingStatus.FAILED,
        retry_count: Between(0, 2),
      },
      take: 50,
    });

    for (const event of failedEvents) {
      if (event.user_id) {
        event.retry_count++;
        event.processing_status = ProcessingStatus.PENDING;
        await this.eventRepository.save(event);
        await this.queueEventProcessing(event);
      }
    }

    this.logger.log(`Retrying ${failedEvents.length} failed events`);
  }

  /**
   * Find all events with filters
   */
  async findAll(
    filterDto: any,
  ): Promise<{ data: AttendanceEvent[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      user_id,
      device_id,
      from,
      to,
      processing_status,
    } = filterDto;

    const queryBuilder = this.eventRepository.createQueryBuilder('event');

    if (user_id) {
      queryBuilder.andWhere('event.user_id = :user_id', { user_id });
    }

    if (device_id) {
      queryBuilder.andWhere('event.device_id = :device_id', { device_id });
    }

    if (from) {
      queryBuilder.andWhere('event.ts_local >= :from', {
        from: new Date(from),
      });
    }

    if (to) {
      queryBuilder.andWhere('event.ts_local <= :to', { to: new Date(to) });
    }

    if (processing_status) {
      queryBuilder.andWhere('event.processing_status = :processing_status', {
        processing_status,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('event.ts_local', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  /**
   * Get attendance events with time range filter
   * If no time range provided, returns last 7 days events
   * Filters by created_at (when event was saved to database)
   * Can filter by userId (HC person ID - links events.user_id with users.hcPersonId)
   */
  async getEvents(dto: {
    startTime?: string;
    endTime?: string;
    page?: number;
    limit?: number;
    userId?: string;
  }): Promise<{
    data: AttendanceEvent[];
    total: number;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;

    // Set default time range to last 7 days if not provided (UTC)
    let endTime = dto.endTime ? new Date(dto.endTime) : new Date(); // Current time UTC
    const startTime = dto.startTime
      ? new Date(dto.startTime)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago UTC

    // Add 1 second buffer to endTime to handle microsecond precision issues
    // PostgreSQL stores timestamps with microsecond precision, but JS only has millisecond
    // Without this, events at exact endTime might be excluded due to microsecond differences
    endTime = new Date(endTime.getTime() + 1000);

    this.logger.log(
      `Fetching events from ${startTime.toISOString()} to ${endTime.toISOString()} (UTC), page ${page}, limit ${limit}${dto.userId ? `, userId=${dto.userId}` : ''}`,
    );

    // Filter by created_at (when event was saved to database)
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .where('event.created_at >= :startTime', { startTime })
      .andWhere('event.created_at < :endTime', { endTime })
      .orderBy('event.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    // Filter by userId if provided
    // Note: events.user_id stores HC person ID, which matches users.hcPersonId
    if (dto.userId) {
      queryBuilder.andWhere('event.user_id = :userId', { userId: dto.userId });
    }

    // Debug: log the query
    const sql = queryBuilder.getSql();
    this.logger.debug(`SQL Query: ${sql}`);
    this.logger.debug(
      `Parameters: startTime=${startTime.toISOString()}, endTime=${endTime.toISOString()}${dto.userId ? `, userId=${dto.userId}` : ''}`,
    );

    const [data, total] = await queryBuilder.getManyAndCount();

    this.logger.log(`Found ${total} events, returning page ${page}`);

    // Debug: log first event if exists
    if (data.length > 0) {
      this.logger.debug(
        `First event created_at: ${data[0].created_at.toISOString()}, user_id: ${data[0].user_id || 'null'}`,
      );
    }

    return {
      data,
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
