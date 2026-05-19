import { ApiProperty } from '@nestjs/swagger';
import { AssessmentType } from '@prisma/client';

export class SubCpmkSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'LO1.1' })
  code!: string;

  @ApiProperty({ example: 'Mampu membuat flowchart' })
  name!: string;
}

export class CpmkSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'CPMK-01' })
  code!: string;

  @ApiProperty({ example: 'Mampu membuat algoritma dasar' })
  name!: string;
}

export class CourseSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'IF101' })
  code!: string;

  @ApiProperty({ example: 'Algoritma dan Pemrograman' })
  name!: string;
}

export class AssessmentResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'AS-01' })
  code!: string;

  @ApiProperty({ example: 'Quiz Flowchart' })
  name!: string;

  @ApiProperty({
    example: 'Quiz dasar flowchart',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ enum: AssessmentType, example: AssessmentType.QUIZ })
  type!: AssessmentType;

  @ApiProperty({ example: 30 })
  weight!: number;

  @ApiProperty({ example: 100 })
  maxScore!: number;

  @ApiProperty({ example: 1 })
  orderNumber!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ type: SubCpmkSummaryDto, description: 'Parent Sub CPMK' })
  subCpmk!: SubCpmkSummaryDto;

  @ApiProperty({ type: CpmkSummaryDto, description: 'Parent CPMK via Sub CPMK' })
  cpmk!: CpmkSummaryDto;

  @ApiProperty({ type: CourseSummaryDto, description: 'Parent Course via CPMK' })
  course!: CourseSummaryDto;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  updatedAt!: Date;
}
