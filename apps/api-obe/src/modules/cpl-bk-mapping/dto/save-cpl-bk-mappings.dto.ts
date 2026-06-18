import { IsString, IsNotEmpty, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BkMappingPairDto {
  @ApiProperty({ description: 'CPL ID', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  cplId!: string;

  @ApiProperty({ description: 'Body of Knowledge ID', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  bodyOfKnowledgeId!: string;
}

export class SaveCplBkMappingsDto {
  @ApiProperty({ description: 'Curriculum ID from api-akademik', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  curriculumId!: string;

  @ApiProperty({ type: [BkMappingPairDto], description: 'Array of CPL-BodyOfKnowledge pairs' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BkMappingPairDto)
  mappings!: BkMappingPairDto[];
}
