import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsInt,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCpmkDto {
  @ApiProperty({
    description: 'Course ID from api-akademik',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  courseId!: string;

  @ApiProperty({
    description: 'CPMK code (unique per course)',
    example: 'CPMK-01',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({
    description: 'CPMK name',
    example: 'Mampu membuat algoritma dasar',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    description: 'CPMK description',
    example: 'Mahasiswa mampu merancang algoritma sederhana',
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

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
