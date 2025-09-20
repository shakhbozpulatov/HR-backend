import { Job } from 'bull';
import { PayrollProcessorService } from './payroll-processor.service';
export declare class PayrollQueueProcessor {
    private payrollProcessor;
    private readonly logger;
    constructor(payrollProcessor: PayrollProcessorService);
    processPeriod(job: Job<{
        periodId: string;
    }>): Promise<{
        success: boolean;
    }>;
    generatePayslips(job: Job<{
        periodId: string;
    }>): Promise<{
        success: boolean;
    }>;
}
