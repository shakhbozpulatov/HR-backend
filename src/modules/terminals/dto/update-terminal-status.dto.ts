import { IsEnum } from 'class-validator';
import { DeviceStatus } from '../entities/terminal-device.entity';

export class UpdateTerminalStatusDto {
  @IsEnum(DeviceStatus)
  status: DeviceStatus;
}