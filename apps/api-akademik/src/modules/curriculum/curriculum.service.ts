import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CurriculumRepository } from './curriculum.repository';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';
import { QueryCurriculumDto } from './dto/query-curriculum.dto';

@Injectable()
export class CurriculumService {
  private readonly logger = new Logger(CurriculumService.name);

  constructor(private readonly repository: CurriculumRepository) {}

  async findAll(query: QueryCurriculumDto) {
    this.logger.log(`Fetching Curriculums with query: ${JSON.stringify(query)}`);
    return this.repository.findAll(query);
  }

  async findOne(id: string) {
    this.logger.log(`Fetching Curriculum by id: ${id}`);
    const item = await this.repository.findById(id);

    if (!item) {
      throw new NotFoundException(`Curriculum with id '${id}' not found`);
    }

    return item;
  }

  async create(data: CreateCurriculumDto) {
    this.logger.log(`Creating Curriculum with code: ${data.code}`);

    const studyProgramExists = await this.repository.studyProgramExists(data.studyProgramId);
    if (!studyProgramExists) {
      throw new BadRequestException(
        `Study Program with id '${data.studyProgramId}' not found`,
      );
    }

    const exists = await this.repository.existsByCode(data.code);
    if (exists) {
      throw new ConflictException(
        `Curriculum with code '${data.code}' already exists`,
      );
    }

    const item = await this.repository.create(data);
    this.logger.log(`Curriculum created with id: ${item.id}`);
    return this.repository.mapToResponse(item);
  }

  async update(id: string, data: UpdateCurriculumDto) {
    this.logger.log(`Updating Curriculum id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Curriculum with id '${id}' not found`);
    }

    if (data.studyProgramId) {
      const studyProgramExists = await this.repository.studyProgramExists(
        data.studyProgramId,
      );
      if (!studyProgramExists) {
        throw new BadRequestException(
          `Study Program with id '${data.studyProgramId}' not found`,
        );
      }
    }

    if (data.code && data.code !== existing.code) {
      const codeExists = await this.repository.existsByCode(data.code);
      if (codeExists) {
        throw new ConflictException(
          `Curriculum with code '${data.code}' already exists`,
        );
      }
    }

    const item = await this.repository.update(id, data);
    this.logger.log(`Curriculum updated: ${item.id}`);
    return this.repository.mapToResponse(item);
  }

  async remove(id: string) {
    this.logger.log(`Deleting Curriculum id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Curriculum with id '${id}' not found`);
    }

    const item = await this.repository.remove(id);
    this.logger.log(`Curriculum deleted: ${item.id}`);
    return item;
  }
}
