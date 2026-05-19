import { ApiProperty } from '@nestjs/swagger';

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

export class SubCpmkResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'LO1.1' })
  code!: string;

  @ApiProperty({ example: 'Mampu membuat flowchart' })
  name!: string;

  @ApiProperty({
    example: 'Mahasiswa mampu membuat flowchart sederhana',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: 1 })
  orderNumber!: number;

  @ApiProperty({ example: 75 })
  targetPercentage!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ type: CpmkSummaryDto, description: 'Parent CPMK' })
  cpmk!: CpmkSummaryDto;

  @ApiProperty({ type: CourseSummaryDto, description: 'Parent Course via CPMK' })
  course!: CourseSummaryDto;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  updatedAt!: Date;
}
