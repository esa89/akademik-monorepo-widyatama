import { Module } from '@nestjs/common';
import { AcademicClassController } from './academic-class.controller';
import { AcademicClassService } from './academic-class.service';
import { AcademicClassRepository } from './academic-class.repository';

@Module({
  controllers: [AcademicClassController],
  providers: [AcademicClassService, AcademicClassRepository],
  exports: [AcademicClassService, AcademicClassRepository],
})
export class AcademicClassModule {}
