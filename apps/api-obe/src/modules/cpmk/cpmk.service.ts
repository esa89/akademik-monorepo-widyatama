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
    this.logger.log(`Fetching CPMK with query: ${JSON.stringify(query)}`);
    return this.repository.findAll(query);
  }

  async findOne(id: string) {
    this.logger.log(`Fetching CPMK by id: ${id}`);
    const item = await this.repository.findById(id);

    if (!item) {
      throw new NotFoundException(`CPMK with id '${id}' not found`);
    }

    return item;
  }

  async create(data: CreateCpmkDto) {
    this.logger.log(`Creating CPMK with code: ${data.code}`);

    const exists = await this.repository.existsByCodeAndCourse(data.code, data.courseId);
    if (exists) {
      throw new ConflictException(
        `CPMK with code '${data.code}' already exists for this course`,
      );
    }

    const item = await this.repository.create(data);
    this.logger.log(`CPMK created with id: ${item.id}`);
    return item;
  }

  async update(id: string, data: UpdateCpmkDto) {
    this.logger.log(`Updating CPMK id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`CPMK with id '${id}' not found`);
    }

    if (data.code && data.code !== existing.code) {
      const courseId = data.courseId ?? existing.courseId;
      const codeExists = await this.repository.existsByCodeAndCourse(data.code, courseId);
      if (codeExists) {
        throw new ConflictException(
          `CPMK with code '${data.code}' already exists for this course`,
        );
      }
    }

    const item = await this.repository.update(id, data);
    this.logger.log(`CPMK updated: ${item.id}`);
    return item;
  }

  async remove(id: string) {
    this.logger.log(`Deleting CPMK id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`CPMK with id '${id}' not found`);
    }

    const item = await this.repository.remove(id);
    this.logger.log(`CPMK deleted: ${item.id}`);
    return item;
  }

  async mapCpl(id: string, data: MapCplDto) {
    this.logger.log(`Mapping CPL to CPMK id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`CPMK with id '${id}' not found`);
    }

    const totalWeight = data.cpls.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight > 100) {
      throw new BadRequestException(
        `Total weight (${totalWeight}) exceeds maximum of 100`,
      );
    }

    const item = await this.repository.mapCplToCpmk(id, data);
    this.logger.log(`CPL mapped to CPMK: ${id}`);
    return item;
  }
}
