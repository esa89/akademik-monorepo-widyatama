import { IsString, IsNotEmpty, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class MappingPairDto {
  @ApiProperty({ description: 'CPL ID', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  cplId!: string;

  @ApiProperty({ description: 'Graduate Profile ID', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  graduateProfileId!: string;
}

export class SaveMappingsDto {
  @ApiProperty({ description: 'Curriculum ID from api-akademik', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  curriculumId!: string;

  @ApiProperty({ type: [MappingPairDto], description: 'Array of CPL-GraduateProfile pairs' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MappingPairDto)
  mappings!: MappingPairDto[];
}
