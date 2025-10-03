import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(25)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  first_name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  last_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  middle_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Please provide a valid phone number',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  // Option 1: Create new company
  @IsOptional()
  @IsBoolean()
  create_company?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  company_name?: string;

  // Option 2: Join existing company
  @IsOptional()
  @IsString()
  @Matches(/^COM\d{3,}$/, {
    message: 'Invalid company code format (expected: COM001)',
  })
  company_code?: string;
}
