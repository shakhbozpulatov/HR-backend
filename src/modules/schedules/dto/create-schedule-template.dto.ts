import {
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { BreakTime } from '../entities/schedule-template.entity';
import { Type } from 'class-transformer';

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
  @ValidateNested({ each: true })
  @Type(() => BreakTime) // 👈 shu qatordan keyin breaks ishlaydi
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
  @Min(0)
  rounding_min?: number;
}
