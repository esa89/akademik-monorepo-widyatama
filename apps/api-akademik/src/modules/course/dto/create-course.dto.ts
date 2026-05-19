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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({
    description: 'Curriculum ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  curriculumId!: string;

  @ApiProperty({
    description: 'Unique Course code',
    example: 'IF101',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({
    description: 'Course name',
    example: 'Algoritma dan Pemrograman',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    description: 'Course description',
    example: 'Mata kuliah dasar pemrograman komputer',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Total SKS (credit units)',
    example: 3,
  })
  @IsInt()
  @Min(1)
  @Max(6)
  sks!: number;

  @ApiProperty({
    description: 'Semester number',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Max(14)
  semester!: number;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
