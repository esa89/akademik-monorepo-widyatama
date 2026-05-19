import { PartialType } from '@nestjs/swagger';
import { CreateAcademicSemesterDto } from './create-academic-semester.dto';

export class UpdateAcademicSemesterDto extends PartialType(CreateAcademicSemesterDto) {}
