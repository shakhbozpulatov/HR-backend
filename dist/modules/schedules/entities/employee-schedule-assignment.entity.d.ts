import { ScheduleTemplate } from './schedule-template.entity';
import { User } from '@/modules/users/entities/user.entity';
export interface ScheduleException {
    date?: string;
    start_date?: string;
    end_date?: string;
    template_id?: string;
    type: 'OFF' | 'ALTERNATE_TEMPLATE';
}
export declare class UserScheduleAssignment {
    assignment_id: string;
    user_id: string;
    default_template_id: string;
    effective_from: Date;
    effective_to?: Date;
    exceptions?: ScheduleException[];
    created_at: Date;
    updated_at: Date;
    user: User;
    default_template: ScheduleTemplate;
}
