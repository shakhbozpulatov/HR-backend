import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUUID,
  Matches,
  IsNumber,
  Min,
  Max,
  IsObject,
} from 'class-validator';

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  DISCONNECTED = 'disconnected',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
}

export class DeviceStatusDto {
  @IsString()
  @IsUUID()
  device_id: string;

  @IsEnum(DeviceStatus)
  status: DeviceStatus;

  @IsOptional()
  @IsDateString()
  last_seen?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)
  ip_address?: string;

  @IsOptional()
  @IsString()
  firmware_version?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  battery_level?: number;

  @IsOptional()
  @IsObject()
  health_metrics?: {
    cpu_usage?: number;
    memory_usage?: number;
    storage_usage?: number;
    temperature?: number;
  };
}
