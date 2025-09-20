import { IsString, IsDateString, IsOptional, IsArray } from 'class-validator';
import { ScheduleException } from '../entities/employee-schedule-assignment.entity';

export class CreateAssignmentDto {
  @IsString()
  employee_id: string;

  @IsString()
  default_template_id: string;

  @IsDateString()
  effective_from: string;

  @IsOptional()
  @IsDateString()
  effective_to?: string;

  @IsOptional()
  @IsArray()
  exceptions?: ScheduleException[];
}
