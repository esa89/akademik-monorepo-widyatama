import { Module } from '@nestjs/common';
import { LecturerController } from './lecturer.controller';
import { LecturerService } from './lecturer.service';
import { LecturerRepository } from './lecturer.repository';

@Module({
  controllers: [LecturerController],
  providers: [LecturerService, LecturerRepository],
  exports: [LecturerService, LecturerRepository],
})
export class LecturerModule {}
