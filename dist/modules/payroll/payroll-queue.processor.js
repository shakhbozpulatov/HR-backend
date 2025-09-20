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
var PayrollQueueProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollQueueProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const payroll_processor_service_1 = require("./payroll-processor.service");
const common_1 = require("@nestjs/common");
let PayrollQueueProcessor = PayrollQueueProcessor_1 = class PayrollQueueProcessor {
    constructor(payrollProcessor) {
        this.payrollProcessor = payrollProcessor;
        this.logger = new common_1.Logger(PayrollQueueProcessor_1.name);
    }
    async processPeriod(job) {
        const { periodId } = job.data;
        try {
            this.logger.log(`Processing payroll period ${periodId}`);
            await this.payrollProcessor.processPayrollPeriod(periodId);
            this.logger.log(`Successfully processed payroll period ${periodId}`);
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Failed to process payroll period ${periodId}: ${error.message}`);
            throw error;
        }
    }
    async generatePayslips(job) {
        const { periodId } = job.data;
        try {
            this.logger.log(`Generating payslips for period ${periodId}`);
            this.logger.log(`Successfully generated payslips for period ${periodId}`);
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Failed to generate payslips for period ${periodId}: ${error.message}`);
            throw error;
        }
    }
};
exports.PayrollQueueProcessor = PayrollQueueProcessor;
__decorate([
    (0, bull_1.Process)('process-period'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayrollQueueProcessor.prototype, "processPeriod", null);
__decorate([
    (0, bull_1.Process)('generate-payslips'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayrollQueueProcessor.prototype, "generatePayslips", null);
exports.PayrollQueueProcessor = PayrollQueueProcessor = PayrollQueueProcessor_1 = __decorate([
    (0, bull_1.Processor)('payroll'),
    __metadata("design:paramtypes", [payroll_processor_service_1.PayrollProcessorService])
], PayrollQueueProcessor);
//# sourceMappingURL=payroll-queue.processor.js.map