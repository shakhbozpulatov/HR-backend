import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HcService } from '@/modules/hc/hc.service';
import { TerminalDevice } from '../entities/terminal-device.entity';
import { CreateTerminalDto } from '../dto/create-terminal.dto';

/**
 * Terminal HC Integration Service
 * Handles integration between Terminal devices and HC Cabinet
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles terminal-HC integration logic
 * - Dependency Inversion: Depends on abstractions (HcService, Repository)
 * - Open/Closed: Easy to extend with new integration methods
 */
@Injectable()
export class TerminalHcIntegrationService {
  private readonly logger = new Logger(TerminalHcIntegrationService.name);

  constructor(
    @InjectRepository(TerminalDevice)
    private terminalRepository: Repository<TerminalDevice>,
    private readonly hcService: HcService,
  ) {}

  /**
   * Register terminal on HC Cabinet and save locally
   * @param dto - Terminal creation data
   * @param companyId - Company ID
   * @returns Created terminal with HC sync data
   */
  async registerTerminalWithHC(
    dto: CreateTerminalDto,
    companyId: string,
  ): Promise<TerminalDevice> {
    this.logger.log(`Registering terminal on HC Cabinet: ${dto.name}`);

    try {
      // 1. Validate required HC fields
      if (!dto.ip_address) {
        throw new BadRequestException(
          'IP address is required for HC registration',
        );
      }

      // 2. Register device on HC Cabinet
      const hcResponse = await this.hcService.registerDeviceOnCabinet({
        deviceName: dto.name,
        ipAddress: dto.ip_address,
        port: dto.port,
        serialNumber: dto.serial_number,
        locationId: dto.location,
      });

      // 3. Check HC response
      if (hcResponse.errorCode !== 0 && hcResponse.errorCode !== '0') {
        throw new BadRequestException(
          `HC Cabinet registration failed: ${hcResponse.message}`,
        );
      }

      // Extract HC device ID from response
      const hcDeviceId = hcResponse.data?.deviceId;

      if (!hcDeviceId) {
        throw new BadRequestException(
          'HC Cabinet did not return device ID',
        );
      }

      this.logger.log(`Device registered on HC Cabinet with ID: ${hcDeviceId}`);

      // 4. Save terminal to local database with HC sync data
      // Destructure to remove register_on_hc flag
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { register_on_hc, ...terminalData } = dto;
      const terminal = this.terminalRepository.create({
        ...terminalData,
        company_id: companyId,
        hc_device_id: hcDeviceId,
        is_hc_synced: true,
      });

      const savedTerminal = await this.terminalRepository.save(terminal);

      this.logger.log(
        `Terminal saved locally with ID: ${savedTerminal.id}, HC ID: ${hcDeviceId}`,
      );

      return savedTerminal;
    } catch (error) {
      this.logger.error(
        `Failed to register terminal on HC: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Sync terminal status with HC Cabinet
   * @param terminalId - Local terminal ID
   * @returns Updated terminal with HC status
   */
  async syncTerminalStatusWithHC(
    terminalId: string,
  ): Promise<TerminalDevice> {
    this.logger.log(`Syncing terminal status with HC Cabinet: ${terminalId}`);

    const terminal = await this.terminalRepository.findOne({
      where: { id: terminalId },
    });

    if (!terminal) {
      throw new BadRequestException('Terminal not found');
    }

    if (!terminal.hc_device_id) {
      throw new BadRequestException('Terminal is not registered on HC Cabinet');
    }

    try {
      // Get device status from HC Cabinet
      const hcStatusResponse = await this.hcService.getDeviceStatus(
        terminal.hc_device_id,
      );

      if (
        hcStatusResponse.errorCode === 0 ||
        hcStatusResponse.errorCode === '0'
      ) {
        // Update local status based on HC status
        const hcStatus = hcStatusResponse.data?.status;

        // Map HC status to local status
        // HC status: 1 = online, 0 = offline, 2 = maintenance
        if (hcStatus === 1) {
          terminal.status = 'ONLINE' as any;
        } else if (hcStatus === 2) {
          terminal.status = 'MAINTENANCE' as any;
        } else {
          terminal.status = 'OFFLINE' as any;
        }

        terminal.last_seen_at = new Date();
        await this.terminalRepository.save(terminal);

        this.logger.log(`Terminal status synced: ${terminal.status}`);
      }

      return terminal;
    } catch (error) {
      this.logger.error(
        `Failed to sync terminal status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Unbind terminal from HC Cabinet
   * @param terminalId - Local terminal ID
   * @returns Updated terminal
   */
  async unbindTerminalFromHC(terminalId: string): Promise<TerminalDevice> {
    this.logger.log(`Unbinding terminal from HC Cabinet: ${terminalId}`);

    const terminal = await this.terminalRepository.findOne({
      where: { id: terminalId },
    });

    if (!terminal) {
      throw new BadRequestException('Terminal not found');
    }

    if (!terminal.hc_device_id) {
      throw new BadRequestException('Terminal is not registered on HC Cabinet');
    }

    try {
      // Delete device from HC Cabinet
      await this.hcService.deleteDeviceFromCabinet(terminal.hc_device_id);

      // Update local terminal
      terminal.hc_device_id = null;
      terminal.is_hc_synced = false;

      await this.terminalRepository.save(terminal);

      this.logger.log(`Terminal unbound from HC Cabinet: ${terminalId}`);

      return terminal;
    } catch (error) {
      this.logger.error(
        `Failed to unbind terminal: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Sync all terminals with HC Cabinet
   * @param companyId - Company ID (optional)
   * @returns List of synced terminals
   */
  async syncAllTerminalsWithHC(
    companyId?: string,
  ): Promise<TerminalDevice[]> {
    this.logger.log('Syncing all terminals with HC Cabinet');

    const where = companyId
      ? { company_id: companyId, is_hc_synced: true }
      : { is_hc_synced: true };

    const terminals = await this.terminalRepository.find({ where });

    const syncedTerminals: TerminalDevice[] = [];

    for (const terminal of terminals) {
      try {
        const synced = await this.syncTerminalStatusWithHC(terminal.id);
        syncedTerminals.push(synced);
      } catch (error) {
        this.logger.warn(
          `Failed to sync terminal ${terminal.id}: ${error.message}`,
        );
        // Continue with next terminal
      }
    }

    this.logger.log(`Synced ${syncedTerminals.length} terminals`);

    return syncedTerminals;
  }

  /**
   * List all devices from HC Cabinet
   * @param pageIndex - Page number
   * @param pageSize - Items per page
   * @returns HC devices list
   */
  async listHCDevices(pageIndex: number, pageSize: number) {
    this.logger.log(`Listing HC devices: page ${pageIndex}, size ${pageSize}`);

    try {
      const response = await this.hcService.listDevicesFromCabinet(
        pageIndex,
        pageSize,
      );

      if (response.errorCode === 0 || response.errorCode === '0') {
        return response.data;
      }

      throw new BadRequestException(
        `Failed to list HC devices: ${response.message}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to list HC devices: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
