import {
  IsString,
  IsOptional,
  IsEmail,
  MaxLength,
  Matches,
  IsDateString,
  IsDate,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  first_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  last_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  middle_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/)
  phone?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return null;
    return new Date(value);
  })
  @IsDate()
  dob?: Date;
}
