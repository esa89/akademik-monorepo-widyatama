import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Password baru (min 8 karakter, mengandung huruf dan angka)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, {
    message: 'Password harus mengandung minimal satu huruf dan satu angka',
  })
  newPassword!: string;
}
