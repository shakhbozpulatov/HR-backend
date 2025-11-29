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
import * as moment from 'moment-timezone';
import * as ExcelJS from 'exceljs';

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
      // Fetch events from HC with auto-resubscribe on OPEN000016 error
      let events: HcApiResponse;
      try {
        events = await this.hcService.getAllEvents(maxNumberPerTime);
      } catch (error) {
        // Check if error is OPEN000016 (subscription required)
        // For HttpException, we need to get the response object
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
            'OPEN000016 error detected - resubscribing to HC events',
          );

          // Resubscribe to events (subscribeType 1 is for alarm events)
          await this.hcService.subscribeEvent(1);
          this.logger.log('Successfully resubscribed to HC events');

          // Retry fetching events
          events = await this.hcService.getAllEvents(maxNumberPerTime);
          this.logger.log('Successfully fetched events after resubscription');
        } else {
          throw error;
        }
      }

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
   * Get user attendance by user_id with optional date filters
   * Returns all clock in/out events for a specific user
   * @param userId - HC person ID (user_id from attendance_events table)
   * @param startTime - Optional start time filter
   * @param endTime - Optional end time filter
   */
  async getUserAttendance(
    userId: string,
    startTime?: string,
    endTime?: string,
  ): Promise<{
    userId: string;
    userName: string;
    attendance: Array<{
      eventId: string;
      eventType: 'CLOCK_IN' | 'CLOCK_OUT';
      timestamp: string;
      timestampLocal: string;
    }>;
  }> {
    // Find the user by HC person ID
    const user = await this.userRepository.findOne({
      where: { hcPersonId: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Build query for attendance events
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .where('event.user_id = :userId', { userId })
      .orderBy('event.created_at', 'ASC');

    // Apply date filters if provided
    if (startTime) {
      queryBuilder.andWhere('event.created_at >= :startTime', {
        startTime: new Date(startTime),
      });
    }

    if (endTime) {
      queryBuilder.andWhere('event.created_at <= :endTime', {
        endTime: new Date(endTime),
      });
    }

    const events = await queryBuilder.getMany();

    // Map events to response format
    const attendance: Array<{
      eventId: string;
      eventType: 'CLOCK_IN' | 'CLOCK_OUT';
      timestamp: string;
      timestampLocal: string;
    }> = events.map((event) => ({
      eventId: event.event_id,
      eventType: (event.event_type === EventType.CLOCK_IN
        ? 'CLOCK_IN'
        : 'CLOCK_OUT') as 'CLOCK_IN' | 'CLOCK_OUT',
      timestamp: event.ts_utc.toISOString(),
      timestampLocal: event.ts_local.toISOString(),
    }));

    return {
      userId: user.hcPersonId || '',
      userName: `${user.first_name} ${user.last_name}`,
      attendance,
    };
  }

  /**
   * Get attendance events grouped by employees with date range
   * If no time range provided, returns last 7 days events
   * Returns attendance data for each employee with all dates in range
   * Can filter by userId (HC person ID - links events.user_id with users.hcPersonId)
   */
  async getEvents(dto: {
    startTime?: string;
    endTime?: string;
    page?: number;
    limit?: number;
    userId?: string;
  }): Promise<{
    employees: Array<{
      id: string;
      name: string;
      personId: string;
      phone: string | null;
      attendance: Array<{
        date: string;
        startTime: string | null;
        endTime: string | null;
        arrivalDifferenceSeconds: number | null; // negative = late, positive = early
        departureDifferenceSeconds: number | null; // negative = left early, positive = left late
      }>;
    }>;
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
    const endTime = dto.endTime ? new Date(dto.endTime) : new Date();
    const startTime = dto.startTime
      ? new Date(dto.startTime)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    this.logger.log(
      `Fetching employee attendance from ${startTime.toISOString()} to ${endTime.toISOString()}, page ${page}, limit ${limit}${dto.userId ? `, userId=${dto.userId}` : ''}`,
    );

    // Get users with their attendance events and schedule assignments
    let usersQuery = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.schedule_assignments', 'assignment')
      .leftJoinAndSelect('assignment.default_template', 'template')
      .where('user.hcPersonId IS NOT NULL');

    // Filter by specific user if userId is provided
    if (dto.userId) {
      usersQuery = usersQuery.andWhere('user.hcPersonId = :userId', {
        userId: dto.userId,
      });
    }

    // Get total count for pagination
    const total = await usersQuery.getCount();

    // Apply pagination
    const users = await usersQuery
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    this.logger.log(`Found ${total} users, processing ${users.length} users`);

    // Generate all dates in the range
    const dates: string[] = [];
    const currentDate = moment.utc(startTime);
    const endDate = moment.utc(endTime);

    while (currentDate.isSameOrBefore(endDate, 'day')) {
      dates.push(currentDate.format('YYYY-MM-DD'));
      currentDate.add(1, 'day');
    }

    // Process each user's attendance
    const employees = await Promise.all(
      users.map(async (user) => {
        // Fetch all events for this user in the date range based on created_at
        const events = await this.eventRepository
          .createQueryBuilder('event')
          .where('event.user_id = :userId', { userId: user.hcPersonId })
          .andWhere('event.created_at >= :startTime', { startTime })
          .andWhere('event.created_at <= :endTime', { endTime })
          .orderBy('event.created_at', 'ASC')
          .getMany();

        // Get user's active schedule template
        const activeAssignment = user.schedule_assignments?.find(
          (assignment) => {
            const now = new Date();
            const effectiveFrom = new Date(assignment.effective_from);
            const effectiveTo = assignment.effective_to
              ? new Date(assignment.effective_to)
              : null;

            return effectiveFrom <= now && (!effectiveTo || effectiveTo >= now);
          },
        );
        const scheduleTemplate = activeAssignment?.default_template;

        // Group events by date (based on created_at in UTC+5)
        const eventsByDate = new Map<string, AttendanceEvent[]>();
        events.forEach((event) => {
          // Convert to UTC+5 timezone for date grouping
          const dateStr = moment
            .utc(event.created_at)
            .utcOffset(5)
            .format('YYYY-MM-DD');
          if (!eventsByDate.has(dateStr)) {
            eventsByDate.set(dateStr, []);
          }
          eventsByDate.get(dateStr)!.push(event);
        });

        // Build attendance array for all dates
        const attendance = dates.map((date) => {
          const dayEvents = eventsByDate.get(date) || [];

          // Find first CLOCK_IN and last CLOCK_OUT based on created_at
          const clockInEvents = dayEvents.filter(
            (e) => e.event_type === EventType.CLOCK_IN,
          );
          const clockOutEvents = dayEvents.filter(
            (e) => e.event_type === EventType.CLOCK_OUT,
          );

          // Calculate startTime from first clock_in's created_at (in UTC+5)
          const startTime = clockInEvents.length
            ? moment
                .utc(clockInEvents[0].created_at)
                .utcOffset(5)
                .format('HH:mm')
            : null;

          // Calculate endTime with template fallback logic
          let endTime: string | null = null;
          if (clockOutEvents.length > 0) {
            // If there are clock_out events, use the last one's created_at (in UTC+5)
            endTime = moment
              .utc(clockOutEvents[clockOutEvents.length - 1].created_at)
              .utcOffset(5)
              .format('HH:mm');
          } else if (startTime && scheduleTemplate) {
            // If clock_in exists but no clock_out, use template end_time
            endTime = scheduleTemplate.end_time;
          }

          // Calculate arrival difference (late/early arrival) in seconds
          let arrivalDifferenceSeconds: number | null = null;
          if (startTime && scheduleTemplate?.start_time) {
            // Create moment objects for scheduled and actual times on the same date
            const scheduledStart = moment(
              `${date} ${scheduleTemplate.start_time}`,
              'YYYY-MM-DD HH:mm',
            );
            const actualStart = moment(
              `${date} ${startTime}`,
              'YYYY-MM-DD HH:mm',
            );

            // Calculate difference: positive = early (came before scheduled), negative = late (came after scheduled)
            arrivalDifferenceSeconds = scheduledStart.diff(
              actualStart,
              'seconds',
            );
          }

          // Calculate departure difference (early/late departure) in seconds
          let departureDifferenceSeconds: number | null = null;
          if (endTime && scheduleTemplate?.end_time) {
            // Create moment objects for scheduled and actual times on the same date
            const scheduledEnd = moment(
              `${date} ${scheduleTemplate.end_time}`,
              'YYYY-MM-DD HH:mm',
            );
            const actualEnd = moment(`${date} ${endTime}`, 'YYYY-MM-DD HH:mm');

            // Calculate difference: positive = stayed late (left after scheduled), negative = left early (left before scheduled)
            departureDifferenceSeconds = actualEnd.diff(
              scheduledEnd,
              'seconds',
            );
          }

          return {
            date,
            startTime,
            endTime,
            arrivalDifferenceSeconds,
            departureDifferenceSeconds,
          };
        });

        return {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          personId: user.hcPersonId || '',
          phone: user.phone || null,
          attendance,
        };
      }),
    );

    this.logger.log(`Processed attendance for ${employees.length} employees`);

    return {
      employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Export attendance events to Excel
   * Uses the same logic as getEvents but formats output as Excel file
   */
  async exportToExcel(dto: {
    startTime?: string;
    endTime?: string;
    userId?: string;
  }): Promise<Buffer> {
    this.logger.log(
      `Exporting attendance to Excel: ${dto.startTime || 'last 7 days'} to ${dto.endTime || 'now'}${dto.userId ? `, userId=${dto.userId}` : ''}`,
    );

    // Set default time range to last 7 days if not provided (UTC)
    const endTime = dto.endTime ? new Date(dto.endTime) : new Date();
    const startTime = dto.startTime
      ? new Date(dto.startTime)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get users with their attendance events and schedule assignments
    let usersQuery = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.schedule_assignments', 'assignment')
      .leftJoinAndSelect('assignment.default_template', 'template')
      .where('user.hcPersonId IS NOT NULL');

    // Filter by specific user if userId is provided
    if (dto.userId) {
      usersQuery = usersQuery.andWhere('user.hcPersonId = :userId', {
        userId: dto.userId,
      });
    }

    const users = await usersQuery.getMany();

    this.logger.log(`Exporting attendance for ${users.length} users to Excel`);

    // Generate all dates in the range
    const dates: string[] = [];
    const currentDate = moment.utc(startTime);
    const endDate = moment.utc(endTime);

    while (currentDate.isSameOrBefore(endDate, 'day')) {
      dates.push(currentDate.format('YYYY-MM-DD'));
      currentDate.add(1, 'day');
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');

    // Set up column headers
    const columns = [
      { header: '№', key: 'index', width: 5 },
      { header: 'ID', key: 'id', width: 36 },
      { header: 'Full Name', key: 'name', width: 30 },
      { header: 'Person ID', key: 'personId', width: 20 },
      { header: 'Phone', key: 'phone', width: 15 },
    ];

    // Add date columns with time and difference columns
    dates.forEach((date) => {
      columns.push({
        header: `${date} Time`,
        key: `${date}_time`,
        width: 20,
      });
      columns.push({
        header: `${date} Arrival Diff (s)`,
        key: `${date}_arrival`,
        width: 18,
      });
      columns.push({
        header: `${date} Departure Diff (s)`,
        key: `${date}_departure`,
        width: 20,
      });
    });

    worksheet.columns = columns;

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 11 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    worksheet.getRow(1).alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    worksheet.getRow(1).height = 25;

    // Process each user's attendance
    let rowIndex = 1;
    for (const user of users) {
      // Fetch all events for this user in the date range based on created_at
      const events = await this.eventRepository
        .createQueryBuilder('event')
        .where('event.user_id = :userId', { userId: user.hcPersonId })
        .andWhere('event.created_at >= :startTime', { startTime })
        .andWhere('event.created_at <= :endTime', { endTime })
        .orderBy('event.created_at', 'ASC')
        .getMany();

      // Get user's active schedule template
      const activeAssignment = user.schedule_assignments?.find((assignment) => {
        const now = new Date();
        const effectiveFrom = new Date(assignment.effective_from);
        const effectiveTo = assignment.effective_to
          ? new Date(assignment.effective_to)
          : null;

        return effectiveFrom <= now && (!effectiveTo || effectiveTo >= now);
      });
      const scheduleTemplate = activeAssignment?.default_template;

      // Group events by date (based on created_at in UTC+5)
      const eventsByDate = new Map<string, AttendanceEvent[]>();
      events.forEach((event) => {
        // Convert to UTC+5 timezone for date grouping
        const dateStr = moment
          .utc(event.created_at)
          .utcOffset(5)
          .format('YYYY-MM-DD');
        if (!eventsByDate.has(dateStr)) {
          eventsByDate.set(dateStr, []);
        }
        eventsByDate.get(dateStr)!.push(event);
      });

      // Build row data
      const rowData: any = {
        index: rowIndex,
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        personId: user.hcPersonId || '',
        phone: user.phone || '-',
      };

      // Add attendance data for each date
      dates.forEach((date) => {
        const dayEvents = eventsByDate.get(date) || [];

        // Find first CLOCK_IN and last CLOCK_OUT based on created_at
        const clockInEvents = dayEvents.filter(
          (e) => e.event_type === EventType.CLOCK_IN,
        );
        const clockOutEvents = dayEvents.filter(
          (e) => e.event_type === EventType.CLOCK_OUT,
        );

        // Calculate startTime from first clock_in's created_at (in UTC+5)
        const startTimeStr = clockInEvents.length
          ? moment.utc(clockInEvents[0].created_at).utcOffset(5).format('HH:mm')
          : null;

        // Calculate endTime with template fallback logic
        let endTimeStr: string | null = null;
        if (clockOutEvents.length > 0) {
          // If there are clock_out events, use the last one's created_at (in UTC+5)
          endTimeStr = moment
            .utc(clockOutEvents[clockOutEvents.length - 1].created_at)
            .utcOffset(5)
            .format('HH:mm');
        } else if (startTimeStr && scheduleTemplate) {
          // If clock_in exists but no clock_out, use template end_time
          endTimeStr = scheduleTemplate.end_time;
        }

        // Calculate arrival difference (late/early arrival) in seconds
        let arrivalDiff: number | null = null;
        if (startTimeStr && scheduleTemplate?.start_time) {
          const scheduledStart = moment(
            `${date} ${scheduleTemplate.start_time}`,
            'YYYY-MM-DD HH:mm',
          );
          const actualStart = moment(
            `${date} ${startTimeStr}`,
            'YYYY-MM-DD HH:mm',
          );
          arrivalDiff = scheduledStart.diff(actualStart, 'seconds');
        }

        // Calculate departure difference (early/late departure) in seconds
        let departureDiff: number | null = null;
        if (endTimeStr && scheduleTemplate?.end_time) {
          const scheduledEnd = moment(
            `${date} ${scheduleTemplate.end_time}`,
            'YYYY-MM-DD HH:mm',
          );
          const actualEnd = moment(`${date} ${endTimeStr}`, 'YYYY-MM-DD HH:mm');
          departureDiff = actualEnd.diff(scheduledEnd, 'seconds');
        }

        // Format: "09:00 - 18:00" or "-" if no attendance
        rowData[`${date}_time`] =
          startTimeStr && endTimeStr
            ? `${startTimeStr} - ${endTimeStr}`
            : startTimeStr
              ? startTimeStr
              : '-';

        rowData[`${date}_arrival`] = arrivalDiff !== null ? arrivalDiff : '-';
        rowData[`${date}_departure`] =
          departureDiff !== null ? departureDiff : '-';
      });

      worksheet.addRow(rowData);
      rowIndex++;
    }

    // Auto-fit columns (optional - can be removed if not needed)
    worksheet.columns.forEach((column) => {
      if (column.header !== '№') {
        column.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    this.logger.log(
      `Excel export complete: ${rowIndex - 1} employees exported`,
    );

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
