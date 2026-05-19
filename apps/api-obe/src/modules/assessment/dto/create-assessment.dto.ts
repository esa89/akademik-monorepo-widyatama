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
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssessmentType } from '@prisma/client';

export class CreateAssessmentDto {
  @ApiProperty({
    description: 'Sub CPMK ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  subCpmkId!: string;

  @ApiProperty({
    description: 'Assessment code (unique per Sub CPMK)',
    example: 'AS-01',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @ApiProperty({
    description: 'Assessment name',
    example: 'Quiz Flowchart',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    description: 'Assessment description',
    example: 'Quiz dasar flowchart',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Assessment type',
    enum: AssessmentType,
    example: AssessmentType.QUIZ,
  })
  @IsEnum(AssessmentType)
  type!: AssessmentType;

  @ApiProperty({
    description: 'Weight (1-100)',
    example: 30,
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
