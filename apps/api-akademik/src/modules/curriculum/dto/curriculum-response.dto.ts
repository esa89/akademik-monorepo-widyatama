import { ApiProperty } from '@nestjs/swagger';

export class StudyProgramSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'TI' })
  code!: string;

  @ApiProperty({ example: 'Teknik Informatika' })
  name!: string;
}

export class CurriculumResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'KUR-IF-2025' })
  code!: string;

  @ApiProperty({ example: 'Kurikulum Informatika 2025' })
  name!: string;

  @ApiProperty({ example: 2025 })
  year!: number;

  @ApiProperty({
    example: 'Kurikulum berbasis OBE untuk program studi Informatika',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: 8 })
  totalSemester!: number;

  @ApiProperty({ example: 144 })
  totalSks!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ type: StudyProgramSummaryDto, description: 'Parent Study Program' })
  studyProgram!: StudyProgramSummaryDto;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  updatedAt!: Date;
}
