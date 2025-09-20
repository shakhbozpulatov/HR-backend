import { IsString, IsArray, IsOptional, IsNumber, Min } from 'class-validator';
import { BreakTime } from '../entities/schedule-template.entity';

export class CreateScheduleTemplateDto {
  @IsString()
  name: string;

  @IsArray()
  workdays: string[];

  @IsString()
  start_time: string;

  @IsString()
  end_time: string;

  @IsOptional()
  @IsArray()
  breaks?: BreakTime[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  grace_in_min?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  grace_out_min?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  rounding_min?: number;
}
