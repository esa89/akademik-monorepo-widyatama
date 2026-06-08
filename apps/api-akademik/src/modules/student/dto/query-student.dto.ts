import {
  IsOptional, IsString, IsBoolean, IsInt, Min, Max,
  IsIn, IsUUID, IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, StudentStatus, AdmissionPath } from '@prisma/client';

const ALLOWED_SORT_BY = ['nim', 'name', 'entryYear', 'createdAt'] as const;
type AllowedSortBy = (typeof ALLOWED_SORT_BY)[number];

export class QueryStudentDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search by nim, name, email' })
  @IsString() @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsUUID() @IsOptional()
  facultyId?: string;

  @ApiPropertyOptional()
  @IsUUID() @IsOptional()
  studyProgramId?: string;

  @ApiPropertyOptional()
  @IsUUID() @IsOptional()
  curriculumId?: string;

  @ApiPropertyOptional({ description: 'Filter by entry year', example: 2024 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(2000) @Max(2100)
  entryYear?: number;

  @ApiPropertyOptional({ enum: StudentStatus })
  @IsEnum(StudentStatus) @IsOptional()
  studentStatus?: StudentStatus;

  @ApiPropertyOptional({ enum: Gender })
  @IsEnum(Gender) @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ enum: AdmissionPath })
  @IsEnum(AdmissionPath) @IsOptional()
  admissionPath?: AdmissionPath;

  @ApiPropertyOptional()
  @IsBoolean() @Type(() => Boolean) @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: ALLOWED_SORT_BY, default: 'createdAt' })
  @IsIn(ALLOWED_SORT_BY) @IsOptional()
  sortBy?: AllowedSortBy = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsIn(['asc', 'desc']) @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
