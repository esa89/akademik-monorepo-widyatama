import { Injectable, Logger } from '@nestjs/common';
import { BkCourseMappingRepository } from './bk-course-mapping.repository';
import { SaveBkCourseMappingsDto } from './dto/save-bk-course-mappings.dto';
import { QueryBkCourseMappingDto } from './dto/query-bk-course-mapping.dto';

@Injectable()
export class BkCourseMappingService {
  private readonly logger = new Logger(BkCourseMappingService.name);

  constructor(private readonly repo: BkCourseMappingRepository) {}

  async getMatrix(query: QueryBkCourseMappingDto) {
    this.logger.log(`Fetching BK-Course matrix for curriculum ${query.curriculumId}`);
    return this.repo.getMatrix(query);
  }

  async saveMappings(dto: SaveBkCourseMappingsDto) {
    this.logger.log(`Saving ${dto.mappings.length} BK-Course mappings for curriculum ${dto.curriculumId}`);
    const count = await this.repo.saveMappings(dto);
    this.logger.log(`Saved ${count} BK-Course mappings for curriculum ${dto.curriculumId}`);
    return { count };
  }
}
