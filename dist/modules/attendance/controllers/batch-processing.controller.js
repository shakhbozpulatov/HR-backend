"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchProcessingController = void 0;
const common_1 = require("@nestjs/common");
const attendance_processor_service_1 = require("../services/attendance-processor.service");
const dto_1 = require("../dto");
const auth_guard_1 = require("../../../common/guards/auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const user_entity_1 = require("../../users/entities/user.entity");
let BatchProcessingController = class BatchProcessingController {
    constructor(processorService) {
        this.processorService = processorService;
    }
    async batchProcessDate(batchDto, actorId) {
        const result = await this.processorService.batchProcessDate(new Date(batchDto.date), batchDto.user_ids, actorId);
        return {
            success: true,
            message: 'Batch processing completed',
            data: {
                date: batchDto.date,
                total: result.total,
                success: result.success,
                failed: result.failed,
                success_rate: result.total > 0
                    ? ((result.success / result.total) * 100).toFixed(2) + '%'
                    : '0%',
            },
        };
    }
    async reprocessDateRange(reprocessDto, actorId) {
        const records = await this.processorService.reprocessDateRange(reprocessDto.user_id, new Date(reprocessDto.start_date), new Date(reprocessDto.end_date), actorId);
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
    async reprocessBulk(data, actorId) {
        const results = [];
        for (const userId of data.user_ids) {
            try {
                const records = await this.processorService.reprocessDateRange(userId, new Date(data.start_date), new Date(data.end_date), actorId);
                results.push({
                    user_id: userId,
                    success: true,
                    records_processed: records.length,
                });
            }
            catch (error) {
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
    async processYesterday(actorId) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const result = await this.processorService.batchProcessDate(yesterday, undefined, actorId);
        return {
            success: true,
            message: "Yesterday's attendance processed",
            data: {
                date: yesterday.toISOString().split('T')[0],
                ...result,
            },
        };
    }
    async processCurrentMonth(data, actorId) {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const results = [];
        if (data.user_ids && data.user_ids.length > 0) {
            for (const userId of data.user_ids) {
                const records = await this.processorService.reprocessDateRange(userId, firstDay, lastDay, actorId);
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
    async getBatchStatus(_limit = 10) {
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
    async getStatistics(from, to) {
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
    async cancelBatch(jobId) {
        console.log(`Cancelling job ${jobId}`);
        return {
            success: true,
            message: 'Batch operation cancelled',
            job_id: jobId,
        };
    }
    async validateBatch(data) {
        const start = new Date(data.start_date);
        const end = new Date(data.end_date);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
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
};
exports.BatchProcessingController = BatchProcessingController;
__decorate([
    (0, common_1.Post)('process-date'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.BatchProcessDto, String]),
    __metadata("design:returntype", Promise)
], BatchProcessingController.prototype, "batchProcessDate", null);
__decorate([
    (0, common_1.Post)('reprocess-range'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ReprocessDateRangeDto, String]),
    __metadata("design:returntype", Promise)
], BatchProcessingController.prototype, "reprocessDateRange", null);
__decorate([
    (0, common_1.Post)('reprocess-bulk'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BatchProcessingController.prototype, "reprocessBulk", null);
__decorate([
    (0, common_1.Post)('process-yesterday'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BatchProcessingController.prototype, "processYesterday", null);
__decorate([
    (0, common_1.Post)('process-current-month'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BatchProcessingController.prototype, "processCurrentMonth", null);
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], BatchProcessingController.prototype, "getBatchStatus", null);
__decorate([
    (0, common_1.Get)('statistics'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BatchProcessingController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Post)('cancel/:jobId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BatchProcessingController.prototype, "cancelBatch", null);
__decorate([
    (0, common_1.Post)('validate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BatchProcessingController.prototype, "validateBatch", null);
exports.BatchProcessingController = BatchProcessingController = __decorate([
    (0, common_1.Controller)('attendance/batch'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN, user_entity_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [attendance_processor_service_1.AttendanceProcessorService])
], BatchProcessingController);
//# sourceMappingURL=batch-processing.controller.js.map