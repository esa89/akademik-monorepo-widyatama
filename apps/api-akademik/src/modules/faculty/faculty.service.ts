import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { FacultyRepository } from './faculty.repository';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { QueryFacultyDto } from './dto/query-faculty.dto';

@Injectable()
export class FacultyService {
  private readonly logger = new Logger(FacultyService.name);

  constructor(private readonly repository: FacultyRepository) {}

  async findAll(query: QueryFacultyDto) {
    this.logger.log(`Fetching Faculties with query: ${JSON.stringify(query)}`);
    return this.repository.findAll(query);
  }

  async findOne(id: string) {
    this.logger.log(`Fetching Faculty by id: ${id}`);
    const item = await this.repository.findById(id);

    if (!item) {
      throw new NotFoundException(`Faculty with id '${id}' not found`);
    }

    return item;
  }

  async create(data: CreateFacultyDto) {
    this.logger.log(`Creating Faculty with code: ${data.code}`);

    const exists = await this.repository.existsByCode(data.code);
    if (exists) {
      throw new ConflictException(
        `Faculty with code '${data.code}' already exists`,
      );
    }

    const item = await this.repository.create(data);
    this.logger.log(`Faculty created with id: ${item.id}`);
    return item;
  }

  async update(id: string, data: UpdateFacultyDto) {
    this.logger.log(`Updating Faculty id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Faculty with id '${id}' not found`);
    }

    if (data.code && data.code !== existing.code) {
      const codeExists = await this.repository.existsByCode(data.code);
      if (codeExists) {
        throw new ConflictException(
          `Faculty with code '${data.code}' already exists`,
        );
      }
    }

    const item = await this.repository.update(id, data);
    this.logger.log(`Faculty updated: ${item.id}`);
    return item;
  }

  async remove(id: string) {
    this.logger.log(`Deleting Faculty id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Faculty with id '${id}' not found`);
    }

    const item = await this.repository.remove(id);
    this.logger.log(`Faculty deleted: ${item.id}`);
    return item;
  }
}
