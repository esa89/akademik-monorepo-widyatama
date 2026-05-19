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

export class CreateCurriculumDto {
  @ApiProperty({
    description: 'Study Program ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  studyProgramId!: string;

  @ApiProperty({
    description: 'Unique Curriculum code',
    example: 'KUR-IF-2025',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({
    description: 'Curriculum name',
    example: 'Kurikulum Informatika 2025',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'Effective year of the curriculum',
    example: 2025,
  })
  @IsInt()
  @Min(2000)
  year!: number;

  @ApiPropertyOptional({
    description: 'Description of the curriculum',
    example: 'Kurikulum berbasis OBE untuk program studi Informatika',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Total number of semesters',
    example: 8,
  })
  @IsInt()
  @Min(1)
  @Max(14)
  totalSemester!: number;

  @ApiProperty({
    description: 'Total SKS (credit units)',
    example: 144,
  })
  @IsInt()
  @Min(1)
  @Max(200)
  totalSks!: number;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
