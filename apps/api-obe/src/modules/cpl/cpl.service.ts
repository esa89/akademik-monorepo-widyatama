import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { CplRepository } from './cpl.repository';
import { CreateCplDto } from './dto/create-cpl.dto';
import { UpdateCplDto } from './dto/update-cpl.dto';
import { QueryCplDto } from './dto/query-cpl.dto';

@Injectable()
export class CplService {
  private readonly logger = new Logger(CplService.name);

  constructor(private readonly cplRepository: CplRepository) {}

  async findAll(query: QueryCplDto) {
    this.logger.log(`Fetching CPL list with query: ${JSON.stringify(query)}`);
    return this.cplRepository.findAll(query);
  }

  async findOne(id: string) {
    this.logger.log(`Fetching CPL by id: ${id}`);
    const cpl = await this.cplRepository.findById(id);

    if (!cpl) {
      throw new NotFoundException(`CPL with id '${id}' not found`);
    }

    return cpl;
  }

  async create(data: CreateCplDto) {
    this.logger.log(`Creating CPL with code: ${data.code}`);

    const existing = await this.cplRepository.findByCode(data.code);
    if (existing) {
      throw new ConflictException(
        `CPL with code '${data.code}' already exists`,
      );
    }

    const cpl = await this.cplRepository.create(data);
    this.logger.log(`CPL created with id: ${cpl.id}`);
    return cpl;
  }

  async update(id: string, data: UpdateCplDto) {
    this.logger.log(`Updating CPL id: ${id}`);

    const existing = await this.cplRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`CPL with id '${id}' not found`);
    }

    if (data.code && data.code !== existing.code) {
      const codeExists = await this.cplRepository.findByCode(data.code);
      if (codeExists) {
        throw new ConflictException(
          `CPL with code '${data.code}' already exists`,
        );
      }
    }

    const cpl = await this.cplRepository.update(id, data);
    this.logger.log(`CPL updated: ${cpl.id}`);
    return cpl;
  }

  async remove(id: string) {
    this.logger.log(`Deleting CPL id: ${id}`);

    const existing = await this.cplRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`CPL with id '${id}' not found`);
    }

    const cpl = await this.cplRepository.remove(id);
    this.logger.log(`CPL deleted: ${cpl.id}`);
    return cpl;
  }
}
