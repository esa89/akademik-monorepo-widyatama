import { ApiProperty } from '@nestjs/swagger';
import { SemesterType } from '../enums/semester-type.enum';

export class AcademicSemesterResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: '2025-GANJIL' })
  code!: string;

  @ApiProperty({ example: 'Semester Ganjil 2025/2026' })
  name!: string;

  @ApiProperty({ example: '2025/2026' })
  academicYear!: string;

  @ApiProperty({ enum: SemesterType, example: SemesterType.GANJIL })
  semesterType!: SemesterType;

  @ApiProperty({ example: '2025-08-01' })
  startDate!: Date;

  @ApiProperty({ example: '2025-12-31' })
  endDate!: Date;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: true })
  isCurrent!: boolean;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  updatedAt!: Date;
}
