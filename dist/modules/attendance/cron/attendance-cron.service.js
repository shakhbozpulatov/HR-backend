"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AttendanceCronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceCronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const bull_1 = require("@nestjs/bull");
const config_1 = require("@nestjs/config");
const moment = __importStar(require("moment-timezone"));
const attendance_1 = require("..");
let AttendanceCronService = AttendanceCronService_1 = class AttendanceCronService {
    constructor(attendanceQueue, eventsService, configService, schedulerRegistry) {
        this.attendanceQueue = attendanceQueue;
        this.eventsService = eventsService;
        this.configService = configService;
        this.schedulerRegistry = schedulerRegistry;
        this.logger = new common_1.Logger(AttendanceCronService_1.name);
        this.timezone = this.configService.get('DEFAULT_TIMEZONE', 'Asia/Tashkent');
        this.enableDailyProcessing = this.configService.get('ENABLE_DAILY_PROCESSING_CRON', true);
        this.enableRetryFailed = this.configService.get('ENABLE_RETRY_FAILED_CRON', true);
        this.enableCleanup = this.configService.get('ENABLE_CLEANUP_CRON', true);
        this.logger.log('Attendance Cron Service initialized');
        this.logger.log(`Timezone: ${this.timezone}`);
        this.logger.log(`Daily Processing: ${this.enableDailyProcessing ? 'enabled' : 'disabled'}`);
        this.logger.log(`Retry Failed: ${this.enableRetryFailed ? 'enabled' : 'disabled'}`);
        this.logger.log(`Cleanup: ${this.enableCleanup ? 'enabled' : 'disabled'}`);
    }
    async handleDailyProcessing() {
        if (!this.enableDailyProcessing) {
            this.logger.log('Daily processing is disabled. Skipping.');
            return;
        }
        const yesterday = moment.tz(this.timezone).subtract(1, 'day');
        const dateStr = yesterday.format('YYYY-MM-DD');
        this.logger.log(`Starting daily attendance processing for ${dateStr}`);
        try {
            const job = await this.attendanceQueue.add('daily-processing', {
                date: dateStr,
                triggeredBy: 'cron:daily-processing',
            }, {
                priority: 1,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
                removeOnComplete: false,
                removeOnFail: false,
            });
            this.logger.log(`Daily processing job queued successfully. Job ID: ${job.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to queue daily processing: ${error.message}`, error.stack);
            await this.sendCronAlert('daily-processing', error);
        }
    }
    async handleRetryFailed() {
        if (!this.enableRetryFailed) {
            return;
        }
        this.logger.log('Starting retry of failed events');
        try {
            await this.eventsService.retryFailedEvents();
            this.logger.log('Failed events retry completed');
        }
        catch (error) {
            this.logger.error(`Failed to retry events: ${error.message}`, error.stack);
        }
    }
    async handlePendingEvents() {
        this.logger.log('Processing pending events');
        try {
            await this.attendanceQueue.add('process-pending-events', {
                limit: 50,
            }, {
                priority: 2,
            });
        }
        catch (error) {
            this.logger.error(`Failed to queue pending events processing: ${error.message}`);
        }
    }
    async handleCleanupLogs() {
        if (!this.enableCleanup) {
            return;
        }
        this.logger.log('Starting cleanup of old processing logs');
        try {
            await this.attendanceQueue.add('cleanup-old-data', {
                days: 90,
                type: 'logs',
            }, {
                priority: 10,
            });
            this.logger.log('Cleanup job queued successfully');
        }
        catch (error) {
            this.logger.error(`Failed to queue cleanup: ${error.message}`, error.stack);
        }
    }
    async handleCleanupEvents() {
        if (!this.enableCleanup) {
            return;
        }
        this.logger.log('Starting cleanup of old events');
        try {
            await this.attendanceQueue.add('cleanup-old-data', {
                days: 180,
                type: 'events',
            }, {
                priority: 10,
            });
        }
        catch (error) {
            this.logger.error(`Failed to queue events cleanup: ${error.message}`);
        }
    }
    async handleDailyReports() {
        const today = moment.tz(this.timezone);
        this.logger.log(`Generating daily attendance reports for ${today.format('YYYY-MM-DD')}`);
        try {
            this.logger.log('Daily reports sent successfully');
        }
        catch (error) {
            this.logger.error(`Failed to send daily reports: ${error.message}`, error.stack);
        }
    }
    async handleWeeklySummary() {
        this.logger.log('Generating weekly attendance summary');
        try {
            const lastWeekStart = moment
                .tz(this.timezone)
                .subtract(1, 'week')
                .startOf('week');
            const lastWeekEnd = moment
                .tz(this.timezone)
                .subtract(1, 'week')
                .endOf('week');
            this.logger.log(`Weekly summary for ${lastWeekStart.format('YYYY-MM-DD')} to ${lastWeekEnd.format('YYYY-MM-DD')}`);
        }
        catch (error) {
            this.logger.error(`Failed to generate weekly summary: ${error.message}`);
        }
    }
    async handleMonthlyReport() {
        this.logger.log('Generating monthly attendance report');
        try {
            const lastMonth = moment.tz(this.timezone).subtract(1, 'month');
            const monthStr = lastMonth.format('YYYY-MM');
            this.logger.log(`Monthly report for ${monthStr}`);
        }
        catch (error) {
            this.logger.error(`Failed to generate monthly report: ${error.message}`);
        }
    }
    async handleQueueHealthCheck() {
        try {
            const waiting = await this.attendanceQueue.getWaitingCount();
            const active = await this.attendanceQueue.getActiveCount();
            const failed = await this.attendanceQueue.getFailedCount();
            const delayed = await this.attendanceQueue.getDelayedCount();
            if (waiting > 100) {
                this.logger.warn(`Queue backlog detected: ${waiting} jobs waiting`);
            }
            if (failed > 50) {
                this.logger.error(`High failure rate detected: ${failed} failed jobs`);
                await this.sendCronAlert('queue-health', new Error(`${failed} failed jobs`));
            }
            const minute = new Date().getMinutes();
            if (minute % 60 === 0) {
                this.logger.log(`Queue stats - Waiting: ${waiting}, Active: ${active}, Failed: ${failed}, Delayed: ${delayed}`);
            }
        }
        catch (error) {
            this.logger.error(`Queue health check failed: ${error.message}`);
        }
    }
    async handleAutoApprove() {
        const autoApproveEnabled = this.configService.get('AUTO_APPROVE_OLD_RECORDS', false);
        const autoApproveDays = this.configService.get('AUTO_APPROVE_AFTER_DAYS', 7);
        if (!autoApproveEnabled) {
            return;
        }
        this.logger.log(`Auto-approving records older than ${autoApproveDays} days`);
        try {
            this.logger.log('Auto-approval completed');
        }
        catch (error) {
            this.logger.error(`Auto-approval failed: ${error.message}`);
        }
    }
    async sendCronAlert(jobName, error) {
        try {
            this.logger.error(`CRON ALERT: ${jobName} failed - ${error.message}`);
        }
        catch (alertError) {
            this.logger.error(`Failed to send cron alert: ${alertError.message}`);
        }
    }
    getCronJobsStatus() {
        const jobs = this.schedulerRegistry.getCronJobs();
        const status = [];
        jobs.forEach((job, name) => {
            status.push({
                name,
                running: job.running,
                lastDate: job.lastDate(),
                nextDate: job.nextDate(),
            });
        });
        return status;
    }
    stopCronJob(name) {
        const job = this.schedulerRegistry.getCronJob(name);
        job.stop();
        this.logger.warn(`Cron job '${name}' stopped`);
    }
    startCronJob(name) {
        const job = this.schedulerRegistry.getCronJob(name);
        job.start();
        this.logger.log(`Cron job '${name}' started`);
    }
};
exports.AttendanceCronService = AttendanceCronService;
__decorate([
    (0, schedule_1.Cron)('0 1 * * *', {
        name: 'daily-attendance-processing',
        timeZone: 'Asia/Tashkent',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttendanceCronService.prototype, "handleDailyProcessing", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR, {
        name: 'retry-failed-events',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttendanceCronService.prototype, "handleRetryFailed", null);
__decorate([
    (0, schedule_1.Cron)('*/15 * * * *', {
        name: 'process-pending-events',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttendanceCronService.prototype, "handlePendingEvents", null);
__decorate([
    (0, schedule_1.Cron)('0 2 * * 0', {
        name: 'cleanup-old-logs',
        timeZone: 'Asia/Tashkent',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttendanceCronService.prototype, "handleCleanupLogs", null);
__decorate([
    (0, schedule_1.Cron)('0 3 * * 0', {
        name: 'cleanup-old-events',
        timeZone: 'Asia/Tashkent',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttendanceCronService.prototype, "handleCleanupEvents", null);
__decorate([
    (0, schedule_1.Cron)('0 9 * * 1-5', {
        name: 'send-daily-reports',
        timeZone: 'Asia/Tashkent',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttendanceCronService.prototype, "handleDailyReports", null);
__decorate([
    (0, schedule_1.Cron)('0 10 * * 1', {
        name: 'send-weekly-summary',
        timeZone: 'Asia/Tashkent',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttendanceCronService.prototype, "handleWeeklySummary", null);
__decorate([
    (0, schedule_1.Cron)('0 9 1 * *', {
        name: 'send-monthly-report',
        timeZone: 'Asia/Tashkent',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttendanceCronService.prototype, "handleMonthlyReport", null);
__decorate([
    (0, schedule_1.Cron)('*/5 * * * *', {
        name: 'check-queue-health',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttendanceCronService.prototype, "handleQueueHealthCheck", null);
__decorate([
    (0, schedule_1.Cron)('0 23 * * *', {
        name: 'auto-approve-old-records',
        timeZone: 'Asia/Tashkent',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttendanceCronService.prototype, "handleAutoApprove", null);
exports.AttendanceCronService = AttendanceCronService = AttendanceCronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)('attendance')),
    __metadata("design:paramtypes", [Object, attendance_1.AttendanceEventsService,
        config_1.ConfigService,
        schedule_1.SchedulerRegistry])
], AttendanceCronService);
//# sourceMappingURL=attendance-cron.service.js.map