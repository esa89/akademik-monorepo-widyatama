import { Module } from '@nestjs/common';
import { BkCourseMappingController } from './bk-course-mapping.controller';
import { BkCourseMappingService } from './bk-course-mapping.service';
import { BkCourseMappingRepository } from './bk-course-mapping.repository';

@Module({
  controllers: [BkCourseMappingController],
  providers: [BkCourseMappingService, BkCourseMappingRepository],
  exports: [BkCourseMappingService],
})
export class BkCourseMappingModule {}
