import { Injectable, Logger } from '@nestjs/common';
import { CplProfileMappingRepository } from './cpl-profile-mapping.repository';
import { SaveMappingsDto } from './dto/save-mappings.dto';
import { QueryMappingDto } from './dto/query-mapping.dto';

@Injectable()
export class CplProfileMappingService {
  private readonly logger = new Logger(CplProfileMappingService.name);

  constructor(private readonly repo: CplProfileMappingRepository) {}

  async getMatrix(query: QueryMappingDto) {
    this.logger.log(`Fetching CPL-Profile matrix for curriculum ${query.curriculumId}`);
    return this.repo.getMatrix(query);
  }

  async saveMappings(dto: SaveMappingsDto) {
    this.logger.log(`Saving ${dto.mappings.length} CPL-Profile mappings for curriculum ${dto.curriculumId}`);
    const count = await this.repo.saveMappings(dto);
    this.logger.log(`Saved ${count} mappings for curriculum ${dto.curriculumId}`);
    return { count };
  }
}
