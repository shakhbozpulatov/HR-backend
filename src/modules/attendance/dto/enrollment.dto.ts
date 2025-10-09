import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class EnrollUserDto {
  @IsString()
  @IsUUID()
  user_id: string;

  @IsString()
  @IsUUID()
  device_id: string;

  @IsOptional()
  @IsString()
  terminal_user_id?: string;

  @IsOptional()
  @IsString()
  card_number?: string;

  @IsOptional()
  @IsString()
  @Length(4, 8)
  pin_code?: string;

  @IsOptional()
  @IsBoolean()
  auto_generate_terminal_id?: boolean = true;
}
