import { Injectable } from '@nestjs/common';
import { CourseCpmkWeightRepository } from './course-cpmk-weight.repository';
import { BulkSaveCourseCpmkWeightDto } from './dto/bulk-save-course-cpmk-weight.dto';
import { QueryCourseCpmkWeightDto } from './dto/query-course-cpmk-weight.dto';

@Injectable()
export class CourseCpmkWeightService {
  constructor(private readonly repository: CourseCpmkWeightRepository) {}

  async findAll(query: QueryCourseCpmkWeightDto) {
    if (query.curriculumId) {
      const data = await this.repository.findByCurriculumId(query.curriculumId);
      return { data, meta: { total: data.length } };
    }
    if (query.courseId) {
      const data = await this.repository.findByCourseId(query.courseId);
      return { data, meta: { total: data.length } };
    }
    return { data: [], meta: { total: 0 } };
  }

  async bulkSave(dto: BulkSaveCourseCpmkWeightDto) {
    const saved = await this.repository.bulkSave(dto.courseId, dto.weights);
    return { courseId: dto.courseId, saved };
  }

  async deleteAllByCourse(courseId: string) {
    const deleted = await this.repository.deleteAllByCourse(courseId);
    return { courseId, deleted };
  }
}
