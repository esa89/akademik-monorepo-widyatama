import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class ScoreEntryDto {
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  cpmkId!: string;

  @IsString()
  @IsUUID()
  @IsNotEmpty()
  assessmentComponentId!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  score!: number;
}

export class BulkSaveStudentCpmkScoreDto {
  @IsString()
  @IsNotEmpty()
  classId!: string;

  @IsString()
  @IsNotEmpty()
  courseId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoreEntryDto)
  scores!: ScoreEntryDto[];
}
