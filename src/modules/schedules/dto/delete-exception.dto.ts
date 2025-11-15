import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ExceptionType } from './create-exception.dto';

export class DeleteExceptionDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  template_id?: string;

  @IsEnum(ExceptionType)
  type: ExceptionType;
}
