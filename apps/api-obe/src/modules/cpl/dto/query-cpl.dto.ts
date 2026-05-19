import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CplCategory } from '../enums/cpl-category.enum';

const ALLOWED_SORT_BY = ['code', 'name', 'curriculumYear', 'createdAt'] as const;
type AllowedSortBy = (typeof ALLOWED_SORT_BY)[number];

export class QueryCplDto {
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
    example: 'algoritma',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by category',
    enum: CplCategory,
    example: CplCategory.PENGETAHUAN,
  })
  @IsEnum(CplCategory)
  @IsOptional()
  category?: CplCategory;

  @ApiPropertyOptional({ description: 'Filter by curriculum year', example: 2024 })
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
    description: 'Filter by Graduate Profile ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  @IsOptional()
  graduateProfileId?: string;

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
