import {
  Injectable, NotFoundException, ConflictException, BadRequestException, Logger,
} from '@nestjs/common';
import { StudentRepository } from './student.repository';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(private readonly repository: StudentRepository) {}

  async findAll(query: QueryStudentDto) {
    return this.repository.findAll(query);
  }

  async findOne(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundException(`Mahasiswa dengan id '${id}' tidak ditemukan`);
    return item;
  }

  async create(data: CreateStudentDto) {
    this.logger.log(`Creating Student: ${data.nim}`);

    const [nimExists, emailExists] = await Promise.all([
      this.repository.existsByNim(data.nim),
      data.email ? this.repository.existsByEmail(data.email) : Promise.resolve(false),
    ]);
    if (nimExists)   throw new ConflictException(`NIM '${data.nim}' sudah terdaftar`);
    if (emailExists) throw new ConflictException(`Email '${data.email}' sudah digunakan`);

    await this.validateRelations(data);

    const student = await this.repository.create(data);
    this.logger.log(`Student created: ${student.id}`);
    return this.repository.mapToResponse(student);
  }

  async update(id: string, data: UpdateStudentDto) {
    this.logger.log(`Updating Student: ${id}`);
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Mahasiswa dengan id '${id}' tidak ditemukan`);

    if (data.nim && data.nim !== existing.nim) {
      const exists = await this.repository.existsByNim(data.nim, id);
      if (exists) throw new ConflictException(`NIM '${data.nim}' sudah terdaftar`);
    }
    if (data.email && data.email !== existing.email) {
      const exists = await this.repository.existsByEmail(data.email, id);
      if (exists) throw new ConflictException(`Email '${data.email}' sudah digunakan`);
    }

    await this.validateRelations(data);

    const student = await this.repository.update(id, data);
    this.logger.log(`Student updated: ${student.id}`);
    return this.repository.mapToResponse(student);
  }

  async remove(id: string) {
    this.logger.log(`Deleting Student: ${id}`);
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Mahasiswa dengan id '${id}' tidak ditemukan`);
    const item = await this.repository.remove(id);
    this.logger.log(`Student deleted: ${item.id}`);
    return item;
  }

  async getTranscript(id: string) {
    const student = await this.repository.findById(id);
    if (!student) throw new NotFoundException(`Mahasiswa dengan id '${id}' tidak ditemukan`);
    return this.repository.getTranscript(id);
  }

  private async validateRelations(data: Partial<CreateStudentDto>) {
    if (data.facultyId) {
      const ok = await this.repository.facultyExists(data.facultyId);
      if (!ok) throw new BadRequestException(`Fakultas tidak ditemukan`);
    }
    if (data.studyProgramId) {
      const ok = await this.repository.studyProgramExists(data.studyProgramId);
      if (!ok) throw new BadRequestException(`Program Studi tidak ditemukan`);
    }
    if (data.curriculumId) {
      const ok = await this.repository.curriculumExists(data.curriculumId);
      if (!ok) throw new BadRequestException(`Kurikulum tidak ditemukan`);
    }
    if (data.academicSemesterId) {
      const ok = await this.repository.academicSemesterExists(data.academicSemesterId);
      if (!ok) throw new BadRequestException(`Semester tidak ditemukan`);
    }
  }
}
