import { IsOptional, IsString, IsBoolean, IsInt, Min, Max, IsIn, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Degree } from '../enums/degree.enum';

const ALLOWED_SORT_BY = ['code', 'name', 'degree', 'accreditation', 'createdAt'] as const;
type AllowedSortBy = (typeof ALLOWED_SORT_BY)[number];

export class QueryStudyProgramDto {
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

  @ApiPropertyOptional({
    description: 'Search by code or name',
    example: 'informatika',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by Faculty ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  @IsOptional()
  facultyId?: string;

  @ApiPropertyOptional({
    description: 'Filter by degree',
    enum: Degree,
    example: Degree.S1,
  })
  @IsEnum(Degree)
  @IsOptional()
  degree?: Degree;

  @ApiPropertyOptional({ description: 'Filter by accreditation', example: 'A' })
  @IsString()
  @IsOptional()
  accreditation?: string;

  @ApiPropertyOptional({ description: 'Filter by active status', example: true })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ALLOWED_SORT_BY,
    default: 'createdAt',
  })
  @IsIn(ALLOWED_SORT_BY)
  @IsOptional()
  sortBy?: AllowedSortBy = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
