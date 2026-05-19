import { ApiProperty } from '@nestjs/swagger';

export class CourseSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'IF101' })
  code!: string;

  @ApiProperty({ example: 'Algoritma dan Pemrograman' })
  name!: string;
}

export class CplMappingSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'CPL-01' })
  code!: string;

  @ApiProperty({ example: 'Kemampuan problem solving' })
  name!: string;

  @ApiProperty({ example: 60 })
  weight!: number;
}

export class CpmkResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'CPMK-01' })
  code!: string;

  @ApiProperty({ example: 'Mampu membuat algoritma dasar' })
  name!: string;

  @ApiProperty({
    example: 'Mahasiswa mampu merancang algoritma sederhana',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: 1 })
  orderNumber!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ type: CourseSummaryDto, description: 'Parent Course' })
  course!: CourseSummaryDto;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  updatedAt!: Date;
}

export class CpmkDetailResponseDto extends CpmkResponseDto {
  @ApiProperty({ type: [CplMappingSummaryDto], description: 'Mapped CPLs with weights' })
  cpls!: CplMappingSummaryDto[];
}
