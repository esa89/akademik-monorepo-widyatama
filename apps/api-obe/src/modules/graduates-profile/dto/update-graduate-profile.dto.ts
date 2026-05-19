import { PartialType } from '@nestjs/swagger';
import { CreateGraduateProfileDto } from './create-graduate-profile.dto';

export class UpdateGraduateProfileDto extends PartialType(CreateGraduateProfileDto) {}
