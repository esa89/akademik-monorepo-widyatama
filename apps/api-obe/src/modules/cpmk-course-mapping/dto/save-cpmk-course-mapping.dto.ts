import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class SaveCpmkCourseMappingDto {
  @IsString()
  @IsNotEmpty()
  cpmkId!: string;

  @IsArray()
  @IsString({ each: true })
  courseIds!: string[];
}
