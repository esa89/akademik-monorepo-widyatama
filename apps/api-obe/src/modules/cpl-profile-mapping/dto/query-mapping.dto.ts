import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryMappingDto {
  @ApiProperty({ description: 'Curriculum ID from api-akademik', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  curriculumId!: string;

  @ApiPropertyOptional({ description: 'Curriculum year to filter CPL and GraduateProfile', example: 2024 })
  @IsInt()
  @Min(2000)
  @IsOptional()
  @Type(() => Number)
  curriculumYear?: number;
}
