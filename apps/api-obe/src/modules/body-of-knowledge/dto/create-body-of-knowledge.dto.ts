import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBodyOfKnowledgeDto {
  @ApiProperty({ description: 'Curriculum ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  curriculumId!: string;

  @ApiProperty({ description: 'Unique Body of Knowledge code within curriculum', example: 'BK-01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @ApiProperty({ description: 'Body of Knowledge name', example: 'Algoritma dan Pemrograman' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Reference / source', example: 'KKNI Level 6' })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Mencakup konsep dasar algoritma...' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
