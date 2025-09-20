import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsObject,
  IsNumber,
} from 'class-validator';
import { EventType } from '../entities/attendance-event.entity';

export class WebhookEventDto {
  @IsString()
  event_id: string;

  @IsString()
  device_id: string;

  @IsOptional()
  @IsString()
  terminal_user_id?: string;

  @IsEnum(EventType)
  event_type: EventType;

  @IsDateString()
  timestamp: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}
