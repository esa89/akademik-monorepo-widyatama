import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { RubricRepository } from './rubric.repository';
import { CreateRubricDto } from './dto/create-rubric.dto';
import { UpdateRubricDto } from './dto/update-rubric.dto';
import { QueryRubricDto } from './dto/query-rubric.dto';

@Injectable()
export class RubricService {
  private readonly logger = new Logger(RubricService.name);

  constructor(private readonly repository: RubricRepository) {}

  async findAll(query: QueryRubricDto) {
    this.logger.log(`Fetching Rubrics with query: ${JSON.stringify(query)}`);
    return this.repository.findAll(query);
  }

  async findOne(id: string) {
    this.logger.log(`Fetching Rubric by id: ${id}`);
    const item = await this.repository.findById(id);

    if (!item) {
      throw new NotFoundException(`Rubric with id '${id}' not found`);
    }

    return item;
  }

  async create(data: CreateRubricDto) {
    this.logger.log(`Creating Rubric with code: ${data.code}`);

    const assessmentExists = await this.repository.assessmentExists(data.assessmentId);
    if (!assessmentExists) {
      throw new BadRequestException(`Assessment with id '${data.assessmentId}' not found`);
    }

    const exists = await this.repository.existsByCodeAndAssessment(data.code, data.assessmentId);
    if (exists) {
      throw new ConflictException(
        `Rubric with code '${data.code}' already exists for this Assessment`,
      );
    }

    const totalWeight = await this.repository.getTotalWeightByAssessment(data.assessmentId);
    if (totalWeight + data.weight > 100) {
      throw new BadRequestException(
        `Total rubric weight per Assessment cannot exceed 100. Current total: ${totalWeight}, new weight: ${data.weight}`,
      );
    }

    const item = await this.repository.create(data);
    this.logger.log(`Rubric created with id: ${item.id}`);
    return this.repository.mapToResponse(item);
  }

  async update(id: string, data: UpdateRubricDto) {
    this.logger.log(`Updating Rubric id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Rubric with id '${id}' not found`);
    }

    if (data.assessmentId) {
      const assessmentExists = await this.repository.assessmentExists(data.assessmentId);
      if (!assessmentExists) {
        throw new BadRequestException(`Assessment with id '${data.assessmentId}' not found`);
      }
    }

    if (data.code && data.code !== existing.code) {
      const assessmentId = data.assessmentId ?? existing.assessmentId;
      const codeExists = await this.repository.existsByCodeAndAssessment(data.code, assessmentId);
      if (codeExists) {
        throw new ConflictException(
          `Rubric with code '${data.code}' already exists for this Assessment`,
        );
      }
    }

    if (data.weight !== undefined) {
      const assessmentId = data.assessmentId ?? existing.assessmentId;
      const totalWeight = await this.repository.getTotalWeightByAssessmentExcluding(assessmentId, id);
      if (totalWeight + data.weight > 100) {
        throw new BadRequestException(
          `Total rubric weight per Assessment cannot exceed 100. Current total (excluding this): ${totalWeight}, new weight: ${data.weight}`,
        );
      }
    }

    const item = await this.repository.update(id, data);
    this.logger.log(`Rubric updated: ${item.id}`);
    return this.repository.mapToResponse(item);
  }

  async remove(id: string) {
    this.logger.log(`Deleting Rubric id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Rubric with id '${id}' not found`);
    }

    const item = await this.repository.remove(id);
    this.logger.log(`Rubric deleted: ${item.id}`);
    return item;
  }
}
