import { Module } from '@nestjs/common';
import { PayrollProcessorService } from './payroll-processor.service';
import { PayrollController } from './payroll.controller';

@Module({
  controllers: [PayrollController],
  providers: [PayrollProcessorService],
})
export class PayrollModule {}
