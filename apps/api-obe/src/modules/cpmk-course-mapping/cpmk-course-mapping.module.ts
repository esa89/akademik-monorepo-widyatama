import { Module } from '@nestjs/common';
import { CpmkCourseMappingController } from './cpmk-course-mapping.controller';
import { CpmkCourseMappingService } from './cpmk-course-mapping.service';
import { CpmkCourseMappingRepository } from './cpmk-course-mapping.repository';

@Module({
  controllers: [CpmkCourseMappingController],
  providers: [CpmkCourseMappingService, CpmkCourseMappingRepository],
})
export class CpmkCourseMappingModule {}
