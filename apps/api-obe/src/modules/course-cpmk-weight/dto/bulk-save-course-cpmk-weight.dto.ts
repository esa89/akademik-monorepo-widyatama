import { IsString, IsNotEmpty, IsArray, ValidateNested, IsInt, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class WeightEntryDto {
  @ApiProperty()
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  cpmkId!: string;

  @ApiProperty()
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  assessmentComponentId!: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  weight!: number;
}

export class BulkSaveCourseCpmkWeightDto {
  @ApiProperty({ description: 'Course ID (dari api-akademik)' })
  @IsString()
  @IsNotEmpty()
  courseId!: string;

  @ApiProperty({ type: [WeightEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeightEntryDto)
  weights!: WeightEntryDto[];
}
