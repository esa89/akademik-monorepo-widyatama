import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateLecturerDto } from './create-lecturer.dto';

export class UpdateLecturerDto extends PartialType(
  OmitType(CreateLecturerDto, ['username', 'password'] as const),
) {}
