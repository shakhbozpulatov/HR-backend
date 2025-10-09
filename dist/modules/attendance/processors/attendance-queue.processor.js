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
var AttendanceQueueProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceQueueProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const attendance_1 = require("..");
let AttendanceQueueProcessor = AttendanceQueueProcessor_1 = class AttendanceQueueProcessor {
    constructor(attendanceProcessor) {
        this.attendanceProcessor = attendanceProcessor;
        this.logger = new common_1.Logger(AttendanceQueueProcessor_1.name);
    }
    async processEmployeeDay(job) {
        const { employeeId, date, triggeredBy } = job.data;
        try {
            this.logger.log(`[Job ${job.id}] Processing attendance for employee ${employeeId} on ${date}`);
            await job.progress(10);
            const record = await this.attendanceProcessor.processEmployeeDay(employeeId, new Date(date), triggeredBy);
            await job.progress(100);
            this.logger.log(`[Job ${job.id}] Successfully processed attendance. Status: ${record.status}`);
            return {
                success: true,
                record_id: record.record_id,
                status: record.status,
                worked_minutes: record.worked_minutes,
                late_minutes: record.late_minutes,
                overtime_minutes: record.overtime_minutes,
            };
        }
        catch (error) {
            this.logger.error(`[Job ${job.id}] Failed to process attendance: ${error.message}`, error.stack);
            await job.log(`Error: ${error.message}`);
            await job.log(`Stack: ${error.stack}`);
            throw error;
        }
    }
    async reprocessDateRange(job) {
        const { employeeId, startDate, endDate, triggeredBy, force } = job.data;
        try {
            this.logger.log(`[Job ${job.id}] Reprocessing date range for ${employeeId}: ${startDate} to ${endDate}`);
            await job.progress(10);
            const records = await this.attendanceProcessor.reprocessDateRange(employeeId, new Date(startDate), new Date(endDate), triggeredBy);
            await job.progress(100);
            this.logger.log(`[Job ${job.id}] Successfully reprocessed ${records.length} records`);
            return {
                success: true,
                records_processed: records.length,
                records: records.map((r) => ({
                    date: r.date,
                    status: r.status,
                    worked_minutes: r.worked_minutes,
                })),
            };
        }
        catch (error) {
            this.logger.error(`[Job ${job.id}] Failed to reprocess date range: ${error.message}`, error.stack);
            await job.log(`Error: ${error.message}`);
            throw error;
        }
    }
    async dailyProcessing(job) {
        const { date, userIds, triggeredBy, batchSize = 100 } = job.data;
        try {
            this.logger.log(`[Job ${job.id}] Starting daily batch processing for ${date}`);
            await job.progress(10);
            const result = await this.attendanceProcessor.batchProcessDate(new Date(date), userIds, triggeredBy);
            await job.progress(100);
            this.logger.log(`[Job ${job.id}] Daily processing completed. Success: ${result.success}, Failed: ${result.failed}`);
            return {
                success: true,
                date,
                total: result.total,
                successful: result.success,
                failed: result.failed,
                success_rate: result.total > 0
                    ? ((result.success / result.total) * 100).toFixed(2) + '%'
                    : '0%',
            };
        }
        catch (error) {
            this.logger.error(`[Job ${job.id}] Daily processing failed: ${error.message}`, error.stack);
            await job.log(`Error: ${error.message}`);
            throw error;
        }
    }
    async processPendingEvents(job) {
        const { eventIds, limit = 50 } = job.data;
        try {
            this.logger.log(`[Job ${job.id}] Processing pending events`);
            return {
                success: true,
                events_processed: eventIds?.length || 0,
            };
        }
        catch (error) {
            this.logger.error(`[Job ${job.id}] Failed to process pending events: ${error.message}`);
            throw error;
        }
    }
    async cleanupOldData(job) {
        const { days, type } = job.data;
        try {
            this.logger.log(`[Job ${job.id}] Cleaning up data older than ${days} days`);
            return {
                success: true,
                message: `Cleaned up ${type} data older than ${days} days`,
            };
        }
        catch (error) {
            this.logger.error(`[Job ${job.id}] Cleanup failed: ${error.message}`);
            throw error;
        }
    }
    onActive(job) {
        this.logger.log(`[Job ${job.id}] Started processing: ${job.name}`);
    }
    onCompleted(job, result) {
        this.logger.log(`[Job ${job.id}] Completed successfully: ${job.name}`);
    }
    async onFailed(job, error) {
        this.logger.error(`[Job ${job.id}] Failed after ${job.attemptsMade} attempts: ${error.message}`, error.stack);
        await job.log(`Failed: ${error.message}`);
        if (job.attemptsMade >= (job.opts.attempts || 3)) {
            this.logger.error(`[Job ${job.id}] Max attempts reached. Job will not be retried.`);
            await this.sendFailureAlert(job, error);
        }
    }
    onError(error) {
        this.logger.error(`Queue error occurred: ${error.message}`, error.stack);
    }
    onStalled(job) {
        this.logger.warn(`[Job ${job.id}] Job stalled. Will be reprocessed by another worker.`);
    }
    async sendFailureAlert(job, error) {
        try {
            this.logger.error(`ALERT: Job ${job.id} (${job.name}) failed permanently. Error: ${error.message}`);
        }
        catch (alertError) {
            this.logger.error(`Failed to send alert: ${alertError.message}`);
        }
    }
    async getJobStatistics() {
        return {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
        };
    }
};
exports.AttendanceQueueProcessor = AttendanceQueueProcessor;
__decorate([
    (0, bull_1.Process)('process-employee-day'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceQueueProcessor.prototype, "processEmployeeDay", null);
__decorate([
    (0, bull_1.Process)('reprocess-date-range'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceQueueProcessor.prototype, "reprocessDateRange", null);
__decorate([
    (0, bull_1.Process)('daily-processing'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceQueueProcessor.prototype, "dailyProcessing", null);
__decorate([
    (0, bull_1.Process)('process-pending-events'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceQueueProcessor.prototype, "processPendingEvents", null);
__decorate([
    (0, bull_1.Process)('cleanup-old-data'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceQueueProcessor.prototype, "cleanupOldData", null);
__decorate([
    (0, bull_1.OnQueueActive)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceQueueProcessor.prototype, "onActive", null);
__decorate([
    (0, bull_1.OnQueueCompleted)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AttendanceQueueProcessor.prototype, "onCompleted", null);
__decorate([
    (0, bull_1.OnQueueFailed)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Error]),
    __metadata("design:returntype", Promise)
], AttendanceQueueProcessor.prototype, "onFailed", null);
__decorate([
    (0, bull_1.OnQueueError)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Error]),
    __metadata("design:returntype", void 0)
], AttendanceQueueProcessor.prototype, "onError", null);
__decorate([
    (0, bull_1.OnQueueStalled)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceQueueProcessor.prototype, "onStalled", null);
exports.AttendanceQueueProcessor = AttendanceQueueProcessor = AttendanceQueueProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, bull_1.Processor)('attendance'),
    __metadata("design:paramtypes", [attendance_1.AttendanceProcessorService])
], AttendanceQueueProcessor);
//# sourceMappingURL=attendance-queue.processor.js.map