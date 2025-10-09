import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsObject,
  IsUUID,
  Length,
} from 'class-validator';
import { EventType } from '../entities/attendance-event.entity';

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
  };

  @IsOptional()
  @IsString()
  signature?: string;
}
