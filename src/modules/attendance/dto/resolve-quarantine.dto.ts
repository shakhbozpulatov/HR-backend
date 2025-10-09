import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class ResolveQuarantineDto {
  @IsString()
  @IsUUID()
  user_id: string;

  @IsOptional()
  @IsBoolean()
  create_mapping?: boolean = true;

  @IsOptional()
  @IsBoolean()
  reprocess_record?: boolean = true;

  @IsOptional()
  @IsString()
  notes?: string;
}
