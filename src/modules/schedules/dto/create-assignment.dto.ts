import {
  IsString,
  IsOptional,
  IsArray,
  IsDate,
  ArrayMinSize,
} from 'class-validator';
import { ScheduleException } from '../entities/employee-schedule-assignment.entity';
import { Type } from 'class-transformer';

export class CreateAssignmentDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one user ID is required' })
  @IsString({ each: true })
  user_id: string[];

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
