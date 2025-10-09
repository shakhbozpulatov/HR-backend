import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

export class BatchProcessDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  user_ids?: string[];

  @IsOptional()
  @IsBoolean()
  force_reprocess?: boolean = false;

  @IsOptional()
  @IsBoolean()
  include_locked?: boolean = false;
}

export class ReprocessDateRangeDto {
  @IsString()
  @IsUUID()
  user_id: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsBoolean()
  force?: boolean = false;
}

export class ApprovalDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  level?: number = 1;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  comments?: string;

  @IsOptional()
  @IsBoolean()
  lock_record?: boolean = false;
}
