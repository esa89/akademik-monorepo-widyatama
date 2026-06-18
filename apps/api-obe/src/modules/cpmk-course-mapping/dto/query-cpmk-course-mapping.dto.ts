import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryCpmkCourseMappingDto {
  @IsString()
  @IsNotEmpty()
  curriculumId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  curriculumYear?: number;
}
