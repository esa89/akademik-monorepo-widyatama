import { Module } from '@nestjs/common';
import { StudyProgramController } from './study-program.controller';
import { StudyProgramService } from './study-program.service';
import { StudyProgramRepository } from './study-program.repository';

@Module({
  controllers: [StudyProgramController],
  providers: [StudyProgramService, StudyProgramRepository],
  exports: [StudyProgramService, StudyProgramRepository],
})
export class StudyProgramModule {}
