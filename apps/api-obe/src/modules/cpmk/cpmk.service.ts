import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CpmkRepository } from './cpmk.repository';
import { CreateCpmkDto } from './dto/create-cpmk.dto';
import { UpdateCpmkDto } from './dto/update-cpmk.dto';
import { QueryCpmkDto } from './dto/query-cpmk.dto';
import { MapCplDto } from './dto/map-cpl.dto';

@Injectable()
export class CpmkService {
  private readonly logger = new Logger(CpmkService.name);

  constructor(private readonly repository: CpmkRepository) {}

  async findAll(query: QueryCpmkDto) {
    return this.repository.findAll(query);
  }

  async findOne(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundException(`CPMK with id '${id}' not found`);
    return item;
  }

  async create(data: CreateCpmkDto) {
    const exists = await this.repository.existsByCodeAndCurriculum(data.code, data.curriculumId);
    if (exists) {
      throw new ConflictException(
        `CPMK with code '${data.code}' already exists in this curriculum`,
      );
    }
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateCpmkDto) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`CPMK with id '${id}' not found`);

    if (data.code && data.code !== existing.code) {
      const curriculumId = data.curriculumId ?? existing.curriculumId;
      const codeExists = await this.repository.existsByCodeAndCurriculum(data.code, curriculumId);
      if (codeExists) {
        throw new ConflictException(
          `CPMK with code '${data.code}' already exists in this curriculum`,
        );
      }
    }

    return this.repository.update(id, data);
  }

  async remove(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`CPMK with id '${id}' not found`);
    return this.repository.remove(id);
  }

  async mapCpl(id: string, data: MapCplDto) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`CPMK with id '${id}' not found`);

    const totalWeight = data.cpls.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight > 100) {
      throw new BadRequestException(`Total weight (${totalWeight}) exceeds maximum of 100`);
    }

    return this.repository.mapCplToCpmk(id, data);
  }
}
