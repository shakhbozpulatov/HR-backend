import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { AttendanceFilterDto } from './dto/attendance-filter.dto';

@Injectable()
export class AttendanceRecordsService {
  constructor(
    @InjectRepository(AttendanceRecord)
    private recordRepository: Repository<AttendanceRecord>,
  ) {}

  async findAll(
    filterDto: AttendanceFilterDto,
  ): Promise<{ data: AttendanceRecord[]; total: number }> {
    const { page = 1, limit = 10, employee_id, from, to } = filterDto;

    const queryBuilder = this.recordRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.employee', 'employee');

    if (employee_id) {
      queryBuilder.andWhere('record.employee_id = :employee_id', {
        employee_id,
      });
    }

    if (from) {
      queryBuilder.andWhere('record.date >= :from', { from });
    }

    if (to) {
      queryBuilder.andWhere('record.date <= :to', { to });
    }

    const [data, total] = await queryBuilder
      .orderBy('record.date', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(employeeId: string, date: Date): Promise<AttendanceRecord> {
    return await this.recordRepository.findOne({
      where: { employee_id: employeeId, date },
      relations: ['employee'],
    });
  }

  async createManualAdjustment(
    employeeId: string,
    date: Date,
    adjustment: any,
    actorId: string,
  ): Promise<AttendanceRecord> {
    const record = await this.findOne(employeeId, date);
    if (record) {
      if (!record.manual_adjustments) {
        record.manual_adjustments = [];
      }
      record.manual_adjustments.push({
        ...adjustment,
        id: Date.now().toString(),
        created_by: actorId,
        created_at: new Date(),
      });
      return await this.recordRepository.save(record);
    }
    return record;
  }

  async approveRecord(
    employeeId: string,
    date: Date,
    actorId: string,
  ): Promise<AttendanceRecord> {
    const record = await this.findOne(employeeId, date);
    if (record) {
      if (!record.approvals) {
        record.approvals = [];
      }
      record.approvals.push({
        approved_by: actorId,
        approved_at: new Date(),
        locked: true,
      });
      return await this.recordRepository.save(record);
    }
    return record;
  }

  async reprocessRecord(
    employeeId: string,
    date: Date,
  ): Promise<AttendanceRecord> {
    // Implementation for reprocessing record
    const record = await this.findOne(employeeId, date);
    return record;
  }

  async getTimesheetGrid(filterDto: AttendanceFilterDto): Promise<any> {
    const records = await this.findAll(filterDto);
    return records;
  }

  async exportToExcel(filterDto: AttendanceFilterDto): Promise<Buffer> {
    // Implementation for Excel export
    const records = await this.findAll(filterDto);
    return Buffer.from('Excel export not implemented yet');
  }
}
