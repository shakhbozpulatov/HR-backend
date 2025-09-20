import { IsString, IsDateString, IsOptional, IsBoolean } from 'class-validator';

export class CreateHolidayDto {
  @IsString()
  name: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  location_scope?: string;

  @IsOptional()
  @IsBoolean()
  paid?: boolean;
}
