import { Injectable } from '@nestjs/common';
import { StudentCpmkScoreRepository } from './student-cpmk-score.repository';
import { BulkSaveStudentCpmkScoreDto } from './dto/bulk-save-student-cpmk-score.dto';

@Injectable()
export class StudentCpmkScoreService {
  constructor(private readonly repository: StudentCpmkScoreRepository) {}

  async findByClass(classId: string) {
    const data = await this.repository.findByClass(classId);
    return { data, meta: { total: data.length } };
  }

  async findByClassAndStudent(classId: string, studentId: string) {
    const data = await this.repository.findByClassAndStudent(classId, studentId);
    return { data, meta: { total: data.length } };
  }

  async bulkSave(dto: BulkSaveStudentCpmkScoreDto) {
    const saved = await this.repository.bulkSave(dto.classId, dto.courseId, dto.scores);
    return { classId: dto.classId, courseId: dto.courseId, saved };
  }

  async deleteByClass(classId: string) {
    const deleted = await this.repository.deleteByClass(classId);
    return { classId, deleted };
  }
}
