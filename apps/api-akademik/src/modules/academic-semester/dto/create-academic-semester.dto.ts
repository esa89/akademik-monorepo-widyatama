import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  MaxLength,
  MinLength,
  Matches,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SemesterType } from '../enums/semester-type.enum';

export class CreateAcademicSemesterDto {
  @ApiProperty({
    description: 'Unique Semester code',
    example: '2025-GANJIL',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({
    description: 'Semester name',
    example: 'Semester Ganjil 2025/2026',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'Academic year format YYYY/YYYY',
    example: '2025/2026',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}\/\d{4}$/, {
    message: 'academicYear must be in format YYYY/YYYY, e.g. 2025/2026',
  })
  academicYear!: string;

  @ApiProperty({
    description: 'Semester type',
    enum: SemesterType,
    example: SemesterType.GANJIL,
  })
  @IsEnum(SemesterType)
  @IsNotEmpty()
  semesterType!: SemesterType;

  @ApiProperty({
    description: 'Start date',
    example: '2025-08-01',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({
    description: 'End date',
    example: '2025-12-31',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiPropertyOptional({ description: 'Is current semester', example: false })
  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean = false;
}
