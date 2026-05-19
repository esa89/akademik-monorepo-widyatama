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

export class CreateRubricDto {
  @ApiProperty({
    description: 'Assessment ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  assessmentId!: string;

  @ApiProperty({
    description: 'Rubric code (unique per Assessment)',
    example: 'RB-01',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({
    description: 'Rubric name',
    example: 'Ketepatan Flowchart',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    description: 'Rubric description',
    example: 'Menilai ketepatan simbol flowchart',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Weight (1-100)',
    example: 40,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  weight!: number;

  @ApiProperty({
    description: 'Maximum score',
    example: 100,
  })
  @IsInt()
  @Min(1)
  maxScore!: number;

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
