import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Holiday } from './entities/holiday.entity';
import { CreateHolidayDto } from './dto/create-holiday.dto';

@Injectable()
export class HolidaysService {
  constructor(
    @InjectRepository(Holiday)
    private holidayRepository: Repository<Holiday>,
  ) {}

  async create(createHolidayDto: CreateHolidayDto): Promise<Holiday> {
    const holiday = this.holidayRepository.create(createHolidayDto);
    return await this.holidayRepository.save(holiday);
  }

  async findAll(year?: number, location?: string): Promise<Holiday[]> {
    const queryBuilder = this.holidayRepository.createQueryBuilder('holiday');

    if (year) {
      queryBuilder.andWhere('EXTRACT(YEAR FROM holiday.date) = :year', {
        year,
      });
    }

    if (location) {
      queryBuilder.andWhere(
        '(holiday.location_scope = :location OR holiday.location_scope = :global)',
        {
          location,
          global: 'global',
        },
      );
    }

    return await queryBuilder.orderBy('holiday.date', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Holiday> {
    const holiday = await this.holidayRepository.findOne({
      where: { holiday_id: id },
    });

    if (!holiday) {
      throw new NotFoundException('Holiday not found');
    }

    return holiday;
  }

  async update(
    id: string,
    updateHolidayDto: Partial<CreateHolidayDto>,
  ): Promise<Holiday> {
    const holiday = await this.findOne(id);
    Object.assign(holiday, updateHolidayDto);
    return await this.holidayRepository.save(holiday);
  }

  async remove(id: string): Promise<void> {
    const holiday = await this.findOne(id);
    await this.holidayRepository.remove(holiday);
  }

  async isHoliday(date: Date, location: string = 'global'): Promise<boolean> {
    const holiday = await this.holidayRepository.findOne({
      where: {
        date,
        location_scope: location,
      },
    });

    if (!holiday) {
      // Check for global holidays
      const globalHoliday = await this.holidayRepository.findOne({
        where: {
          date,
          location_scope: 'global',
        },
      });
      return !!globalHoliday;
    }

    return !!holiday;
  }

  async getHolidaysForDateRange(
    startDate: Date,
    endDate: Date,
    location: string = 'global',
  ): Promise<Holiday[]> {
    return await this.holidayRepository
      .createQueryBuilder('holiday')
      .where('holiday.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere(
        '(holiday.location_scope = :location OR holiday.location_scope = :global)',
        {
          location,
          global: 'global',
        },
      )
      .orderBy('holiday.date', 'ASC')
      .getMany();
  }
}
