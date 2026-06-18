import { IsOptional, IsInt, Min, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { VisiMisiType } from '../enums/visi-misi-type.enum';

export class QueryVisiMisiDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: VisiMisiType })
  @IsOptional()
  @IsEnum(VisiMisiType)
  type?: VisiMisiType;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  curriculumYear?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'orderNumber' })
  @IsOptional()
  sortBy?: string = 'orderNumber';

  @ApiPropertyOptional({ example: 'asc' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
