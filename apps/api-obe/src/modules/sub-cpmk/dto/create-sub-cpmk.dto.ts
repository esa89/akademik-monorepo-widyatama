import {
  IsString, IsNotEmpty, IsOptional, IsBoolean,
  IsUUID, IsInt, Min, Max, MaxLength, MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubCpmkDto {
  @ApiProperty({ description: 'Curriculum ID (untuk indexing)' })
  @IsString()
  @IsNotEmpty()
  curriculumId!: string;

  @ApiProperty({ description: 'Course ID (mata kuliah)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  courseId!: string;

  @ApiProperty({ description: 'CPMK ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  cpmkId!: string;

  @ApiProperty({ description: 'Kode Sub CPMK (unik per CPMK)', example: 'SCPMK01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({ description: 'Isi Sub CPMK', example: 'Mampu membuat flowchart' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(500)
  name!: string;

  @ApiPropertyOptional({ description: 'Deskripsi tambahan' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Nomor urutan', example: 1 })
  @IsInt()
  @Min(0)
  @IsOptional()
  orderNumber?: number;

  @ApiPropertyOptional({ description: 'Target persentase (0-100)', example: 0 })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  targetPercentage?: number;

  @ApiPropertyOptional({ description: 'Status aktif', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
