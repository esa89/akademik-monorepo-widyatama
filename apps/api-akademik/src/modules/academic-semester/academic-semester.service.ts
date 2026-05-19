import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AcademicSemesterRepository } from './academic-semester.repository';
import { CreateAcademicSemesterDto } from './dto/create-academic-semester.dto';
import { UpdateAcademicSemesterDto } from './dto/update-academic-semester.dto';
import { QueryAcademicSemesterDto } from './dto/query-academic-semester.dto';

@Injectable()
export class AcademicSemesterService {
  private readonly logger = new Logger(AcademicSemesterService.name);

  constructor(private readonly repository: AcademicSemesterRepository) {}

  private validateDates(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new BadRequestException('startDate must be before endDate');
    }
  }

  async findAll(query: QueryAcademicSemesterDto) {
    this.logger.log(`Fetching Academic Semesters with query: ${JSON.stringify(query)}`);
    return this.repository.findAll(query);
  }

  async findOne(id: string) {
    this.logger.log(`Fetching Academic Semester by id: ${id}`);
    const item = await this.repository.findById(id);

    if (!item) {
      throw new NotFoundException(`Academic Semester with id '${id}' not found`);
    }

    return item;
  }

  async create(data: CreateAcademicSemesterDto) {
    this.logger.log(`Creating Academic Semester with code: ${data.code}`);

    this.validateDates(data.startDate, data.endDate);

    const exists = await this.repository.existsByCode(data.code);
    if (exists) {
      throw new ConflictException(
        `Academic Semester with code '${data.code}' already exists`,
      );
    }

    const item = await this.repository.create(data);
    this.logger.log(`Academic Semester created with id: ${item.id}`);
    return this.repository.mapToResponse(item);
  }

  async update(id: string, data: UpdateAcademicSemesterDto) {
    this.logger.log(`Updating Academic Semester id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Academic Semester with id '${id}' not found`);
    }

    if (data.code && data.code !== existing.code) {
      const codeExists = await this.repository.existsByCode(data.code);
      if (codeExists) {
        throw new ConflictException(
          `Academic Semester with code '${data.code}' already exists`,
        );
      }
    }

    const startDate = data.startDate ?? existing.startDate.toISOString().split('T')[0];
    const endDate = data.endDate ?? existing.endDate.toISOString().split('T')[0];
    this.validateDates(startDate, endDate);

    const item = await this.repository.update(id, data);
    this.logger.log(`Academic Semester updated: ${item.id}`);
    return this.repository.mapToResponse(item);
  }

  async remove(id: string) {
    this.logger.log(`Deleting Academic Semester id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Academic Semester with id '${id}' not found`);
    }

    const item = await this.repository.remove(id);
    this.logger.log(`Academic Semester deleted: ${item.id}`);
    return item;
  }

  async setCurrent(id: string) {
    this.logger.log(`Setting Academic Semester ${id} as current`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Academic Semester with id '${id}' not found`);
    }

    const item = await this.repository.setCurrent(id);
    this.logger.log(`Academic Semester ${id} is now current`);
    return this.repository.mapToResponse(item);
  }
}
