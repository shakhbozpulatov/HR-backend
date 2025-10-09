// ============================================
// FILE: controllers/device-status.controller.ts
// ============================================

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { DeviceStatusDto, DeviceStatus } from '../dto';
import { Public } from '@/common/decorators/public.decorator';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/users/entities/user.entity';

@Controller('attendance/devices')
export class DeviceStatusController {
  // In a real implementation, this would use a DeviceStatusService
  // For now, we'll keep it simple with in-memory storage or direct updates

  /**
   * Update device status
   * PUBLIC endpoint - devices can report their status without auth
   */
  @Post('status')
  @Public()
  @Throttle({ short: { limit: 50, ttl: 60000 } }) // 50 requests per minute per device
  @HttpCode(HttpStatus.OK)
  async updateDeviceStatus(@Body(ValidationPipe) statusData: DeviceStatusDto) {
    // Implementation would update device status in database
    // Could also trigger alerts if device goes offline
    console.log('Device status updated:', statusData);

    return {
      success: true,
      message: 'Device status updated successfully',
      data: {
        device_id: statusData.device_id,
        status: statusData.status,
        last_seen: statusData.last_seen || new Date().toISOString(),
      },
    };
  }

  /**
   * Get device status by ID
   * Check current status of a specific device
   */
  @Get(':deviceId/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async getDeviceStatus(@Param('deviceId', ParseUUIDPipe) deviceId: string) {
    // Mock implementation - would fetch from database
    return {
      success: true,
      data: {
        device_id: deviceId,
        status: DeviceStatus.ONLINE,
        last_seen: new Date().toISOString(),
        ip_address: '192.168.1.100',
        firmware_version: '2.1.5',
        battery_level: 95,
        health_metrics: {
          cpu_usage: 45,
          memory_usage: 60,
          storage_usage: 30,
          temperature: 42,
        },
      },
    };
  }

  /**
   * Get all devices status
   * List status of all devices
   */
  @Get('status/all')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async getAllDevicesStatus(
    @Query('status') statusFilter?: DeviceStatus,
    @Query('location') location?: string,
  ) {
    // Mock implementation
    const devices = [
      {
        device_id: 'device-001',
        device_name: 'Main Entrance',
        status: DeviceStatus.ONLINE,
        location: 'Office Floor 1',
        last_seen: new Date().toISOString(),
      },
      {
        device_id: 'device-002',
        device_name: 'Warehouse Gate',
        status: DeviceStatus.OFFLINE,
        location: 'Warehouse',
        last_seen: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    // Apply filters
    let filtered = devices;
    if (statusFilter) {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }
    if (location) {
      filtered = filtered.filter((d) =>
        d.location.toLowerCase().includes(location.toLowerCase()),
      );
    }

    return {
      success: true,
      data: filtered,
      total: filtered.length,
      summary: {
        online: devices.filter((d) => d.status === DeviceStatus.ONLINE).length,
        offline: devices.filter((d) => d.status === DeviceStatus.OFFLINE)
          .length,
        disconnected: devices.filter(
          (d) => d.status === DeviceStatus.DISCONNECTED,
        ).length,
        maintenance: devices.filter(
          (d) => d.status === DeviceStatus.MAINTENANCE,
        ).length,
        error: devices.filter((d) => d.status === DeviceStatus.ERROR).length,
      },
    };
  }

  /**
   * Device heartbeat
   * Simple ping to check device is alive
   */
  @Post(':deviceId/heartbeat')
  @Public()
  @Throttle({ short: { limit: 120, ttl: 60000 } }) // 120 requests per minute (every 30 seconds)
  @HttpCode(HttpStatus.OK)
  async deviceHeartbeat(
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Body() data?: { ip_address?: string; firmware_version?: string },
  ) {
    // Update last_seen timestamp
    console.log(`Heartbeat from device ${deviceId}`, data);

    return {
      success: true,
      message: 'Heartbeat received',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get device health metrics
   * Detailed health information
   */
  @Get(':deviceId/health')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getDeviceHealth(@Param('deviceId', ParseUUIDPipe) deviceId: string) {
    // Mock implementation
    return {
      success: true,
      data: {
        device_id: deviceId,
        health_status: 'good',
        metrics: {
          cpu_usage: 45,
          memory_usage: 60,
          storage_usage: 30,
          temperature: 42,
          network_latency_ms: 25,
          uptime_hours: 168,
        },
        last_reboot: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
        firmware_version: '2.1.5',
        alerts: [],
      },
    };
  }

  /**
   * Reboot device
   * Send reboot command to device
   */
  @Post(':deviceId/reboot')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  async rebootDevice(@Param('deviceId', ParseUUIDPipe) deviceId: string) {
    // Implementation would send reboot command to device
    console.log(`Reboot command sent to device ${deviceId}`);

    return {
      success: true,
      message: 'Reboot command sent to device',
      device_id: deviceId,
    };
  }

  /**
   * Get device logs
   * Retrieve recent device logs
   */
  @Get(':deviceId/logs')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async getDeviceLogs(
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Query('limit') limit: number = 100,
    @Query('level') level?: 'error' | 'warn' | 'info' | 'debug',
  ) {
    // Mock implementation
    const logs = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'User verification successful',
        metadata: { user_id: 42 },
      },
      {
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: 'warn',
        message: 'Low memory warning',
        metadata: { memory_usage: 85 },
      },
    ];

    return {
      success: true,
      data: logs,
      total: logs.length,
      device_id: deviceId,
    };
  }

  /**
   * Update device configuration
   * Push configuration updates to device
   */
  @Post(':deviceId/config')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateDeviceConfig(
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Body() config: any,
  ) {
    // Implementation would push config to device
    console.log(`Updating config for device ${deviceId}`, config);

    return {
      success: true,
      message: 'Configuration update sent to device',
      device_id: deviceId,
    };
  }
}
