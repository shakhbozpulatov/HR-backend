import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateHCUserDto {
  @IsString()
  groupId: string;

  @IsString()
  personCode: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsNumber()
  gender: number;

  @IsString()
  phone: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
