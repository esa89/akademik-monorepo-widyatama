import {
  IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID,
  IsEmail, IsEnum, IsInt, Min, Max, MaxLength, MinLength,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, StudentStatus, AdmissionPath, Agama } from '@prisma/client';

export class CreateStudentDto {
  @ApiProperty({ description: 'NIM mahasiswa', example: '240611001' })
  @IsString() @IsNotEmpty() @MaxLength(30)
  nim!: string;

  @ApiProperty({ description: 'Nama lengkap mahasiswa', example: 'Budi Santoso' })
  @IsString() @IsNotEmpty() @MinLength(2) @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Tempat lahir', example: 'Bandung' })
  @IsString() @IsOptional() @MaxLength(100)
  birthPlace?: string;

  @ApiPropertyOptional({ description: 'Tanggal lahir (ISO date)', example: '2004-05-15' })
  @IsDateString() @IsOptional()
  birthDate?: string;

  @ApiProperty({ description: 'Jenis kelamin', enum: Gender })
  @IsEnum(Gender)
  gender!: Gender;

  @ApiPropertyOptional({ description: 'Email mahasiswa', example: 'budi@student.widyatama.ac.id' })
  @IsEmail() @IsOptional() @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ description: 'Nomor HP', example: '081234567890' })
  @IsString() @IsOptional() @MaxLength(20)
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Agama', enum: Agama })
  @IsEnum(Agama) @IsOptional()
  agama?: Agama;

  @ApiProperty({ description: 'ID Fakultas' })
  @IsUUID() @IsNotEmpty()
  facultyId!: string;

  @ApiProperty({ description: 'ID Program Studi' })
  @IsUUID() @IsNotEmpty()
  studyProgramId!: string;

  @ApiPropertyOptional({ description: 'ID Kurikulum' })
  @IsUUID() @IsOptional()
  curriculumId?: string;

  @ApiPropertyOptional({ description: 'ID Semester Masuk (Academic Semester)' })
  @IsUUID() @IsOptional()
  academicSemesterId?: string;

  @ApiProperty({ description: 'Tahun angkatan', example: 2024 })
  @IsInt() @Min(2000) @Max(2100)
  entryYear!: number;

  @ApiPropertyOptional({ description: 'Jalur masuk', enum: AdmissionPath })
  @IsEnum(AdmissionPath) @IsOptional()
  admissionPath?: AdmissionPath = AdmissionPath.REGULER;

  @ApiPropertyOptional({ description: 'Status mahasiswa', enum: StudentStatus })
  @IsEnum(StudentStatus) @IsOptional()
  studentStatus?: StudentStatus = StudentStatus.AKTIF;

  @ApiPropertyOptional({ description: 'Status aktif', default: true })
  @IsBoolean() @IsOptional()
  isActive?: boolean = true;
}
