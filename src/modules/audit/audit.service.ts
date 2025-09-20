import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async log(
    actor: string,
    action: string,
    targetType: string,
    targetId: string,
    before?: any,
    after?: any,
  ): Promise<AuditLog> {
    const log = this.auditRepository.create({
      actor,
      action,
      target_type: targetType,
      target_id: targetId,
      before,
      after,
    });

    return await this.auditRepository.save(log);
  }

  async logHttpRequest(data: {
    actor: string;
    method: string;
    url: string;
    body?: any;
    response?: any;
    error?: string;
    duration: number;
    status: string;
  }): Promise<void> {
    try {
      await this.log(
        data.actor,
        `HTTP_${data.method}`,
        'HTTP_REQUEST',
        data.url,
        { body: data.body, duration: data.duration },
        { response: data.response, error: data.error, status: data.status },
      );
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }

  async findAll(
    actor?: string,
    targetType?: string,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ data: AuditLog[]; total: number }> {
    const queryBuilder = this.auditRepository.createQueryBuilder('audit');

    if (actor) {
      queryBuilder.andWhere('audit.actor = :actor', { actor });
    }

    if (targetType) {
      queryBuilder.andWhere('audit.target_type = :targetType', { targetType });
    }

    if (startDate) {
      queryBuilder.andWhere('audit.created_at >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('audit.created_at <= :endDate', { endDate });
    }

    const [data, total] = await queryBuilder
      .orderBy('audit.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }
}
