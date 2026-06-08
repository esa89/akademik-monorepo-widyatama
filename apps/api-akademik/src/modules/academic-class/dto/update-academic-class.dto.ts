import { PartialType } from '@nestjs/swagger';
import { CreateAcademicClassDto } from './create-academic-class.dto';

export class UpdateAcademicClassDto extends PartialType(CreateAcademicClassDto) {}
