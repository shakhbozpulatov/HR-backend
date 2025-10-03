import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollPeriod, PeriodStatus } from './entities/payroll-period.entity';
import { PayrollItem } from './entities/payroll-item.entity';
import { WorkVolumeEntry } from './entities/work-volume-entry.entity';
import { CreatePeriodDto } from './dto/create-period.dto';
import { CreatePayrollItemDto } from './dto/create-payroll-item.dto';
import { PayrollFilterDto } from './dto/payroll-filter.dto';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(PayrollPeriod)
    private periodRepository: Repository<PayrollPeriod>,
    @InjectRepository(PayrollItem)
    private itemRepository: Repository<PayrollItem>,
    @InjectRepository(WorkVolumeEntry)
    private volumeRepository: Repository<WorkVolumeEntry>,
  ) {}

  async createPeriod(
    createPeriodDto: CreatePeriodDto,
    actorId: string,
  ): Promise<PayrollPeriod> {
    const period = this.periodRepository.create(createPeriodDto);
    return await this.periodRepository.save(period);
  }

  async findAllPeriods(
    filterDto: PayrollFilterDto,
  ): Promise<{ data: PayrollPeriod[]; total: number }> {
    const { page = 1, limit = 10, status } = filterDto;

    const queryBuilder = this.periodRepository.createQueryBuilder('period');

    if (status) {
      queryBuilder.andWhere('period.status = :status', { status });
    }

    const [data, total] = await queryBuilder
      .orderBy('period.start_date', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOnePeriod(id: string): Promise<PayrollPeriod> {
    const period = await this.periodRepository.findOne({
      where: { period_id: id },
      relations: ['items', 'items.employee'],
    });

    if (!period) {
      throw new NotFoundException('Payroll period not found');
    }

    return period;
  }

  async processPeriod(id: string, actorId: string): Promise<PayrollPeriod> {
    const period = await this.findOnePeriod(id);

    if (period.status !== PeriodStatus.OPEN) {
      throw new Error('Period is not open for processing');
    }

    // Process payroll logic here
    period.status = PeriodStatus.PROCESSED;
    period.close_date = new Date();

    return await this.periodRepository.save(period);
  }

  async lockPeriod(id: string, actorId: string): Promise<PayrollPeriod> {
    const period = await this.findOnePeriod(id);
    period.status = PeriodStatus.LOCKED;
    return await this.periodRepository.save(period);
  }

  async unlockPeriod(id: string, actorId: string): Promise<PayrollPeriod> {
    const period = await this.findOnePeriod(id);
    period.status = PeriodStatus.OPEN;
    return await this.periodRepository.save(period);
  }

  async findPeriodItems(
    periodId: string,
    filterDto: PayrollFilterDto,
  ): Promise<{ data: PayrollItem[]; total: number }> {
    const { page = 1, limit = 10, user_id } = filterDto;

    const queryBuilder = this.itemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.employee', 'employee')
      .where('item.period_id = :periodId', { periodId });

    if (user_id) {
      queryBuilder.andWhere('item.user_id = :user_id', { user_id });
    }

    const [data, total] = await queryBuilder
      .orderBy('user.last_name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async createPayrollItem(
    periodId: string,
    createItemDto: CreatePayrollItemDto,
    actorId: string,
  ): Promise<PayrollItem> {
    const item = this.itemRepository.create({
      ...createItemDto,
      period_id: periodId,
    });
    return await this.itemRepository.save(item);
  }

  async getPeriodSummary(id: string): Promise<any> {
    const period = await this.findOnePeriod(id);
    const items = period.items || [];

    const summary = {
      total_users: new Set(items.map((item) => item.user_id)).size,
      total_earnings: items
        .filter((item) => item.type === 'EARNING')
        .reduce((sum, item) => sum + Number(item.amount), 0),
      total_deductions: items
        .filter((item) => item.type === 'DEDUCTION')
        .reduce((sum, item) => sum + Number(item.amount), 0),
      by_department: {},
    };

    return summary;
  }

  async exportPeriod(id: string, format: string): Promise<Buffer> {
    const period = await this.findOnePeriod(id);
    // Export implementation
    return Buffer.from(
      `Export for period ${period.period_id} in ${format} format`,
    );
  }

  async importVolumeEntries(file: any, actorId: string): Promise<any> {
    // Import implementation
    return { success: true, imported: 0 };
  }

  async getUserPayslip(userId: string, periodId: string): Promise<any> {
    const items = await this.itemRepository.find({
      where: { user_id: userId, period_id: periodId },
      relations: ['user', 'period'],
    });

    return {
      user: items[0]?.user,
      period: items[0]?.period,
      items: items,
      summary: {
        total_earnings: items
          .filter((item) => item.type === 'EARNING')
          .reduce((sum, item) => sum + Number(item.amount), 0),
        total_deductions: items
          .filter((item) => item.type === 'DEDUCTION')
          .reduce((sum, item) => sum + Number(item.amount), 0),
      },
    };
  }
}
