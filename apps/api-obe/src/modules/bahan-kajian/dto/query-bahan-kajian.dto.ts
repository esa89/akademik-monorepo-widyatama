import { IsOptional, IsString, IsBoolean, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

const ALLOWED_SORT_BY = ['code', 'name', 'curriculumYear', 'createdAt'] as const;
type AllowedSortBy = (typeof ALLOWED_SORT_BY)[number];

export class QueryBahanKajianDto {
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
    description: 'Search by code, name, or description',
    example: 'pemrograman',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by curriculum year', example: 2025 })
  @IsInt()
  @Min(2000)
  @Type(() => Number)
  @IsOptional()
  curriculumYear?: number;

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
