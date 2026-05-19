import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubCpmkDto {
  @ApiProperty({
    description: 'CPMK ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  cpmkId!: string;

  @ApiProperty({
    description: 'Sub CPMK code (unique per CPMK)',
    example: 'LO1.1',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({
    description: 'Sub CPMK name',
    example: 'Mampu membuat flowchart',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    description: 'Sub CPMK description',
    example: 'Mahasiswa mampu membuat flowchart sederhana',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Order number',
    example: 1,
  })
  @IsInt()
  @Min(1)
  orderNumber!: number;

  @ApiProperty({
    description: 'Target percentage (1-100)',
    example: 75,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  targetPercentage!: number;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
