import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduleTemplate } from './entities/schedule-template.entity';
import { CreateScheduleTemplateDto } from './dto/create-schedule-template.dto';
import { UserRole } from '@/modules/users/entities/user.entity';

@Injectable()
export class ScheduleTemplatesService {
  constructor(
    @InjectRepository(ScheduleTemplate)
    private templateRepository: Repository<ScheduleTemplate>,
  ) {}

  async create(
    createTemplateDto: CreateScheduleTemplateDto,
    user: any,
  ): Promise<ScheduleTemplate> {
    // Agar user SUPER_ADMIN bo‘lmasa, company_id majburiy bo‘ladi
    if (!user.company_id && user.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('User is not linked to any company');
    }

    const template = this.templateRepository.create({
      ...createTemplateDto,
      company_id: user.company_id, // ✅ avtomatik company_id
    });

    return await this.templateRepository.save(template);
  }

  async findAll(user: any): Promise<ScheduleTemplate[]> {
    // SUPER_ADMIN barcha companylarni ko‘ra oladi
    if (user.role === UserRole.SUPER_ADMIN) {
      return await this.templateRepository.find({
        order: { name: 'ASC' },
      });
    }

    // Boshqa foydalanuvchilar faqat o‘z companysini ko‘radi
    return await this.templateRepository.find({
      where: { company_id: user.company_id },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, company: any): Promise<ScheduleTemplate> {
    const whereClause =
      company.role === UserRole.SUPER_ADMIN
        ? { template_id: id }
        : { template_id: id, company_id: company.company_id };

    const template = await this.templateRepository.findOne({
      where: whereClause,
    });

    if (!template) {
      throw new NotFoundException('Schedule template not found');
    }

    return template;
  }

  async update(
    id: string,
    updateTemplateDto: Partial<CreateScheduleTemplateDto>,
    company: any,
  ): Promise<ScheduleTemplate> {
    const template = await this.findOne(id, company);
    Object.assign(template, updateTemplateDto);
    return await this.templateRepository.save(template);
  }

  async remove(id: string, company: any): Promise<void> {
    const template = await this.findOne(id, company);
    await this.templateRepository.remove(template);
  }
}
