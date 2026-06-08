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

export class CreateCurriculumDto {
  @ApiPropertyOptional({ description: 'Study Program ID (for prodi-scope curriculum)' })
  @IsString()
  @IsUUID()
  @IsOptional()
  studyProgramId?: string;

  @ApiPropertyOptional({ description: 'Faculty ID (for faculty-scope curriculum)' })
  @IsString()
  @IsUUID()
  @IsOptional()
  facultyId?: string;

  @ApiPropertyOptional({ description: 'Unique Curriculum code', example: 'KUR-IF-2025' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiPropertyOptional({ description: 'Curriculum name', example: 'Kurikulum Informatika 2025' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Effective year', example: 2025 })
  @IsInt()
  @Min(2000)
  year!: number;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Total semesters', example: 8 })
  @IsInt()
  @Min(1)
  @Max(14)
  totalSemester!: number;

  @ApiPropertyOptional({ description: 'Total SKS', example: 144 })
  @IsInt()
  @Min(1)
  @Max(200)
  totalSks!: number;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
