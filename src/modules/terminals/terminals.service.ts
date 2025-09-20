import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TerminalDevice,
  DeviceStatus,
} from './entities/terminal-device.entity';

@Injectable()
export class TerminalsService {
  constructor(
    @InjectRepository(TerminalDevice)
    private deviceRepository: Repository<TerminalDevice>,
  ) {}

  async findAll(): Promise<TerminalDevice[]> {
    return await this.deviceRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<TerminalDevice> {
    const device = await this.deviceRepository.findOne({
      where: { device_id: id },
    });

    if (!device) {
      throw new NotFoundException('Terminal device not found');
    }

    return device;
  }

  async create(deviceData: Partial<TerminalDevice>): Promise<TerminalDevice> {
    const device = this.deviceRepository.create(deviceData);
    return await this.deviceRepository.save(device);
  }

  async updateStatus(
    deviceId: string,
    status: DeviceStatus,
  ): Promise<TerminalDevice> {
    const device = await this.findOne(deviceId);
    device.status = status;
    device.last_seen_at = new Date();
    return await this.deviceRepository.save(device);
  }

  async getOnlineDevices(): Promise<TerminalDevice[]> {
    return await this.deviceRepository.find({
      where: { status: DeviceStatus.ONLINE },
    });
  }

  async getOfflineDevices(): Promise<TerminalDevice[]> {
    return await this.deviceRepository.find({
      where: { status: DeviceStatus.OFFLINE },
    });
  }
}
