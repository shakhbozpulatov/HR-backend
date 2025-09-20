import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum ExceptionType {
  OFF = 'OFF',
  ALTERNATE_TEMPLATE = 'ALTERNATE_TEMPLATE',
}

export class CreateExceptionDto {
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
