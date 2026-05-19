import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBahanKajianDto {
  @ApiProperty({ description: 'Unique Bahan Kajian code', example: 'BK-01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @ApiProperty({ description: 'Bahan Kajian name', example: 'Pemrograman Web' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    description: 'Description',
    example: 'Materi pembelajaran tentang pengembangan aplikasi web modern',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Curriculum year', example: 2025 })
  @IsInt()
  @Min(2000)
  curriculumYear!: number;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
