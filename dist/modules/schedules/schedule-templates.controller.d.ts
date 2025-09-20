import { ScheduleTemplatesService } from './schedule-templates.service';
import { CreateScheduleTemplateDto } from './dto/create-schedule-template.dto';
export declare class ScheduleTemplatesController {
    private readonly templatesService;
    constructor(templatesService: ScheduleTemplatesService);
    create(createTemplateDto: CreateScheduleTemplateDto): Promise<import("./entities/schedule-template.entity").ScheduleTemplate>;
    findAll(): Promise<import("./entities/schedule-template.entity").ScheduleTemplate[]>;
    findOne(id: string): Promise<import("./entities/schedule-template.entity").ScheduleTemplate>;
    update(id: string, updateTemplateDto: Partial<CreateScheduleTemplateDto>): Promise<import("./entities/schedule-template.entity").ScheduleTemplate>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
