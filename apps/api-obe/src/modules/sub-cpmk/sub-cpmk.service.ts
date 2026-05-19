import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SubCpmkRepository } from './sub-cpmk.repository';
import { CreateSubCpmkDto } from './dto/create-sub-cpmk.dto';
import { UpdateSubCpmkDto } from './dto/update-sub-cpmk.dto';
import { QuerySubCpmkDto } from './dto/query-sub-cpmk.dto';

@Injectable()
export class SubCpmkService {
  private readonly logger = new Logger(SubCpmkService.name);

  constructor(private readonly repository: SubCpmkRepository) {}

  async findAll(query: QuerySubCpmkDto) {
    this.logger.log(`Fetching Sub CPMK with query: ${JSON.stringify(query)}`);
    return this.repository.findAll(query);
  }

  async findOne(id: string) {
    this.logger.log(`Fetching Sub CPMK by id: ${id}`);
    const item = await this.repository.findById(id);

    if (!item) {
      throw new NotFoundException(`Sub CPMK with id '${id}' not found`);
    }

    return item;
  }

  async create(data: CreateSubCpmkDto) {
    this.logger.log(`Creating Sub CPMK with code: ${data.code}`);

    const cpmkExists = await this.repository.cpmkExists(data.cpmkId);
    if (!cpmkExists) {
      throw new BadRequestException(`CPMK with id '${data.cpmkId}' not found`);
    }

    const exists = await this.repository.existsByCodeAndCpmk(data.code, data.cpmkId);
    if (exists) {
      throw new ConflictException(
        `Sub CPMK with code '${data.code}' already exists for this CPMK`,
      );
    }

    const item = await this.repository.create(data);
    this.logger.log(`Sub CPMK created with id: ${item.id}`);
    return this.repository.mapToResponse(item);
  }

  async update(id: string, data: UpdateSubCpmkDto) {
    this.logger.log(`Updating Sub CPMK id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Sub CPMK with id '${id}' not found`);
    }

    if (data.cpmkId) {
      const cpmkExists = await this.repository.cpmkExists(data.cpmkId);
      if (!cpmkExists) {
        throw new BadRequestException(`CPMK with id '${data.cpmkId}' not found`);
      }
    }

    if (data.code && data.code !== existing.code) {
      const cpmkId = data.cpmkId ?? existing.cpmkId;
      const codeExists = await this.repository.existsByCodeAndCpmk(data.code, cpmkId);
      if (codeExists) {
        throw new ConflictException(
          `Sub CPMK with code '${data.code}' already exists for this CPMK`,
        );
      }
    }

    const item = await this.repository.update(id, data);
    this.logger.log(`Sub CPMK updated: ${item.id}`);
    return this.repository.mapToResponse(item);
  }

  async remove(id: string) {
    this.logger.log(`Deleting Sub CPMK id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Sub CPMK with id '${id}' not found`);
    }

    const item = await this.repository.remove(id);
    this.logger.log(`Sub CPMK deleted: ${item.id}`);
    return item;
  }
}
