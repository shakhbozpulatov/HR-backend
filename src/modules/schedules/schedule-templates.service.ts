import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduleTemplate } from './entities/schedule-template.entity';
import { CreateScheduleTemplateDto } from './dto/create-schedule-template.dto';

@Injectable()
export class ScheduleTemplatesService {
  constructor(
    @InjectRepository(ScheduleTemplate)
    private templateRepository: Repository<ScheduleTemplate>,
  ) {}

  async create(
    createTemplateDto: CreateScheduleTemplateDto,
  ): Promise<ScheduleTemplate> {
    const template = this.templateRepository.create(createTemplateDto);
    return await this.templateRepository.save(template);
  }

  async findAll(): Promise<ScheduleTemplate[]> {
    return await this.templateRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ScheduleTemplate> {
    const template = await this.templateRepository.findOne({
      where: { template_id: id },
    });

    if (!template) {
      throw new NotFoundException('Schedule template not found');
    }

    return template;
  }

  async update(
    id: string,
    updateTemplateDto: Partial<CreateScheduleTemplateDto>,
  ): Promise<ScheduleTemplate> {
    const template = await this.findOne(id);
    Object.assign(template, updateTemplateDto);
    return await this.templateRepository.save(template);
  }

  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    await this.templateRepository.remove(template);
  }
}
