import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AssessmentRepository } from './assessment.repository';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { QueryAssessmentDto } from './dto/query-assessment.dto';

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);

  constructor(private readonly repository: AssessmentRepository) {}

  async findAll(query: QueryAssessmentDto) {
    this.logger.log(`Fetching Assessments with query: ${JSON.stringify(query)}`);
    return this.repository.findAll(query);
  }

  async findOne(id: string) {
    this.logger.log(`Fetching Assessment by id: ${id}`);
    const item = await this.repository.findById(id);

    if (!item) {
      throw new NotFoundException(`Assessment with id '${id}' not found`);
    }

    return item;
  }

  async create(data: CreateAssessmentDto) {
    this.logger.log(`Creating Assessment with code: ${data.code}`);

    const subCpmkExists = await this.repository.subCpmkExists(data.subCpmkId);
    if (!subCpmkExists) {
      throw new BadRequestException(`Sub CPMK with id '${data.subCpmkId}' not found`);
    }

    const exists = await this.repository.existsByCodeAndSubCpmk(data.code, data.subCpmkId);
    if (exists) {
      throw new ConflictException(
        `Assessment with code '${data.code}' already exists for this Sub CPMK`,
      );
    }

    const totalWeight = await this.repository.getTotalWeightBySubCpmk(data.subCpmkId);
    if (totalWeight + data.weight > 100) {
      throw new BadRequestException(
        `Total assessment weight per Sub CPMK cannot exceed 100. Current total: ${totalWeight}, new weight: ${data.weight}`,
      );
    }

    const item = await this.repository.create(data);
    this.logger.log(`Assessment created with id: ${item.id}`);
    return this.repository.mapToResponse(item);
  }

  async update(id: string, data: UpdateAssessmentDto) {
    this.logger.log(`Updating Assessment id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Assessment with id '${id}' not found`);
    }

    if (data.subCpmkId) {
      const subCpmkExists = await this.repository.subCpmkExists(data.subCpmkId);
      if (!subCpmkExists) {
        throw new BadRequestException(`Sub CPMK with id '${data.subCpmkId}' not found`);
      }
    }

    if (data.code && data.code !== existing.code) {
      const subCpmkId = data.subCpmkId ?? existing.subCpmkId;
      const codeExists = await this.repository.existsByCodeAndSubCpmk(data.code, subCpmkId);
      if (codeExists) {
        throw new ConflictException(
          `Assessment with code '${data.code}' already exists for this Sub CPMK`,
        );
      }
    }

    if (data.weight !== undefined) {
      const subCpmkId = data.subCpmkId ?? existing.subCpmkId;
      const totalWeight = await this.repository.getTotalWeightBySubCpmkExcluding(subCpmkId, id);
      if (totalWeight + data.weight > 100) {
        throw new BadRequestException(
          `Total assessment weight per Sub CPMK cannot exceed 100. Current total (excluding this): ${totalWeight}, new weight: ${data.weight}`,
        );
      }
    }

    const item = await this.repository.update(id, data);
    this.logger.log(`Assessment updated: ${item.id}`);
    return this.repository.mapToResponse(item);
  }

  async remove(id: string) {
    this.logger.log(`Deleting Assessment id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Assessment with id '${id}' not found`);
    }

    const item = await this.repository.remove(id);
    this.logger.log(`Assessment deleted: ${item.id}`);
    return item;
  }
}
