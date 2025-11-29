import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { DeviceStatus } from '../entities/terminal-device.entity';

export class CreateTerminalDto {
  @IsUUID()
  @IsOptional()
  company_id?: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;

  @IsOptional()
  @IsString()
  vendor: string;

  @IsOptional()
  metadata?: any;

  // HC Cabinet Integration Fields
  @IsString()
  @IsOptional()
  hc_access_level_id?: string;

  @IsString()
  @IsOptional()
  serial_number?: string;

  @IsString()
  @IsOptional()
  ip_address?: string;

  @IsNumber()
  @IsOptional()
  port?: number;

  @IsBoolean()
  @IsOptional()
  register_on_hc?: boolean; // Flag to register device on HC Cabinet
}
