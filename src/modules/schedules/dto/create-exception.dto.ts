import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
} from 'class-validator';

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

  // Optional: specify which template's assignments should get this exception
  // If not provided, applies to ALL active assignments in the company
  @IsOptional()
  @IsUUID('4')
  default_template_id?: string;
}
