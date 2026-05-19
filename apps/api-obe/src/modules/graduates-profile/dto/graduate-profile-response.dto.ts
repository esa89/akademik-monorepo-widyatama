import { ApiProperty } from '@nestjs/swagger';

export class GraduateProfileResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'PL-01' })
  code!: string;

  @ApiProperty({ example: 'Software Engineer' })
  name!: string;

  @ApiProperty({
    example: 'Profil lulusan yang fokus pada pengembangan perangkat lunak',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    example: 'Menjadi program studi unggulan dalam bidang teknologi informasi',
    nullable: true,
  })
  vision!: string | null;

  @ApiProperty({
    example: 'Menyelenggarakan pendidikan berkualitas untuk mencetak lulusan kompeten',
    nullable: true,
  })
  mission!: string | null;

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
