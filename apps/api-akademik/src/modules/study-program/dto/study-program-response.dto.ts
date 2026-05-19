import { ApiProperty } from '@nestjs/swagger';
import { Degree } from '../enums/degree.enum';

export class FacultySummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'FTEIC' })
  code!: string;

  @ApiProperty({ example: 'Fakultas Teknik Elektro dan Informatika Cerdas' })
  name!: string;
}

export class StudyProgramResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'TI' })
  code!: string;

  @ApiProperty({ example: 'Teknik Informatika' })
  name!: string;

  @ApiProperty({ enum: Degree, example: Degree.S1 })
  degree!: Degree;

  @ApiProperty({ example: 'A', nullable: true })
  accreditation!: string | null;

  @ApiProperty({
    example: 'Program studi yang fokus pada pengembangan perangkat lunak',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ type: FacultySummaryDto, description: 'Parent Faculty' })
  faculty!: FacultySummaryDto;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  updatedAt!: Date;
}
