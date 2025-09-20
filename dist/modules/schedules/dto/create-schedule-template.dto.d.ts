import { BreakTime } from '../entities/schedule-template.entity';
export declare class CreateScheduleTemplateDto {
    name: string;
    workdays: string[];
    start_time: string;
    end_time: string;
    breaks?: BreakTime[];
    grace_in_min?: number;
    grace_out_min?: number;
    rounding_min?: number;
}
