import { IsString, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserAssignmentDto {
  @IsString()
  user_id: string;

  @IsString()
  new_template_id: string;

  @IsDate()
  @Type(() => Date)
  effective_from: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effective_to?: Date;
}
