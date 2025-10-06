import { ScheduleTemplatesService } from './schedule-templates.service';
import { CreateScheduleTemplateDto } from './dto/create-schedule-template.dto';
export declare class ScheduleTemplatesController {
    private readonly templatesService;
    constructor(templatesService: ScheduleTemplatesService);
    create(createTemplateDto: CreateScheduleTemplateDto, req: any): Promise<import("./entities/schedule-template.entity").ScheduleTemplate>;
    findAll(req: any): Promise<import("./entities/schedule-template.entity").ScheduleTemplate[]>;
    findOne(id: string, req: any): Promise<import("./entities/schedule-template.entity").ScheduleTemplate>;
    update(id: string, updateTemplateDto: Partial<CreateScheduleTemplateDto>, req: any): Promise<import("./entities/schedule-template.entity").ScheduleTemplate>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
