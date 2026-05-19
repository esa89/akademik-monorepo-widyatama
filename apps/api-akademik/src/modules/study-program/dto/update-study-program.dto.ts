import { PartialType } from '@nestjs/swagger';
import { CreateStudyProgramDto } from './create-study-program.dto';

export class UpdateStudyProgramDto extends PartialType(CreateStudyProgramDto) {}
