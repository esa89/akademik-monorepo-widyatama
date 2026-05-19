import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CourseRepository } from './course.repository';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';

@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name);

  constructor(private readonly repository: CourseRepository) {}

  async findAll(query: QueryCourseDto) {
    this.logger.log(`Fetching Courses with query: ${JSON.stringify(query)}`);
    return this.repository.findAll(query);
  }

  async findOne(id: string) {
    this.logger.log(`Fetching Course by id: ${id}`);
    const item = await this.repository.findById(id);

    if (!item) {
      throw new NotFoundException(`Course with id '${id}' not found`);
    }

    return item;
  }

  async create(data: CreateCourseDto) {
    this.logger.log(`Creating Course with code: ${data.code}`);

    const curriculumExists = await this.repository.curriculumExists(data.curriculumId);
    if (!curriculumExists) {
      throw new BadRequestException(
        `Curriculum with id '${data.curriculumId}' not found`,
      );
    }

    const exists = await this.repository.existsByCode(data.code);
    if (exists) {
      throw new ConflictException(
        `Course with code '${data.code}' already exists`,
      );
    }

    const item = await this.repository.create(data);
    this.logger.log(`Course created with id: ${item.id}`);
    return this.repository.mapToResponse(item);
  }

  async update(id: string, data: UpdateCourseDto) {
    this.logger.log(`Updating Course id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Course with id '${id}' not found`);
    }

    if (data.curriculumId) {
      const curriculumExists = await this.repository.curriculumExists(data.curriculumId);
      if (!curriculumExists) {
        throw new BadRequestException(
          `Curriculum with id '${data.curriculumId}' not found`,
        );
      }
    }

    if (data.code && data.code !== existing.code) {
      const codeExists = await this.repository.existsByCode(data.code);
      if (codeExists) {
        throw new ConflictException(
          `Course with code '${data.code}' already exists`,
        );
      }
    }

    const item = await this.repository.update(id, data);
    this.logger.log(`Course updated: ${item.id}`);
    return this.repository.mapToResponse(item);
  }

  async remove(id: string) {
    this.logger.log(`Deleting Course id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Course with id '${id}' not found`);
    }

    const item = await this.repository.remove(id);
    this.logger.log(`Course deleted: ${item.id}`);
    return item;
  }
}
