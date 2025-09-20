import { AttendanceEventsService } from './attendance-events.service';
import { AttendanceFilterDto } from './dto/attendance-filter.dto';
export declare class AttendanceEventsController {
    private readonly eventsService;
    constructor(eventsService: AttendanceEventsService);
    receiveWebhookEvent(eventData: any, idempotencyKey: string): Promise<import("./entities/attendance-event.entity").AttendanceEvent[]>;
    receiveDeviceStatus(statusData: any): Promise<{
        success: boolean;
    }>;
    getEvents(filterDto: AttendanceFilterDto): Promise<{
        data: import("./entities/attendance-event.entity").AttendanceEvent[];
        total: number;
    }>;
    getQuarantinedEvents(): Promise<import("./entities/attendance-event.entity").AttendanceEvent[]>;
    resolveQuarantinedEvent(eventId: string, resolveDto: {
        employee_id: string;
    }): Promise<import("./entities/attendance-event.entity").AttendanceEvent>;
}
