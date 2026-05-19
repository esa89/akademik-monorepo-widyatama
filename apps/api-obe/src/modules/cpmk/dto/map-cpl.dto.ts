import { IsArray, IsInt, IsNotEmpty, IsString, IsUUID, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CplMappingItemDto {
  @ApiProperty({
    description: 'CPL ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  cplId!: string;

  @ApiProperty({
    description: 'Weight percentage (1-100)',
    example: 60,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  weight!: number;
}

export class MapCplDto {
  @ApiProperty({
    description: 'List of CPL mappings with weights',
    type: [CplMappingItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CplMappingItemDto)
  cpls!: CplMappingItemDto[];
}
