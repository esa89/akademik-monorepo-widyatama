import { Injectable, BadRequestException } from '@nestjs/common';
import { CpmkCplMappingRepository } from './cpmk-cpl-mapping.repository';
import { QueryCpmkCplMappingDto } from './dto/query-cpmk-cpl-mapping.dto';
import { SaveCpmkCplMappingDto } from './dto/save-cpmk-cpl-mapping.dto';

@Injectable()
export class CpmkCplMappingService {
  constructor(private readonly repository: CpmkCplMappingRepository) {}

  async getMatrix(query: QueryCpmkCplMappingDto) {
    if (!query.curriculumId) throw new BadRequestException('curriculumId is required');
    return this.repository.getMatrix(query);
  }

  async saveMappings(dto: SaveCpmkCplMappingDto) {
    const count = await this.repository.saveMappings(dto);
    return { count, message: `Saved ${count} CPL-CPMK mapping(s)` };
  }
}
