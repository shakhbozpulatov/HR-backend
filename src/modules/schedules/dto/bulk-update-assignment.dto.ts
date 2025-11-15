import {
  IsString,
  IsDate,
  IsOptional,
  IsArray,
  ArrayMinSize,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BulkUpdateAssignmentDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one user ID is required' })
  @IsString({ each: true })
  @IsUUID('4', { each: true, message: 'Each user_id must be a valid UUID' })
  @IsNotEmpty({ each: true, message: 'User ID cannot be empty' })
  user_id: string[];

  @IsString()
  @IsNotEmpty({ message: 'new_template_id cannot be empty' })
  @IsUUID('4', { message: 'new_template_id must be a valid UUID' })
  new_template_id: string;

  @IsDate()
  @Type(() => Date)
  effective_from: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effective_to?: Date;
}
