import { EventType } from '../entities/attendance-event.entity';
export declare class WebhookEventDto {
    event_id: string;
    device_id: string;
    terminal_user_id?: string;
    event_type: EventType;
    timestamp: string;
    metadata?: any;
}
