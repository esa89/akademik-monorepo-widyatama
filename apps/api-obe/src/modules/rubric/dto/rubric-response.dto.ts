import { ApiProperty } from '@nestjs/swagger';

export class AssessmentSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'AS-01' })
  code!: string;

  @ApiProperty({ example: 'Quiz Flowchart' })
  name!: string;
}

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

export class RubricResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'RB-01' })
  code!: string;

  @ApiProperty({ example: 'Ketepatan Flowchart' })
  name!: string;

  @ApiProperty({
    example: 'Menilai ketepatan simbol flowchart',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: 40 })
  weight!: number;

  @ApiProperty({ example: 100 })
  maxScore!: number;

  @ApiProperty({ example: 1 })
  orderNumber!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ type: AssessmentSummaryDto, description: 'Parent Assessment' })
  assessment!: AssessmentSummaryDto;

  @ApiProperty({ type: SubCpmkSummaryDto, description: 'Parent Sub CPMK via Assessment' })
  subCpmk!: SubCpmkSummaryDto;

  @ApiProperty({ type: CpmkSummaryDto, description: 'Parent CPMK via Sub CPMK' })
  cpmk!: CpmkSummaryDto;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  updatedAt!: Date;
}
