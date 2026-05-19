import { ApiProperty } from '@nestjs/swagger';
import { CplCategory } from '../enums/cpl-category.enum';

export class CplResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'CPL-01' })
  code!: string;

  @ApiProperty({ example: 'Berpikir Kritis' })
  name!: string;

  @ApiProperty({ enum: CplCategory, example: CplCategory.PENGETAHUAN })
  category!: CplCategory;

  @ApiProperty({
    example: 'Mahasiswa mampu berpikir kritis dalam menyelesaikan masalah',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ example: 2024 })
  curriculumYear!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  updatedAt!: Date;
}
