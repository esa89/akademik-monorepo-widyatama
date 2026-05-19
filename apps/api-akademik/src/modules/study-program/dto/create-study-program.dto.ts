import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Degree } from '../enums/degree.enum';

export class CreateStudyProgramDto {
  @ApiProperty({ description: 'Faculty ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  facultyId!: string;

  @ApiProperty({ description: 'Unique Study Program code', example: 'TI' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @ApiProperty({ description: 'Study Program name', example: 'Teknik Informatika' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'Degree level',
    enum: Degree,
    example: Degree.S1,
  })
  @IsEnum(Degree)
  @IsNotEmpty()
  degree!: Degree;

  @ApiPropertyOptional({ description: 'Accreditation status', example: 'A' })
  @IsString()
  @IsOptional()
  accreditation?: string;

  @ApiPropertyOptional({
    description: 'Description',
    example: 'Program studi yang fokus pada pengembangan perangkat lunak',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
