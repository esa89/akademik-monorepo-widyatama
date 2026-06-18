import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCpmkDto {
  @ApiProperty({
    description: 'Curriculum ID (from api-akademik, no FK constraint)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty()
  curriculumId!: string;

  @ApiProperty({ description: 'CPMK code (unique per curriculum)', example: 'CPMK011' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({ description: 'CPMK content / description', example: 'Mampu menganalisis...' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(1000)
  name!: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Catatan tambahan' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
