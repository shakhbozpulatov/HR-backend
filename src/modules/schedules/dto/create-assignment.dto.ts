import {
  IsString,
  IsDateString,
  IsOptional,
  IsArray,
  IsDate,
} from 'class-validator';
import { ScheduleException } from '../entities/employee-schedule-assignment.entity';
import { Type } from 'class-transformer';

export class CreateAssignmentDto {
  @IsString()
  user_id: string;

  @IsString()
  default_template_id: string;

  @IsDate()
  @Type(() => Date)
  effective_from: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effective_to?: Date;

  @IsOptional()
  @IsArray()
  exceptions?: ScheduleException[];
}
