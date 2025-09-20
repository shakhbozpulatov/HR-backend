export declare class AuditLog {
    log_id: string;
    actor: string;
    action: string;
    target_type: string;
    target_id: string;
    before?: any;
    after?: any;
    created_at: Date;
}
