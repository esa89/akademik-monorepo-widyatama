import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGraduateProfileDto {
  @ApiProperty({ description: 'Unique Graduate Profile code', example: 'PL-01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @ApiProperty({ description: 'Graduate Profile name', example: 'Software Engineer' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(500)
  name!: string;

  @ApiPropertyOptional({
    description: 'Description',
    example: 'Profil lulusan yang fokus pada pengembangan perangkat lunak',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Vision statement',
    example: 'Menjadi program studi unggulan dalam bidang teknologi informasi',
  })
  @IsString()
  @IsOptional()
  vision?: string;

  @ApiPropertyOptional({
    description: 'Mission statement',
    example: 'Menyelenggarakan pendidikan berkualitas untuk mencetak lulusan kompeten',
  })
  @IsString()
  @IsOptional()
  mission?: string;

  @ApiProperty({ description: 'Curriculum year', example: 2025 })
  @IsInt()
  @Min(2000)
  curriculumYear!: number;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
