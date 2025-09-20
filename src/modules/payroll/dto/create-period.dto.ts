import { IsDateString } from 'class-validator';

export class CreatePeriodDto {
  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;
}
