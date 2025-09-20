import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceEvent } from './entities/attendance-event.entity';
import { AttendanceFilterDto } from './dto/attendance-filter.dto';

@Injectable()
export class AttendanceEventsService {
  constructor(
    @InjectRepository(AttendanceEvent)
    private eventRepository: Repository<AttendanceEvent>,
  ) {}

  async processWebhookEvent(
    eventData: any,
    idempotencyKey: string,
  ): Promise<AttendanceEvent[]> {
    const event = this.eventRepository.create({
      ...eventData,
      ingestion_idempotency_key: idempotencyKey,
      ts_utc: new Date(eventData.timestamp),
      ts_local: new Date(eventData.timestamp),
    });

    return await this.eventRepository.save(event);
  }

  async findAll(
    filterDto: AttendanceFilterDto,
  ): Promise<{ data: AttendanceEvent[]; total: number }> {
    const { page = 1, limit = 10, employee_id, from, to } = filterDto;

    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.employee', 'employee')
      .leftJoinAndSelect('event.device', 'device');

    if (employee_id) {
      queryBuilder.andWhere('event.employee_id = :employee_id', {
        employee_id,
      });
    }

    if (from) {
      queryBuilder.andWhere('event.ts_local >= :from', { from });
    }

    if (to) {
      queryBuilder.andWhere('event.ts_local <= :to', { to });
    }

    const [data, total] = await queryBuilder
      .orderBy('event.ts_local', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async updateDeviceStatus(statusData: any): Promise<{ success: boolean }> {
    // Implementation for device status update
    console.log('Device status updated:', statusData);
    return { success: true };
  }

  async getQuarantinedEvents(): Promise<AttendanceEvent[]> {
    return await this.eventRepository.find({
      where: { employee_id: null },
      relations: ['device'],
      order: { created_at: 'DESC' },
    });
  }

  async resolveQuarantinedEvent(
    eventId: string,
    employeeId: string,
    _actorId: string,
  ): Promise<AttendanceEvent> {
    const event = await this.eventRepository.findOne({
      where: { event_id: eventId },
    });
    if (event) {
      event.employee_id = employeeId;
      return await this.eventRepository.save(event);
    }
    return event;
  }
}
