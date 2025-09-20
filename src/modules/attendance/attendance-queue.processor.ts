import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { AttendanceProcessorService } from './attendance-processor.service';
import { Logger } from '@nestjs/common';

@Processor('attendance')
export class AttendanceQueueProcessor {
  private readonly logger = new Logger(AttendanceQueueProcessor.name);

  constructor(private attendanceProcessor: AttendanceProcessorService) {}

  @Process('process-employee-day')
  async processEmployeeDay(job: Job<{ employeeId: string; date: string }>) {
    const { employeeId, date } = job.data;

    try {
      this.logger.log(
        `Processing attendance for employee ${employeeId} on ${date}`,
      );

      const record = await this.attendanceProcessor.processEmployeeDay(
        employeeId,
        new Date(date),
      );

      this.logger.log(
        `Successfully processed attendance for employee ${employeeId}`,
      );
      return record;
    } catch (error) {
      this.logger.error(
        `Failed to process attendance for employee ${employeeId}: ${error.message}`,
      );
      throw error;
    }
  }

  @Process('reprocess-date-range')
  async reprocessDateRange(
    job: Job<{ employeeId: string; startDate: string; endDate: string }>,
  ) {
    const { employeeId, startDate, endDate } = job.data;

    try {
      this.logger.log(
        `Reprocessing attendance for employee ${employeeId} from ${startDate} to ${endDate}`,
      );

      const records = await this.attendanceProcessor.reprocessDateRange(
        employeeId,
        new Date(startDate),
        new Date(endDate),
      );

      this.logger.log(
        `Successfully reprocessed ${records.length} records for employee ${employeeId}`,
      );
      return records;
    } catch (error) {
      this.logger.error(
        `Failed to reprocess attendance for employee ${employeeId}: ${error.message}`,
      );
      throw error;
    }
  }

  @Process('daily-processing')
  async dailyProcessing(job: Job<{ date: string }>) {
    const { date } = job.data;

    try {
      this.logger.log(`Running daily attendance processing for ${date}`);

      // This would process all employees for the given date
      // Implementation depends on your specific requirements

      this.logger.log(`Completed daily attendance processing for ${date}`);
    } catch (error) {
      this.logger.error(
        `Daily processing failed for ${date}: ${error.message}`,
      );
      throw error;
    }
  }
}
