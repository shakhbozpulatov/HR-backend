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

  async findAll(companyId?: string): Promise<TerminalDevice[]> {
    const where = companyId ? { company_id: companyId } : {};
    return await this.deviceRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, companyId?: string): Promise<TerminalDevice> {
    const where: any = { id };
    if (companyId) {
      where.company_id = companyId;
    }

    const device = await this.deviceRepository.findOne({ where });

    if (!device) {
      throw new NotFoundException('Terminal device not found');
    }

    return device;
  }

  async create(
    deviceData: Partial<TerminalDevice>,
    companyId: string,
  ): Promise<TerminalDevice> {
    const device = this.deviceRepository.create({
      ...deviceData,
      company_id: companyId,
    });
    return await this.deviceRepository.save(device);
  }

  async updateStatus(
    deviceId: string,
    status: DeviceStatus,
    companyId?: string,
  ): Promise<TerminalDevice> {
    const device = await this.findOne(deviceId, companyId);
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
