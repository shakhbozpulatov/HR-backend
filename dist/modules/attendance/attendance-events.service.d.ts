import { Repository } from 'typeorm';
import { AttendanceEvent } from './entities/attendance-event.entity';
import { AttendanceFilterDto } from './dto/attendance-filter.dto';
export declare class AttendanceEventsService {
    private eventRepository;
    constructor(eventRepository: Repository<AttendanceEvent>);
    processWebhookEvent(eventData: any, idempotencyKey: string): Promise<AttendanceEvent[]>;
    findAll(filterDto: AttendanceFilterDto): Promise<{
        data: AttendanceEvent[];
        total: number;
    }>;
    updateDeviceStatus(statusData: any): Promise<{
        success: boolean;
    }>;
    getQuarantinedEvents(): Promise<AttendanceEvent[]>;
    resolveQuarantinedEvent(eventId: string, userId: string, _actorId: string): Promise<AttendanceEvent>;
}
