import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { AttendanceEvent, ResolveQuarantineDto, UserDeviceMapping, WebhookEventDto } from '@/modules/attendance';
export declare class AttendanceEventsService {
    private eventRepository;
    private mappingRepository;
    private attendanceQueue;
    private configService;
    private dataSource;
    private readonly logger;
    private readonly webhookSecret;
    constructor(eventRepository: Repository<AttendanceEvent>, mappingRepository: Repository<UserDeviceMapping>, attendanceQueue: Queue, configService: ConfigService, dataSource: DataSource);
    processWebhookEvent(eventData: WebhookEventDto, idempotencyKey: string, signature?: string): Promise<AttendanceEvent>;
    findOne(eventId: string): Promise<AttendanceEvent>;
    findByUserId(userId: string, options?: {
        from?: Date;
        to?: Date;
        limit?: number;
    }): Promise<AttendanceEvent[]>;
    findByDeviceId(deviceId: string, options?: {
        from?: Date;
        to?: Date;
        limit?: number;
    }): Promise<AttendanceEvent[]>;
    deleteEvent(eventId: string): Promise<void>;
    getEventStatistics(filters: {
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
    }>;
    updateDeviceStatus(statusData: any): Promise<{
        success: boolean;
    }>;
    getIncompleteEvents(userId: string, date?: Date): Promise<AttendanceEvent[]>;
    private validateSignature;
    private queueEventProcessing;
    getQuarantinedEvents(): Promise<AttendanceEvent[]>;
    resolveQuarantinedEvent(eventId: string, resolveDto: ResolveQuarantineDto, actorId: string): Promise<AttendanceEvent>;
    retryFailedEvents(): Promise<void>;
    findAll(filterDto: any): Promise<{
        data: AttendanceEvent[];
        total: number;
    }>;
}
