import { Module } from '@nestjs/common';
import { CompaniesService } from './company.service';
import { CompaniesController } from './company.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '@/modules/company/entities/company.entity';
import { Department } from '@/modules/company/entities/department.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Department])],
  controllers: [CompaniesController],
  providers: [CompaniesService],
})
export class CompanyModule {}
