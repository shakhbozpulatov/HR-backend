import { EventType } from '../entities/attendance-event.entity';
export declare class WebhookEventDto {
    device_id: string;
    terminal_user_id?: string;
    event_type: EventType;
    timestamp: string;
    timezone?: string;
    metadata?: {
        temperature?: number;
        mask_detected?: boolean;
        image_url?: string;
        verification_method?: 'fingerprint' | 'face' | 'card' | 'pin';
        quality_score?: number;
    };
    signature?: string;
}
