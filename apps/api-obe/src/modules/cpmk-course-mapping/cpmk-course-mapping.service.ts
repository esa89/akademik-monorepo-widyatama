import { Injectable, BadRequestException } from '@nestjs/common';
import { CpmkCourseMappingRepository } from './cpmk-course-mapping.repository';
import { SaveCpmkCourseMappingDto } from './dto/save-cpmk-course-mapping.dto';
import { QueryCpmkCourseMappingDto } from './dto/query-cpmk-course-mapping.dto';

@Injectable()
export class CpmkCourseMappingService {
  constructor(private readonly repository: CpmkCourseMappingRepository) {}

  async getMatrix(query: QueryCpmkCourseMappingDto) {
    if (!query.curriculumId) {
      throw new BadRequestException('curriculumId is required');
    }
    return this.repository.getMatrix(query);
  }

  async saveMappings(dto: SaveCpmkCourseMappingDto) {
    return this.repository.saveMappings(dto);
  }

  async getCoursesForCpmk(cpmkId: string) {
    return this.repository.getCoursesForCpmk(cpmkId);
  }
}
