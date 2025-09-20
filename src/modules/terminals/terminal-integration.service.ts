import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TerminalDevice } from './entities/terminal-device.entity';
import { Employee } from '../employees/entities/employee.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';

interface CreateTerminalUserRequest {
  display_name: string;
  terminal_user_external_id: string;
}

interface CreateTerminalUserResponse {
  terminal_user_id: string;
  status: string;
}

@Injectable()
export class TerminalIntegrationService {
  private readonly logger = new Logger(TerminalIntegrationService.name);
  private readonly vendorApiUrl: string;
  private readonly vendorApiKey: string;

  constructor(
    @InjectRepository(TerminalDevice)
    private deviceRepository: Repository<TerminalDevice>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private configService: ConfigService,
  ) {
    this.vendorApiUrl = this.configService.get('VENDOR_API_URL');
    this.vendorApiKey = this.configService.get('VENDOR_API_KEY');
  }

  async createTerminalUser(
    request: CreateTerminalUserRequest,
  ): Promise<string> {
    try {
      const response = await axios.post<CreateTerminalUserResponse>(
        `${this.vendorApiUrl}/users`,
        request,
        {
          headers: {
            Authorization: `Bearer ${this.vendorApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      this.logger.log(
        `Created terminal user: ${response.data.terminal_user_id}`,
      );
      return response.data.terminal_user_id;
    } catch (error) {
      this.logger.error(`Failed to create terminal user: ${error.message}`);
      throw error;
    }
  }

  async updateTerminalUser(
    terminalUserId: string,
    updates: Partial<CreateTerminalUserRequest>,
  ): Promise<void> {
    try {
      await axios.patch(
        `${this.vendorApiUrl}/users/${terminalUserId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${this.vendorApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      this.logger.log(`Updated terminal user: ${terminalUserId}`);
    } catch (error) {
      this.logger.error(
        `Failed to update terminal user ${terminalUserId}: ${error.message}`,
      );
      throw error;
    }
  }

  async deleteTerminalUser(terminalUserId: string): Promise<void> {
    try {
      await axios.delete(`${this.vendorApiUrl}/users/${terminalUserId}`, {
        headers: {
          Authorization: `Bearer ${this.vendorApiKey}`,
        },
        timeout: 10000,
      });

      this.logger.log(`Deleted terminal user: ${terminalUserId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete terminal user ${terminalUserId}: ${error.message}`,
      );
      throw error;
    }
  }

  async syncTerminalUsers(): Promise<void> {
    try {
      this.logger.log('Starting terminal user synchronization');

      // Get all vendor users
      const response = await axios.get(`${this.vendorApiUrl}/users`, {
        headers: {
          Authorization: `Bearer ${this.vendorApiKey}`,
        },
        timeout: 30000,
      });

      const vendorUsers = response.data.users || [];
      const vendorUserMap = new Map(
        vendorUsers.map((user: any) => [user.terminal_user_external_id, user]),
      );

      // Get all employees with terminal user mappings
      const employees = await this.employeeRepository.find({
        where: { status: 'active' as any },
      });

      const syncResults = {
        created: 0,
        updated: 0,
        missing: 0,
        errors: 0,
      };

      for (const employee of employees) {
        try {
          if (!employee.terminal_user_id) {
            // Employee doesn't have terminal user - create one
            const terminalUserId = await this.createTerminalUser({
              display_name: `${employee.first_name} ${employee.last_name}`,
              terminal_user_external_id: employee.employee_id,
            });

            employee.terminal_user_id = terminalUserId;
            await this.employeeRepository.save(employee);
            syncResults.created++;
          } else {
            // Check if terminal user exists in vendor system
            const vendorUser = vendorUserMap.get(employee.employee_id);
            if (!vendorUser) {
              this.logger.warn(
                `Terminal user not found in vendor system: ${employee.terminal_user_id}`,
              );
              syncResults.missing++;
            } else {
              // User exists - could check for updates here
              syncResults.updated++;
            }
          }
        } catch (error) {
          this.logger.error(
            `Failed to sync employee ${employee.employee_id}: ${error.message}`,
          );
          syncResults.errors++;
        }
      }

      this.logger.log(
        `Terminal sync completed: ${JSON.stringify(syncResults)}`,
      );
    } catch (error) {
      this.logger.error(`Terminal synchronization failed: ${error.message}`);
    }
  }

  async pullMissedEvents(deviceId?: string, hours: number = 72): Promise<void> {
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);

      const params = {
        start_time: startTime.toISOString(),
        end_time: new Date().toISOString(),
        ...(deviceId && { device_id: deviceId }),
      };

      const response = await axios.get(`${this.vendorApiUrl}/events`, {
        headers: {
          Authorization: `Bearer ${this.vendorApiKey}`,
        },
        params,
        timeout: 30000,
      });

      const events = response.data.events || [];
      this.logger.log(`Pulled ${events.length} missed events`);

      // Process each event through the normal webhook flow
      // This would be handled by the AttendanceEventsService
    } catch (error) {
      this.logger.error(`Failed to pull missed events: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async dailySync() {
    this.logger.log('Running daily terminal synchronization');
    await this.syncTerminalUsers();
    await this.pullMissedEvents();
  }

  async retryFailedOperations(): Promise<void> {
    // Find employees with terminal_user_id = null but status = active
    const pendingEmployees = await this.employeeRepository.find({
      where: {
        status: 'active' as any,
        terminal_user_id: null as any,
      },
    });

    for (const employee of pendingEmployees) {
      try {
        const terminalUserId = await this.createTerminalUser({
          display_name: `${employee.first_name} ${employee.last_name}`,
          terminal_user_external_id: employee.employee_id,
        });

        employee.terminal_user_id = terminalUserId;
        await this.employeeRepository.save(employee);

        this.logger.log(
          `Successfully created terminal user for employee ${employee.employee_id}`,
        );
      } catch (error) {
        this.logger.error(
          `Retry failed for employee ${employee.employee_id}: ${error.message}`,
        );
      }
    }
  }
}
