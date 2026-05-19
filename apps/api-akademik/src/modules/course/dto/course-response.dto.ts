import { ApiProperty } from '@nestjs/swagger';

export class CurriculumSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'KUR-IF-2025' })
  code!: string;

  @ApiProperty({ example: 'Kurikulum Informatika 2025' })
  name!: string;
}

export class StudyProgramSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'TI' })
  code!: string;

  @ApiProperty({ example: 'Teknik Informatika' })
  name!: string;
}

export class CourseResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'IF101' })
  code!: string;

  @ApiProperty({ example: 'Algoritma dan Pemrograman' })
  name!: string;

  @ApiProperty({
    example: 'Mata kuliah dasar pemrograman komputer',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: 3 })
  sks!: number;

  @ApiProperty({ example: 1 })
  semester!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ type: CurriculumSummaryDto, description: 'Parent Curriculum' })
  curriculum!: CurriculumSummaryDto;

  @ApiProperty({ type: StudyProgramSummaryDto, description: 'Parent Study Program via Curriculum' })
  studyProgram!: StudyProgramSummaryDto;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  updatedAt!: Date;
}
