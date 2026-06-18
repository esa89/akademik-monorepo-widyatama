import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryCourseCpmkWeightDto {
  @ApiPropertyOptional({ description: 'Filter berdasarkan courseId' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Filter berdasarkan curriculumId (via relasi CPMK)' })
  @IsOptional()
  @IsString()
  curriculumId?: string;
}
