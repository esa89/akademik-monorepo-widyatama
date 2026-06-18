import { Module } from '@nestjs/common';
import { AssessmentComponentController } from './assessment-component.controller';
import { AssessmentComponentService } from './assessment-component.service';
import { AssessmentComponentRepository } from './assessment-component.repository';

@Module({
  controllers: [AssessmentComponentController],
  providers: [AssessmentComponentService, AssessmentComponentRepository],
  exports: [AssessmentComponentService],
})
export class AssessmentComponentModule {}
