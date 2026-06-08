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
  IsArray,
  IsEnum,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LecturerRole } from '@prisma/client';

export class ClassLecturerDto {
  @ApiProperty({ description: 'Lecturer ID' })
  @IsUUID()
  @IsNotEmpty()
  lecturerId!: string;

  @ApiProperty({ enum: LecturerRole, description: 'Lecturer role in this class' })
  @IsEnum(LecturerRole)
  role!: LecturerRole;
}

export class CreateAcademicClassDto {
  @ApiProperty({ description: 'Academic Semester ID' })
  @IsUUID()
  @IsNotEmpty()
  semesterId!: string;

  @ApiProperty({ description: 'Course ID' })
  @IsUUID()
  @IsNotEmpty()
  courseId!: string;

  @ApiProperty({ description: 'Class code, unique within semester', example: 'IF101-A' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({ description: 'Class name', example: 'Algoritma dan Pemrograman - Kelas A' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Maximum student capacity', default: 40 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  capacity?: number = 40;

  @ApiPropertyOptional({ description: 'Active status', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty({ type: [ClassLecturerDto], description: 'Lecturers assigned to this class (at least one required)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassLecturerDto)
  @ArrayMinSize(1)
  lecturers!: ClassLecturerDto[];

  @ApiPropertyOptional({ type: [String], description: 'Student IDs to enroll' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  studentIds?: string[];
}
