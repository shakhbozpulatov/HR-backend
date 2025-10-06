import { ScheduleException } from '../entities/employee-schedule-assignment.entity';
export declare class CreateAssignmentDto {
    user_id: string;
    default_template_id: string;
    effective_from: Date;
    effective_to?: Date;
    exceptions?: ScheduleException[];
}
