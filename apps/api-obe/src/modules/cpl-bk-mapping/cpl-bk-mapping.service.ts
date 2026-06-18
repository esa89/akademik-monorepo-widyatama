import { Injectable, Logger } from '@nestjs/common';
import { CplBkMappingRepository } from './cpl-bk-mapping.repository';
import { SaveCplBkMappingsDto } from './dto/save-cpl-bk-mappings.dto';
import { QueryCplBkMappingDto } from './dto/query-cpl-bk-mapping.dto';

@Injectable()
export class CplBkMappingService {
  private readonly logger = new Logger(CplBkMappingService.name);

  constructor(private readonly repo: CplBkMappingRepository) {}

  async getMatrix(query: QueryCplBkMappingDto) {
    this.logger.log(`Fetching CPL-BK matrix for curriculum ${query.curriculumId}`);
    return this.repo.getMatrix(query);
  }

  async saveMappings(dto: SaveCplBkMappingsDto) {
    this.logger.log(`Saving ${dto.mappings.length} CPL-BK mappings for curriculum ${dto.curriculumId}`);
    const count = await this.repo.saveMappings(dto);
    this.logger.log(`Saved ${count} CPL-BK mappings for curriculum ${dto.curriculumId}`);
    return { count };
  }
}
