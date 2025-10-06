import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
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
}
