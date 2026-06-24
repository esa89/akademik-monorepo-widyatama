import { obeApi } from './api';
import type { CourseCpmkWeight, StudentCpmkScore, BulkSaveScoreRequest, CplCpmkMatrix } from '@/types';

export const courseCpmkWeightService = {
  getByCourse: (courseId: string) =>
    obeApi
      .get<{ data: CourseCpmkWeight[]; meta: { total: number } }>('/course-cpmk-weights', {
        params: { courseId },
      })
      .then((r) => r.data),
};

export const cplCpmkMappingService = {
  getMatrix: (curriculumId: string) =>
    obeApi
      .get<{ data: CplCpmkMatrix }>('/cpmk-cpl-mapping', { params: { curriculumId } })
      .then((r) => r.data),
};

export const cpmkCourseMappingService = {
  getMatrix: (curriculumId: string) =>
    obeApi
      .get('/cpmk-course-mapping/matrix', { params: { curriculumId } })
      .then((r) => r.data),
};

export const studentCpmkScoreService = {
  getByClass: (classId: string) =>
    obeApi
      .get<{ data: StudentCpmkScore[]; meta: { total: number } }>('/student-cpmk-scores', {
        params: { classId },
      })
      .then((r) => r.data),

  bulkSave: (data: BulkSaveScoreRequest) =>
    obeApi.post('/student-cpmk-scores/bulk', data).then((r) => r.data),

  deleteByClass: (classId: string) =>
    obeApi.delete(`/student-cpmk-scores/class/${classId}`).then((r) => r.data),
};
