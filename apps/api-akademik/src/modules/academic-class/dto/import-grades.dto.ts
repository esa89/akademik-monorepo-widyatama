import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, IsArray, ValidateNested, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StudentGradeDto {
  @ApiProperty({ description: 'NIM / NPM mahasiswa' })
  @IsString()
  @IsNotEmpty()
  nim!: string;

  @ApiPropertyOptional({ description: 'Kehadiran (0–100)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  kehadiran?: number;

  @ApiPropertyOptional({ description: 'Nilai UTS (0–100)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  uts?: number;

  @ApiPropertyOptional({ description: 'Nilai UAS (0–100)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  uas?: number;

  @ApiPropertyOptional({ description: 'Nilai Quiz (0–100)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  quiz?: number;

  @ApiPropertyOptional({ description: 'Nilai Tugas (0–100)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  tugas?: number;

  @ApiPropertyOptional({ description: 'Nilai Akhir (0–100) — opsional, jika tidak diisi dihitung dari komponen', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  nilaiAkhir?: number;

  @ApiPropertyOptional({ description: 'Grade huruf ditentukan oleh dosen (A / B / C / D / E)', example: 'A' })
  @IsString()
  @Matches(/^[A-E]$/, { message: 'Grade harus berupa satu huruf: A, B, C, D, atau E' })
  @IsOptional()
  grade?: string;
}

export class ImportGradesDto {
  @ApiProperty({ type: [StudentGradeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentGradeDto)
  grades!: StudentGradeDto[];
}
