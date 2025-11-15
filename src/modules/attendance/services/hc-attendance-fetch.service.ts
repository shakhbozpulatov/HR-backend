import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HcService } from '@/modules/hc/hc.service';
import { User } from '@/modules/users/entities/user.entity';
import {
  AttendanceEvent,
  EventType,
  EventSource,
  ProcessingStatus,
} from '@/modules/attendance';
import {
  TerminalDevice,
  DeviceStatus,
} from '@/modules/terminals/entities/terminal-device.entity';
import {
  FetchAttendanceEventsDto,
  FetchAttendanceEventsResponseDto,
  UserAttendanceSummaryDto,
  WorkSessionDto,
  PaginationMetadataDto,
} from '../dto/fetch-attendance-events.dto';
import { HcCertificateRecord } from '@/modules/hc/interfaces/hc-api.interface';

/**
 * Service for fetching and processing HC attendance events
 */
@Injectable()
export class HcAttendanceFetchService {
  private readonly logger = new Logger(HcAttendanceFetchService.name);

  constructor(
    private readonly hcService: HcService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AttendanceEvent)
    private readonly attendanceEventRepository: Repository<AttendanceEvent>,
    @InjectRepository(TerminalDevice)
    private readonly terminalDeviceRepository: Repository<TerminalDevice>,
  ) {}

  /**
   * Fetch attendance events from HC and process them
   */
  async fetchAndProcessEvents(
    dto: FetchAttendanceEventsDto,
  ): Promise<FetchAttendanceEventsResponseDto> {
    //Set last 3 seconds for certificate records
    const beginTime = new Date().toISOString();
    let endTime = new Date(Date.now() - 3 * 1000).toISOString();

    this.logger.log(
      `Fetching certificate records from HC: ${beginTime} to ${endTime}, page ${dto.page}`,
    );

    // Fetch certificate records from HC
    const hcResponse = await this.hcService.searchCertificateRecords({
      pageIndex: dto.page,
      pageSize: 5,
      searchCreteria: {
        beginTime: beginTime,
        endTime: endTime,
      },
    });

    if (hcResponse.errorCode !== '0' && hcResponse.errorCode !== 0) {
      throw new Error(`HC API error: ${hcResponse.message || 'Unknown error'}`);
    }

    const certificateData = hcResponse.data;
    if (!certificateData || !certificateData.recordList) {
      return {
        data: [],
        message: 'certificate list is empty',
        pagination: {
          page: dto.page,
          limit: dto.maxNumberPerTime,
          total: 0,
          totalPages: 0,
        },
      };
    }

    this.logger.log(
      `Received ${certificateData.recordList.length} records from HC`,
    );

    // Set default time range (last 7 days) if not provided
    endTime = dto.endTime || new Date().toISOString();
    const startTime =
      dto.startTime ||
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    return;

    // Filter only successful events (eventType: 80093)
    const successfulRecords = certificateData.recordList.filter(
      (record) => record.eventType === 80093,
    );

    this.logger.log(
      `Filtered ${successfulRecords.length} successful events (eventType: 80093)`,
    );

    // Process and save events
    await this.processAndSaveEvents(successfulRecords);

    // Transform to required output format
    const transformedData = await this.transformToOutputFormat(
      successfulRecords,
      startTime,
      endTime,
    );

    return {
      data: transformedData,
      pagination: {
        page: dto.page,
        limit: dto.maxNumberPerTime,
        total: certificateData.totalNum,
        totalPages: Math.ceil(certificateData.totalNum / dto.maxNumberPerTime),
      },
    };
  }

  /**
   * Process HC certificate records and save to database
   */
  private async processAndSaveEvents(
    records: HcCertificateRecord[],
  ): Promise<void> {
    for (const record of records) {
      try {
        // Skip if no person info
        if (!record.personInfo?.id) {
          this.logger.warn(
            `Skipping record ${record.recordGuid}: No personCode found`,
          );
          continue;
        }

        const personId = record.personInfo.id;

        // Find user by hcPersonId (which should match personCode)
        const user = await this.userRepository.findOne({
          where: { hcPersonId: personId },
        });

        if (!user) {
          this.logger.warn(
            `User not found for personCode: ${personId}. Skipping event.`,
          );
          continue;
        }

        // Find or create terminal device
        const device = await this.getOrCreateTerminalDevice(
          record.deviceId,
          record.deviceName,
          user.company_id,
        );

        // Determine event type (CLOCK_IN or CLOCK_OUT)
        const eventType = await this.determineEventType(user);

        // Create idempotency key to prevent duplicates
        // const idempotencyKey = `hc-cert-${record.recordGuid}`;

        // Create attendance event
        const attendanceEvent = this.attendanceEventRepository.create({
          user_id: user.id,
          device_id: device.id,
          event_type: eventType,
          event_source: EventSource.BIOMETRIC_DEVICE,
          ts_utc: new Date(record.occurTime),
          ts_local: new Date(record.deviceTime),
          source_payload: record,
          signature_valid: true,
          processing_status: ProcessingStatus.PENDING,
        });

        await this.attendanceEventRepository.save(attendanceEvent);

        // Update user's last event type and date
        const eventDate = new Date(record.occurTime);
        await this.userRepository.update(user.id, {
          last_event_type: eventType,
          last_event_date: eventDate,
        });

        this.logger.log(
          `Saved ${eventType} event for user ${user.first_name} ${user.last_name} at ${record.occurTime}`,
        );
      } catch (error) {
        this.logger.error(
          `Error processing record ${record.recordGuid}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  /**
   * Determine event type based on user's last event
   */
  private async determineEventType(user: User): Promise<EventType> {
    const today = new Date().toISOString().split('T')[0];
    const lastEventDate = user.last_event_date
      ? new Date(user.last_event_date).toISOString().split('T')[0]
      : null;

    // If no last event or last event was on a different day, this is CLOCK_IN
    if (!user.last_event_type || lastEventDate !== today) {
      return EventType.CLOCK_IN;
    }

    // Alternate between CLOCK_IN and CLOCK_OUT
    return user.last_event_type === 'clock_in'
      ? EventType.CLOCK_OUT
      : EventType.CLOCK_IN;
  }

  /**
   * Get or create terminal device
   */
  private async getOrCreateTerminalDevice(
    deviceId: string,
    deviceName: string,
    companyId: string,
  ): Promise<TerminalDevice> {
    let device = await this.terminalDeviceRepository.findOne({
      where: { metadata: { hcDeviceId: deviceId } as any },
    });

    if (!device) {
      device = this.terminalDeviceRepository.create({
        company_id: companyId,
        name: deviceName || `HC Device ${deviceId}`,
        location: 'Unknown',
        status: DeviceStatus.ONLINE,
        vendor: 'Hikvision',
        metadata: { hcDeviceId: deviceId },
        last_seen_at: new Date(),
      });
      await this.terminalDeviceRepository.save(device);
      this.logger.log(`Created new terminal device: ${deviceName}`);
    }

    return device;
  }

  /**
   * Transform HC events to required output format
   */
  private async transformToOutputFormat(
    records: HcCertificateRecord[],
    startTime: string,
    endTime: string,
  ): Promise<UserAttendanceSummaryDto[]> {
    // Group events by user and date
    const userDayMap = new Map<string, Map<string, HcCertificateRecord[]>>();

    for (const record of records) {
      if (!record.personInfo?.baseInfo?.personCode) continue;

      const personCode = record.personInfo.baseInfo.personCode;
      const eventDate = new Date(record.occurTime).toISOString().split('T')[0];

      if (!userDayMap.has(personCode)) {
        userDayMap.set(personCode, new Map());
      }

      const dayMap = userDayMap.get(personCode);
      if (!dayMap.has(eventDate)) {
        dayMap.set(eventDate, []);
      }

      dayMap.get(eventDate).push(record);
    }

    const result: UserAttendanceSummaryDto[] = [];

    // Process each user-day combination
    for (const [personCode, dayMap] of userDayMap.entries()) {
      const user = await this.userRepository.findOne({
        where: { hcPersonId: personCode },
      });

      if (!user) continue;

      for (const [date, events] of dayMap.entries()) {
        // Sort events by time
        const sortedEvents = events.sort(
          (a, b) =>
            new Date(a.occurTime).getTime() - new Date(b.occurTime).getTime(),
        );

        // Build inner data (entry/exit intervals)
        const innerData: WorkSessionDto[] = [];
        for (let i = 0; i < sortedEvents.length; i += 2) {
          const entryEvent = sortedEvents[i];
          const exitEvent = sortedEvents[i + 1];

          innerData.push({
            entryTime: entryEvent.occurTime,
            exitTime: exitEvent ? exitEvent.occurTime : null,
          });
        }

        result.push({
          userId: user.id,
          userName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          clockIn: sortedEvents[0]?.occurTime || null,
          clockOut:
            sortedEvents.length > 1
              ? sortedEvents[sortedEvents.length - 1].occurTime
              : null,
          innerData,
        });
      }
    }

    return result;
  }
}
