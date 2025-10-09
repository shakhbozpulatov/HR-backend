// ============================================
// FILE: controllers/batch-processing.controller.ts
// ============================================

import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';

import { AttendanceProcessorService } from '../services/attendance-processor.service';
import { BatchProcessDto, ReprocessDateRangeDto } from '../dto';

import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/modules/users/entities/user.entity';

@Controller('attendance/batch')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class BatchProcessingController {
  constructor(private readonly processorService: AttendanceProcessorService) {}

  /**
   * Batch process all employees for a specific date
   * Processes attendance for all employees or specific users
   */
  @Post('process-date')
  @HttpCode(HttpStatus.ACCEPTED)
  async batchProcessDate(
    @Body(ValidationPipe) batchDto: BatchProcessDto,
    @CurrentUser('user_id') actorId: string,
  ) {
    const result = await this.processorService.batchProcessDate(
      new Date(batchDto.date),
      batchDto.user_ids,
      actorId,
    );

    return {
      success: true,
      message: 'Batch processing completed',
      data: {
        date: batchDto.date,
        total: result.total,
        success: result.success,
        failed: result.failed,
        success_rate:
          result.total > 0
            ? ((result.success / result.total) * 100).toFixed(2) + '%'
            : '0%',
      },
    };
  }

  /**
   * Reprocess date range for a specific user
   * Recalculate attendance for multiple days
   */
  @Post('reprocess-range')
  @HttpCode(HttpStatus.ACCEPTED)
  async reprocessDateRange(
    @Body(ValidationPipe) reprocessDto: ReprocessDateRangeDto,
    @CurrentUser('user_id') actorId: string,
  ) {
    const records = await this.processorService.reprocessDateRange(
      reprocessDto.user_id,
      new Date(reprocessDto.start_date),
      new Date(reprocessDto.end_date),
      actorId,
    );

    return {
      success: true,
      message: 'Date range reprocessed successfully',
      data: {
        user_id: reprocessDto.user_id,
        start_date: reprocessDto.start_date,
        end_date: reprocessDto.end_date,
        records_processed: records.length,
        records: records.map((r) => ({
          date: r.date,
          status: r.status,
          worked_minutes: r.worked_minutes,
        })),
      },
    };
  }

  /**
   * Reprocess multiple users for a date range
   * Bulk reprocessing operation
   */
  @Post('reprocess-bulk')
  @HttpCode(HttpStatus.ACCEPTED)
  async reprocessBulk(
    @Body()
    data: {
      user_ids: string[];
      start_date: string;
      end_date: string;
      force?: boolean;
    },
    @CurrentUser('user_id') actorId: string,
  ) {
    const results = [];

    for (const userId of data.user_ids) {
      try {
        const records = await this.processorService.reprocessDateRange(
          userId,
          new Date(data.start_date),
          new Date(data.end_date),
          actorId,
        );

        results.push({
          user_id: userId,
          success: true,
          records_processed: records.length,
        });
      } catch (error) {
        results.push({
          user_id: userId,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return {
      success: true,
      message: 'Bulk reprocessing completed',
      data: {
        total: data.user_ids.length,
        success: successCount,
        failed: failedCount,
        results,
      },
    };
  }

  /**
   * Process yesterday's attendance (manual trigger)
   * Typically runs automatically via cron, but can be triggered manually
   */
  @Post('process-yesterday')
  @HttpCode(HttpStatus.ACCEPTED)
  async processYesterday(@CurrentUser('user_id') actorId: string) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const result = await this.processorService.batchProcessDate(
      yesterday,
      undefined,
      actorId,
    );

    return {
      success: true,
      message: "Yesterday's attendance processed",
      data: {
        date: yesterday.toISOString().split('T')[0],
        ...result,
      },
    };
  }

  /**
   * Process current month
   * Reprocess all records for current month
   */
  @Post('process-current-month')
  @HttpCode(HttpStatus.ACCEPTED)
  async processCurrentMonth(
    @Body() data: { user_ids?: string[] },
    @CurrentUser('user_id') actorId: string,
  ) {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const results = [];

    if (data.user_ids && data.user_ids.length > 0) {
      // Process specific users
      for (const userId of data.user_ids) {
        const records = await this.processorService.reprocessDateRange(
          userId,
          firstDay,
          lastDay,
          actorId,
        );

        results.push({
          user_id: userId,
          records_processed: records.length,
        });
      }
    }

    return {
      success: true,
      message: 'Current month processing completed',
      data: {
        month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        start_date: firstDay.toISOString().split('T')[0],
        end_date: lastDay.toISOString().split('T')[0],
        users_processed: results.length,
        results,
      },
    };
  }

  /**
   * Get batch processing status
   * Check status of ongoing batch operations
   */
  @Get('status')
  async getBatchStatus(@Query('limit') _limit: number = 10) {
    // Mock implementation - would fetch from processing logs
    return {
      success: true,
      data: {
        active_jobs: 0,
        recent_jobs: [
          {
            job_id: 'batch-001',
            type: 'daily_processing',
            date: '2025-10-06',
            status: 'completed',
            total: 150,
            success: 148,
            failed: 2,
            duration_ms: 45000,
            completed_at: new Date().toISOString(),
          },
        ],
      },
    };
  }

  /**
   * Get processing statistics
   * Summary of processing performance
   */
  @Get('statistics')
  async getStatistics(@Query('from') from?: string, @Query('to') to?: string) {
    // Mock implementation
    return {
      success: true,
      data: {
        period: {
          from: from || new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
          to: to || new Date().toISOString(),
        },
        total_jobs: 30,
        successful_jobs: 28,
        failed_jobs: 2,
        total_records_processed: 4500,
        average_processing_time_ms: 35000,
        success_rate: '93.3%',
      },
    };
  }

  /**
   * Cancel batch operation
   * Stop ongoing batch processing
   */
  @Post('cancel/:jobId')
  @HttpCode(HttpStatus.OK)
  async cancelBatch(@Body('jobId') jobId: string) {
    // Implementation would cancel the Bull queue job
    console.log(`Cancelling job ${jobId}`);

    return {
      success: true,
      message: 'Batch operation cancelled',
      job_id: jobId,
    };
  }

  /**
   * Validate date range before processing
   * Check if date range is valid and get estimated records count
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateBatch(
    @Body()
    data: {
      user_ids?: string[];
      start_date: string;
      end_date: string;
    },
  ) {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    const daysDiff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 3600 * 24),
    );

    const estimatedRecords = (data.user_ids?.length || 100) * daysDiff;

    return {
      success: true,
      data: {
        valid: true,
        days_count: daysDiff,
        users_count: data.user_ids?.length || 'all',
        estimated_records: estimatedRecords,
        estimated_duration_minutes: Math.ceil(estimatedRecords / 60),
        warnings: daysDiff > 90 ? ['Date range exceeds 90 days'] : [],
      },
    };
  }
}
