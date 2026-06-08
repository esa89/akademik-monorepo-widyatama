import {
  IsOptional, IsString, IsBoolean, IsInt, Min, Max, IsIn, IsUUID, IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LastEducation, AcademicPosition, AuthentikStatus } from '@prisma/client';

const ALLOWED_SORT_BY = ['name', 'nidn', 'nrk', 'email', 'createdAt'] as const;
type AllowedSortBy = (typeof ALLOWED_SORT_BY)[number];

export class QueryLecturerDto {
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

  @ApiPropertyOptional({ description: 'Search by nidn, nrk, name, email, username' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by faculty ID' })
  @IsUUID()
  @IsOptional()
  facultyId?: string;

  @ApiPropertyOptional({ description: 'Filter by study program ID' })
  @IsUUID()
  @IsOptional()
  studyProgramId?: string;

  @ApiPropertyOptional({ description: 'Filter by last education', enum: LastEducation })
  @IsEnum(LastEducation)
  @IsOptional()
  lastEducation?: LastEducation;

  @ApiPropertyOptional({ description: 'Filter by academic position', enum: AcademicPosition })
  @IsEnum(AcademicPosition)
  @IsOptional()
  academicPosition?: AcademicPosition;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by Authentik status', enum: AuthentikStatus })
  @IsEnum(AuthentikStatus)
  @IsOptional()
  authentikStatus?: AuthentikStatus;

  @ApiPropertyOptional({ description: 'Sort field', enum: ALLOWED_SORT_BY, default: 'createdAt' })
  @IsIn(ALLOWED_SORT_BY)
  @IsOptional()
  sortBy?: AllowedSortBy = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'], default: 'desc' })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
