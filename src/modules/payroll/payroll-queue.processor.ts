import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { PayrollProcessorService } from './payroll-processor.service';
import { Logger } from '@nestjs/common';

@Processor('payroll')
export class PayrollQueueProcessor {
  private readonly logger = new Logger(PayrollQueueProcessor.name);

  constructor(private payrollProcessor: PayrollProcessorService) {}

  @Process('process-period')
  async processPeriod(job: Job<{ periodId: string }>) {
    const { periodId } = job.data;

    try {
      this.logger.log(`Processing payroll period ${periodId}`);

      await this.payrollProcessor.processPayrollPeriod(periodId);

      this.logger.log(`Successfully processed payroll period ${periodId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to process payroll period ${periodId}: ${error.message}`,
      );
      throw error;
    }
  }

  @Process('generate-payslips')
  async generatePayslips(job: Job<{ periodId: string }>) {
    const { periodId } = job.data;

    try {
      this.logger.log(`Generating payslips for period ${periodId}`);

      // Implementation for payslip generation
      // This could include PDF generation, email sending, etc.

      this.logger.log(`Successfully generated payslips for period ${periodId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to generate payslips for period ${periodId}: ${error.message}`,
      );
      throw error;
    }
  }
}
