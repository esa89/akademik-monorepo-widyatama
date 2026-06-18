import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CpmkCplPairDto {
  @IsString() @IsNotEmpty()
  cpmkId!: string;

  @IsString() @IsNotEmpty()
  cplId!: string;
}

export class SaveCpmkCplMappingDto {
  @IsString() @IsNotEmpty()
  curriculumId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CpmkCplPairDto)
  mappings!: CpmkCplPairDto[];
}
