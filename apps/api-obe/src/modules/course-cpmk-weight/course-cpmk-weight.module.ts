import { Module } from '@nestjs/common';
import { CourseCpmkWeightController } from './course-cpmk-weight.controller';
import { CourseCpmkWeightService } from './course-cpmk-weight.service';
import { CourseCpmkWeightRepository } from './course-cpmk-weight.repository';

@Module({
  controllers: [CourseCpmkWeightController],
  providers: [CourseCpmkWeightService, CourseCpmkWeightRepository],
  exports: [CourseCpmkWeightService],
})
export class CourseCpmkWeightModule {}
