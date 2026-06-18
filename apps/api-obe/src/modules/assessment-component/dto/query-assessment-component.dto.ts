import { IsOptional, IsString, IsBoolean, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

const ALLOWED_SORT_BY = ['code', 'name', 'createdAt'] as const;
type AllowedSortBy = (typeof ALLOWED_SORT_BY)[number];

export class QueryAssessmentComponentDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Cari berdasarkan kode atau nama' })
  @IsString() @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsBoolean() @Type(() => Boolean) @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: ALLOWED_SORT_BY })
  @IsIn(ALLOWED_SORT_BY) @IsOptional()
  sortBy?: AllowedSortBy = 'code';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsIn(['asc', 'desc']) @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
