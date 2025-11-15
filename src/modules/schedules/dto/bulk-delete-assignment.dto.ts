import {
  IsArray,
  ArrayMinSize,
  IsString,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

export class BulkDeleteAssignmentDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one user ID is required' })
  @IsString({ each: true })
  @IsUUID('4', { each: true, message: 'Each user_id must be a valid UUID' })
  @IsNotEmpty({ each: true, message: 'User ID cannot be empty' })
  user_id: string[];

  @IsOptional()
  @IsBoolean()
  delete_all?: boolean; // If true, delete all assignments; if false, only delete active assignments
}
