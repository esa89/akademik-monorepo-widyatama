import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { BodyOfKnowledgeRepository } from './body-of-knowledge.repository';
import { CreateBodyOfKnowledgeDto } from './dto/create-body-of-knowledge.dto';
import { UpdateBodyOfKnowledgeDto } from './dto/update-body-of-knowledge.dto';
import { QueryBodyOfKnowledgeDto } from './dto/query-body-of-knowledge.dto';

@Injectable()
export class BodyOfKnowledgeService {
  private readonly logger = new Logger(BodyOfKnowledgeService.name);

  constructor(private readonly bodyOfKnowledgeRepository: BodyOfKnowledgeRepository) {}

  async findAll(query: QueryBodyOfKnowledgeDto) {
    this.logger.log(`Fetching Body of Knowledge list with query: ${JSON.stringify(query)}`);
    return this.bodyOfKnowledgeRepository.findAll(query);
  }

  async findOne(id: string) {
    this.logger.log(`Fetching Body of Knowledge by id: ${id}`);
    const item = await this.bodyOfKnowledgeRepository.findById(id);

    if (!item) {
      throw new NotFoundException(`Body of Knowledge with id '${id}' not found`);
    }

    return item;
  }

  async create(data: CreateBodyOfKnowledgeDto) {
    this.logger.log(`Creating Body of Knowledge with code: ${data.code} for curriculum: ${data.curriculumId}`);

    const existing = await this.bodyOfKnowledgeRepository.findByCodeAndCurriculum(data.code, data.curriculumId);
    if (existing) {
      throw new ConflictException(
        `Body of Knowledge with code '${data.code}' already exists in this curriculum`,
      );
    }

    const item = await this.bodyOfKnowledgeRepository.create(data);
    this.logger.log(`Body of Knowledge created with id: ${item.id}`);
    return item;
  }

  async update(id: string, data: UpdateBodyOfKnowledgeDto) {
    this.logger.log(`Updating Body of Knowledge id: ${id}`);

    const existing = await this.bodyOfKnowledgeRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Body of Knowledge with id '${id}' not found`);
    }

    const targetCurriculumId = data.curriculumId ?? existing.curriculumId;
    const targetCode = data.code ?? existing.code;

    if (
      (data.code && data.code !== existing.code) ||
      (data.curriculumId && data.curriculumId !== existing.curriculumId)
    ) {
      const codeExists = await this.bodyOfKnowledgeRepository.findByCodeAndCurriculum(
        targetCode,
        targetCurriculumId,
      );
      if (codeExists && codeExists.id !== id) {
        throw new ConflictException(
          `Body of Knowledge with code '${targetCode}' already exists in this curriculum`,
        );
      }
    }

    const item = await this.bodyOfKnowledgeRepository.update(id, data);
    this.logger.log(`Body of Knowledge updated: ${item.id}`);
    return item;
  }

  async remove(id: string) {
    this.logger.log(`Deleting Body of Knowledge id: ${id}`);

    const existing = await this.bodyOfKnowledgeRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Body of Knowledge with id '${id}' not found`);
    }

    const item = await this.bodyOfKnowledgeRepository.remove(id);
    this.logger.log(`Body of Knowledge deleted: ${item.id}`);
    return item;
  }
}
