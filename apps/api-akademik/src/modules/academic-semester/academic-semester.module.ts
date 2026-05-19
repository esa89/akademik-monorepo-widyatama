import { Module } from '@nestjs/common';
import { AcademicSemesterController } from './academic-semester.controller';
import { AcademicSemesterService } from './academic-semester.service';
import { AcademicSemesterRepository } from './academic-semester.repository';

@Module({
  controllers: [AcademicSemesterController],
  providers: [AcademicSemesterService, AcademicSemesterRepository],
  exports: [AcademicSemesterService, AcademicSemesterRepository],
})
export class AcademicSemesterModule {}
