import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssessmentComponentDto {
  @ApiProperty({ description: 'Kode komponen penilaian (unik)', example: 'KP01', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @ApiProperty({ description: 'Nama komponen penilaian', example: 'Partisipasi (Quiz)', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Deskripsi komponen penilaian' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Status aktif', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
