import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AcademicClassRepository } from './academic-class.repository';
import { CreateAcademicClassDto } from './dto/create-academic-class.dto';
import { UpdateAcademicClassDto } from './dto/update-academic-class.dto';
import { QueryAcademicClassDto } from './dto/query-academic-class.dto';
import { ImportGradesDto } from './dto/import-grades.dto';

@Injectable()
export class AcademicClassService {
  private readonly logger = new Logger(AcademicClassService.name);

  constructor(private readonly repository: AcademicClassRepository) {}

  async findAll(query: QueryAcademicClassDto) {
    return this.repository.findAll(query);
  }

  async findOne(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundException(`AcademicClass with id '${id}' not found`);
    return item;
  }

  async create(data: CreateAcademicClassDto) {
    this.logger.log(`Creating AcademicClass with code: ${data.code}`);

    // Validate semester exists
    const semesterOk = await this.repository.semesterExists(data.semesterId);
    if (!semesterOk) {
      throw new BadRequestException(`AcademicSemester with id '${data.semesterId}' not found`);
    }

    // Validate course exists
    const courseOk = await this.repository.courseExists(data.courseId);
    if (!courseOk) {
      throw new BadRequestException(`Course with id '${data.courseId}' not found`);
    }

    // Check code uniqueness within semester
    const codeExists = await this.repository.existsByCode(data.semesterId, data.code);
    if (codeExists) {
      throw new ConflictException(`AcademicClass with code '${data.code}' already exists in this semester`);
    }

    // Validate all lecturers exist
    for (const l of data.lecturers) {
      const lecturerOk = await this.repository.lecturerExists(l.lecturerId);
      if (!lecturerOk) {
        throw new BadRequestException(`Lecturer with id '${l.lecturerId}' not found`);
      }
    }

    // Validate all students exist
    if (data.studentIds && data.studentIds.length > 0) {
      for (const sid of data.studentIds) {
        const studentOk = await this.repository.studentExists(sid);
        if (!studentOk) {
          throw new BadRequestException(`Student with id '${sid}' not found`);
        }
      }

      // Check capacity
      const capacity = data.capacity ?? 40;
      if (data.studentIds.length > capacity) {
        throw new BadRequestException(
          `Number of students (${data.studentIds.length}) exceeds class capacity (${capacity})`,
        );
      }
    }

    const item = await this.repository.create(data);
    this.logger.log(`AcademicClass created with id: ${item.id}`);
    return item;
  }

  async update(id: string, data: UpdateAcademicClassDto) {
    this.logger.log(`Updating AcademicClass id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`AcademicClass with id '${id}' not found`);

    // Validate semester if changing
    if (data.semesterId && data.semesterId !== existing.semesterId) {
      const semesterOk = await this.repository.semesterExists(data.semesterId);
      if (!semesterOk) {
        throw new BadRequestException(`AcademicSemester with id '${data.semesterId}' not found`);
      }
    }

    // Validate course if changing
    if (data.courseId && data.courseId !== existing.courseId) {
      const courseOk = await this.repository.courseExists(data.courseId);
      if (!courseOk) {
        throw new BadRequestException(`Course with id '${data.courseId}' not found`);
      }
    }

    // Check code uniqueness within semester if changing
    const effectiveSemesterId = data.semesterId ?? existing.semesterId;
    if (data.code && data.code !== existing.code) {
      const codeExists = await this.repository.existsByCode(effectiveSemesterId, data.code, id);
      if (codeExists) {
        throw new ConflictException(
          `AcademicClass with code '${data.code}' already exists in this semester`,
        );
      }
    }

    // Validate lecturers if provided
    if (data.lecturers && data.lecturers.length > 0) {
      for (const l of data.lecturers) {
        const lecturerOk = await this.repository.lecturerExists(l.lecturerId);
        if (!lecturerOk) {
          throw new BadRequestException(`Lecturer with id '${l.lecturerId}' not found`);
        }
      }
    }

    // Validate students and capacity if provided
    if (data.studentIds !== undefined) {
      for (const sid of data.studentIds) {
        const studentOk = await this.repository.studentExists(sid);
        if (!studentOk) {
          throw new BadRequestException(`Student with id '${sid}' not found`);
        }
      }

      const effectiveCapacity = data.capacity ?? existing.capacity;
      if (data.studentIds.length > effectiveCapacity) {
        throw new BadRequestException(
          `Number of students (${data.studentIds.length}) exceeds class capacity (${effectiveCapacity})`,
        );
      }
    }

    const item = await this.repository.update(id, data);
    this.logger.log(`AcademicClass updated: ${item.id}`);
    return item;
  }

  async remove(id: string) {
    this.logger.log(`Deleting AcademicClass id: ${id}`);
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`AcademicClass with id '${id}' not found`);
    const item = await this.repository.remove(id);
    this.logger.log(`AcademicClass deleted: ${item.id}`);
    return item;
  }

  async importGrades(classId: string, dto: ImportGradesDto) {
    this.logger.log(`Importing grades for class ${classId}: ${dto.grades.length} records`);

    const existing = await this.repository.findById(classId);
    if (!existing) throw new NotFoundException(`AcademicClass with id '${classId}' not found`);

    const result = await this.repository.bulkUpsertGrades(classId, dto.grades);
    this.logger.log(`Grade import done: ${result.updated} updated, ${result.notFound.length} not found`);
    return result;
  }
}
