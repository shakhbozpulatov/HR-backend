import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsObject,
  IsUUID,
  Length,
} from 'class-validator';
import { EventType } from '@/modules/attendance';

export class WebhookEventDto {
  @IsString()
  @IsUUID()
  device_id: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  terminal_user_id?: string;

  @IsEnum(EventType)
  event_type: EventType;

  @IsDateString()
  timestamp: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsObject()
  metadata?: {
    temperature?: number;
    mask_detected?: boolean;
    image_url?: string;
    verification_method?: 'fingerprint' | 'face' | 'card' | 'pin';
    quality_score?: number;
    deviceTime?: string; // Device local time with timezone (e.g., "2025-12-06T16:23:35+05:00")
    [key: string]: any; // Allow additional HC API fields
  };

  @IsOptional()
  @IsString()
  signature?: string;
}
