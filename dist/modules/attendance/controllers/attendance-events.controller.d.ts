import { AttendanceEventsService } from '@/modules/attendance';
import { AttendanceFilterDto, WebhookEventDto, ResolveQuarantineDto } from '../dto';
export declare class AttendanceEventsController {
    private readonly eventsService;
    constructor(eventsService: AttendanceEventsService);
    receiveWebhookEvent(eventData: WebhookEventDto, idempotencyKey: string, signature?: string): Promise<{
        success: boolean;
        error: string;
        data?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        data: import("@/modules/attendance").AttendanceEvent;
        message: string;
        error?: undefined;
    }>;
    getEvents(filterDto: AttendanceFilterDto): Promise<{
        data: import("@/modules/attendance").AttendanceEvent[];
        total: number;
    }>;
    getQuarantinedEvents(): Promise<{
        success: boolean;
        data: import("@/modules/attendance").AttendanceEvent[];
        total: number;
    }>;
    resolveQuarantinedEvent(eventId: string, resolveDto: ResolveQuarantineDto, actorId: string): Promise<{
        success: boolean;
        data: import("@/modules/attendance").AttendanceEvent;
        message: string;
    }>;
    retryFailedEvents(): Promise<{
        success: boolean;
        message: string;
    }>;
    getEventById(eventId: string): Promise<{
        success: boolean;
        data: import("@/modules/attendance").AttendanceEvent;
    }>;
}
