import { Company } from '@/modules/company/entities/company.entity';
export declare class Holiday {
    holiday_id: string;
    company_id?: string;
    name: string;
    date: Date;
    location_scope: string;
    paid: boolean;
    created_at: Date;
    updated_at: Date;
    company?: Company;
}
