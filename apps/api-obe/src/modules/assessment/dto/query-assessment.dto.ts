import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsIn,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssessmentType } from '@prisma/client';

const ALLOWED_SORT_BY = ['code', 'name', 'weight', 'maxScore', 'orderNumber', 'createdAt'] as const;
type AllowedSortBy = (typeof ALLOWED_SORT_BY)[number];

export class QueryAssessmentDto {
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
    example: 'quiz',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by Sub CPMK ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  @IsOptional()
  subCpmkId?: string;

  @ApiPropertyOptional({
    description: 'Filter by assessment type',
    enum: AssessmentType,
  })
  @IsEnum(AssessmentType)
  @IsOptional()
  type?: AssessmentType;

  @ApiPropertyOptional({ description: 'Filter by active status', example: true })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ALLOWED_SORT_BY,
    default: 'orderNumber',
  })
  @IsIn(ALLOWED_SORT_BY)
  @IsOptional()
  sortBy?: AllowedSortBy = 'orderNumber';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
