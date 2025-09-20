import { Repository } from 'typeorm';
import { ScheduleTemplate } from './entities/schedule-template.entity';
import { CreateScheduleTemplateDto } from './dto/create-schedule-template.dto';
export declare class ScheduleTemplatesService {
    private templateRepository;
    constructor(templateRepository: Repository<ScheduleTemplate>);
    create(createTemplateDto: CreateScheduleTemplateDto): Promise<ScheduleTemplate>;
    findAll(): Promise<ScheduleTemplate[]>;
    findOne(id: string): Promise<ScheduleTemplate>;
    update(id: string, updateTemplateDto: Partial<CreateScheduleTemplateDto>): Promise<ScheduleTemplate>;
    remove(id: string): Promise<void>;
}
