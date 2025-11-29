import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TerminalDevice,
  DeviceStatus,
} from './entities/terminal-device.entity';
import { TerminalHcIntegrationService } from './services/terminal-hc-integration.service';
import { CreateTerminalDto } from './dto/create-terminal.dto';

@Injectable()
export class TerminalsService {
  constructor(
    @InjectRepository(TerminalDevice)
    private deviceRepository: Repository<TerminalDevice>,
    private readonly hcIntegrationService: TerminalHcIntegrationService,
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
    deviceData: CreateTerminalDto,
    companyId: string,
  ): Promise<TerminalDevice> {
    // Check if device should be registered on HC Cabinet
    if (deviceData.register_on_hc) {
      return await this.hcIntegrationService.registerTerminalWithHC(
        deviceData,
        companyId,
      );
    }

    // Create terminal without HC registration
    // Destructure to remove register_on_hc flag
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { register_on_hc, ...terminalData } = deviceData;
    const device = this.deviceRepository.create({
      ...terminalData,
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
