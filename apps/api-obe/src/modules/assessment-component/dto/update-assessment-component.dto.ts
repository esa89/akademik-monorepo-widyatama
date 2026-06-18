import { PartialType } from '@nestjs/swagger';
import { CreateAssessmentComponentDto } from './create-assessment-component.dto';

export class UpdateAssessmentComponentDto extends PartialType(CreateAssessmentComponentDto) {}
