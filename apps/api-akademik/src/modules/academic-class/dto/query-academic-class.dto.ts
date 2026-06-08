import { IsOptional, IsString, IsBoolean, IsInt, Min, Max, IsIn, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

const ALLOWED_SORT = ['code', 'name', 'createdAt'] as const;
type AllowedSort = (typeof ALLOWED_SORT)[number];

export class QueryAcademicClassDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page (max 100)', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search by code, name, or course name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by Academic Semester ID' })
  @IsUUID()
  @IsOptional()
  semesterId?: string;

  @ApiPropertyOptional({ description: 'Filter by Course ID' })
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @ApiPropertyOptional({ description: 'Filter by Lecturer ID' })
  @IsUUID()
  @IsOptional()
  lecturerId?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: ALLOWED_SORT, default: 'createdAt' })
  @IsIn(ALLOWED_SORT)
  @IsOptional()
  sortBy?: AllowedSort = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
