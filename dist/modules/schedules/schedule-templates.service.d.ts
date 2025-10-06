import { Repository } from 'typeorm';
import { ScheduleTemplate } from './entities/schedule-template.entity';
import { CreateScheduleTemplateDto } from './dto/create-schedule-template.dto';
export declare class ScheduleTemplatesService {
    private templateRepository;
    constructor(templateRepository: Repository<ScheduleTemplate>);
    create(createTemplateDto: CreateScheduleTemplateDto, user: any): Promise<ScheduleTemplate>;
    findAll(user: any): Promise<ScheduleTemplate[]>;
    findOne(id: string, company: any): Promise<ScheduleTemplate>;
    update(id: string, updateTemplateDto: Partial<CreateScheduleTemplateDto>, company: any): Promise<ScheduleTemplate>;
    remove(id: string, company: any): Promise<void>;
}
