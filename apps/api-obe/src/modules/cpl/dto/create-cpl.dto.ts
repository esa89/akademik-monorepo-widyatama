import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min, MaxLength, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CplCategory } from '../enums/cpl-category.enum';

export class CreateCplDto {
  @ApiProperty({ description: 'Unique CPL code', example: 'CPL-01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @ApiProperty({ description: 'CPL name', example: 'Berpikir Kritis' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  name!: string;

  @ApiProperty({
    description: 'CPL category',
    enum: CplCategory,
    example: CplCategory.PENGETAHUAN,
  })
  @IsEnum(CplCategory)
  @IsNotEmpty()
  category!: CplCategory;

  @ApiPropertyOptional({
    description: 'CPL description',
    example: 'Mahasiswa mampu berpikir kritis dalam menyelesaikan masalah',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Curriculum year', example: 2024 })
  @IsInt()
  @Min(2000)
  curriculumYear!: number;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiPropertyOptional({
    description: 'Associated Graduate Profile ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  @IsOptional()
  graduateProfileId?: string;
}
