import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryBkCourseMappingDto {
  @ApiProperty({ description: 'Curriculum ID from api-akademik', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  curriculumId!: string;
}
