import { ApiProperty } from '@nestjs/swagger';

export class CplSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'CPL-01' })
  code!: string;

  @ApiProperty({ example: 'Mampu membangun aplikasi web' })
  name!: string;
}

export class BahanKajianResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'BK-01' })
  code!: string;

  @ApiProperty({ example: 'Pemrograman Web' })
  name!: string;

  @ApiProperty({
    example: 'Materi pembelajaran tentang pengembangan aplikasi web modern',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: 2025 })
  curriculumYear!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: 12, description: 'Total number of related CPLs' })
  totalCpl!: number;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  updatedAt!: Date;
}

export class BahanKajianDetailResponseDto extends BahanKajianResponseDto {
  @ApiProperty({ type: [CplSummaryDto], description: 'Related CPLs' })
  cpls!: CplSummaryDto[];
}
