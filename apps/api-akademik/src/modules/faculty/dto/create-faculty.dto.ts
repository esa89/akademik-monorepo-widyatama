import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFacultyDto {
  @ApiProperty({ description: 'Unique Faculty code', example: 'FTEIC' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @ApiProperty({ description: 'Faculty name', example: 'Fakultas Teknik Elektro dan Informatika Cerdas' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    description: 'Description',
    example: 'Fakultas yang fokus pada bidang teknik elektro dan informatika',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
