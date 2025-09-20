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
const attendance_processor_service_1 = require("./attendance-processor.service");
const common_1 = require("@nestjs/common");
let AttendanceQueueProcessor = AttendanceQueueProcessor_1 = class AttendanceQueueProcessor {
    constructor(attendanceProcessor) {
        this.attendanceProcessor = attendanceProcessor;
        this.logger = new common_1.Logger(AttendanceQueueProcessor_1.name);
    }
    async processEmployeeDay(job) {
        const { employeeId, date } = job.data;
        try {
            this.logger.log(`Processing attendance for employee ${employeeId} on ${date}`);
            const record = await this.attendanceProcessor.processEmployeeDay(employeeId, new Date(date));
            this.logger.log(`Successfully processed attendance for employee ${employeeId}`);
            return record;
        }
        catch (error) {
            this.logger.error(`Failed to process attendance for employee ${employeeId}: ${error.message}`);
            throw error;
        }
    }
    async reprocessDateRange(job) {
        const { employeeId, startDate, endDate } = job.data;
        try {
            this.logger.log(`Reprocessing attendance for employee ${employeeId} from ${startDate} to ${endDate}`);
            const records = await this.attendanceProcessor.reprocessDateRange(employeeId, new Date(startDate), new Date(endDate));
            this.logger.log(`Successfully reprocessed ${records.length} records for employee ${employeeId}`);
            return records;
        }
        catch (error) {
            this.logger.error(`Failed to reprocess attendance for employee ${employeeId}: ${error.message}`);
            throw error;
        }
    }
    async dailyProcessing(job) {
        const { date } = job.data;
        try {
            this.logger.log(`Running daily attendance processing for ${date}`);
            this.logger.log(`Completed daily attendance processing for ${date}`);
        }
        catch (error) {
            this.logger.error(`Daily processing failed for ${date}: ${error.message}`);
            throw error;
        }
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
exports.AttendanceQueueProcessor = AttendanceQueueProcessor = AttendanceQueueProcessor_1 = __decorate([
    (0, bull_1.Processor)('attendance'),
    __metadata("design:paramtypes", [attendance_processor_service_1.AttendanceProcessorService])
], AttendanceQueueProcessor);
//# sourceMappingURL=attendance-queue.processor.js.map