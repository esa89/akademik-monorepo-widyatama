import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { StudyProgramRepository } from './study-program.repository';
import { CreateStudyProgramDto } from './dto/create-study-program.dto';
import { UpdateStudyProgramDto } from './dto/update-study-program.dto';
import { QueryStudyProgramDto } from './dto/query-study-program.dto';

@Injectable()
export class StudyProgramService {
  private readonly logger = new Logger(StudyProgramService.name);

  constructor(private readonly repository: StudyProgramRepository) {}

  async findAll(query: QueryStudyProgramDto) {
    this.logger.log(`Fetching Study Programs with query: ${JSON.stringify(query)}`);
    return this.repository.findAll(query);
  }

  async findOne(id: string) {
    this.logger.log(`Fetching Study Program by id: ${id}`);
    const item = await this.repository.findById(id);

    if (!item) {
      throw new NotFoundException(`Study Program with id '${id}' not found`);
    }

    return item;
  }

  async create(data: CreateStudyProgramDto) {
    this.logger.log(`Creating Study Program with code: ${data.code}`);

    const facultyExists = await this.repository.facultyExists(data.facultyId);
    if (!facultyExists) {
      throw new BadRequestException(`Faculty with id '${data.facultyId}' not found`);
    }

    const exists = await this.repository.existsByCode(data.code);
    if (exists) {
      throw new ConflictException(
        `Study Program with code '${data.code}' already exists`,
      );
    }

    const item = await this.repository.create(data);
    this.logger.log(`Study Program created with id: ${item.id}`);
    return this.repository.mapToResponse(item);
  }

  async update(id: string, data: UpdateStudyProgramDto) {
    this.logger.log(`Updating Study Program id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Study Program with id '${id}' not found`);
    }

    if (data.facultyId) {
      const facultyExists = await this.repository.facultyExists(data.facultyId);
      if (!facultyExists) {
        throw new BadRequestException(`Faculty with id '${data.facultyId}' not found`);
      }
    }

    if (data.code && data.code !== existing.code) {
      const codeExists = await this.repository.existsByCode(data.code);
      if (codeExists) {
        throw new ConflictException(
          `Study Program with code '${data.code}' already exists`,
        );
      }
    }

    const item = await this.repository.update(id, data);
    this.logger.log(`Study Program updated: ${item.id}`);
    return this.repository.mapToResponse(item);
  }

  async remove(id: string) {
    this.logger.log(`Deleting Study Program id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Study Program with id '${id}' not found`);
    }

    const item = await this.repository.remove(id);
    this.logger.log(`Study Program deleted: ${item.id}`);
    return item;
  }
}
