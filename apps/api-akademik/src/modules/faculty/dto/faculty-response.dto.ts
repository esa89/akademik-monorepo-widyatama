import { ApiProperty } from '@nestjs/swagger';

export class FacultyResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'FTEIC' })
  code!: string;

  @ApiProperty({ example: 'Fakultas Teknik Elektro dan Informatika Cerdas' })
  name!: string;

  @ApiProperty({
    example: 'Fakultas yang fokus pada bidang teknik elektro dan informatika',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: 5, description: 'Total number of related Study Programs' })
  totalStudyProgram!: number;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  updatedAt!: Date;
}
