import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
export declare class AuditService {
    private auditRepository;
    constructor(auditRepository: Repository<AuditLog>);
    log(actor: string, action: string, targetType: string, targetId: string, before?: any, after?: any): Promise<AuditLog>;
    logHttpRequest(data: {
        actor: string;
        method: string;
        url: string;
        body?: any;
        response?: any;
        error?: string;
        duration: number;
        status: string;
    }): Promise<void>;
    findAll(actor?: string, targetType?: string, startDate?: Date, endDate?: Date, page?: number, limit?: number): Promise<{
        data: AuditLog[];
        total: number;
    }>;
}
