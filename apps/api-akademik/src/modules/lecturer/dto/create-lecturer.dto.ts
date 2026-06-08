import {
  IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID,
  IsEmail, IsEnum, MaxLength, MinLength, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LastEducation, AcademicPosition } from '@prisma/client';

export class CreateLecturerDto {
  @ApiProperty({ description: 'NIDN dosen', example: '0412345678' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  nidn!: string;

  @ApiProperty({ description: 'NRK (Nomor Registrasi Karyawan)', example: 'WT00001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  nrk!: string;

  @ApiProperty({ description: 'Nama lengkap dosen', example: 'Esa Fauzi' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Gelar depan', example: 'Dr.' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  frontTitle?: string;

  @ApiPropertyOptional({ description: 'Gelar belakang', example: 'M.Kom.' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  backTitle?: string;

  @ApiProperty({ description: 'Email dosen', example: 'esa.fauzi@widyatama.ac.id' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(150)
  email!: string;

  @ApiPropertyOptional({ description: 'Nomor HP', example: '081234567890' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiProperty({ description: 'Pendidikan terakhir', enum: LastEducation })
  @IsEnum(LastEducation)
  lastEducation!: LastEducation;

  @ApiPropertyOptional({ description: 'Jabatan akademik', enum: AcademicPosition })
  @IsEnum(AcademicPosition)
  @IsOptional()
  academicPosition?: AcademicPosition = AcademicPosition.TENAGA_PENGAJAR;

  @ApiProperty({ description: 'ID Fakultas' })
  @IsUUID()
  @IsNotEmpty()
  facultyId!: string;

  @ApiProperty({ description: 'ID Program Studi (homebase)' })
  @IsUUID()
  @IsNotEmpty()
  studyProgramId!: string;

  @ApiPropertyOptional({ description: 'Status aktif', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty({ description: 'Username login', example: '0412345678' })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(50)
  username!: string;

  @ApiProperty({
    description: 'Password awal (min 8 karakter, mengandung huruf dan angka)',
    example: '0412345678@Wt',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, {
    message: 'Password harus mengandung minimal satu huruf dan satu angka',
  })
  password!: string;
}
