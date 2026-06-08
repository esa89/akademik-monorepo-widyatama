import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiPropertyOptional({ description: 'Curriculum ID (for prodi-level courses)' })
  @IsString()
  @IsUUID()
  @IsOptional()
  curriculumId?: string;

  @ApiPropertyOptional({ description: 'Faculty ID (for faculty-level courses)' })
  @IsString()
  @IsUUID()
  @IsOptional()
  facultyId?: string;

  @ApiPropertyOptional({ description: 'Unique Course code', example: 'IF101' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiPropertyOptional({ description: 'Course name', example: 'Algoritma dan Pemrograman' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Course description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Total SKS', example: 3 })
  @IsInt()
  @Min(1)
  @Max(6)
  sks!: number;

  @ApiPropertyOptional({ description: 'Semester number', example: 1 })
  @IsInt()
  @Min(1)
  @Max(14)
  semester!: number;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
