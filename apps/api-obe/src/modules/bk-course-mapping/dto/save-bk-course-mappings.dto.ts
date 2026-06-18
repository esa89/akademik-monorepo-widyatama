import { IsString, IsNotEmpty, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CourseMappingPairDto {
  @ApiProperty({ description: 'Body of Knowledge ID', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  bodyOfKnowledgeId!: string;

  @ApiProperty({ description: 'Course ID (from api-akademik)', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  courseId!: string;
}

export class SaveBkCourseMappingsDto {
  @ApiProperty({ description: 'Curriculum ID from api-akademik', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  curriculumId!: string;

  @ApiProperty({ type: [CourseMappingPairDto], description: 'Array of BodyOfKnowledge-Course pairs' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseMappingPairDto)
  mappings!: CourseMappingPairDto[];
}
