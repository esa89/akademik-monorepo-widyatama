import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VisiMisiType } from '../enums/visi-misi-type.enum';

export class CreateVisiMisiDto {
  @ApiProperty({ enum: VisiMisiType, example: VisiMisiType.VISI })
  @IsEnum(VisiMisiType)
  @IsNotEmpty()
  type!: VisiMisiType;

  @ApiProperty({ description: 'Isi pernyataan visi atau misi', example: 'Menjadi program studi unggulan...' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({ description: 'Tahun kurikulum', example: 2024 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  curriculumYear!: number;

  @ApiPropertyOptional({ description: 'Urutan tampilan (untuk misi yang bernomor)', example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  orderNumber?: number = 1;

  @ApiPropertyOptional({ description: 'Status aktif', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
