import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { PayrollPeriod } from './entities/payroll-period.entity';
import { PayrollItem } from './entities/payroll-item.entity';
import { WorkVolumeEntry } from './entities/work-volume-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PayrollPeriod, PayrollItem, WorkVolumeEntry]),
  ],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}
