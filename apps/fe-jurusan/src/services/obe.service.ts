import { obeApi, akademikApi } from './api';
import type { PaginatedResponse, Cpl, Cpmk, CpmkDetail, SubCpmk, Assessment, Rubric, Course, GraduateProfile, VisiMisi, Curriculum, ApiDetailResponse, CplProfileMatrix, MappingPair, BodyOfKnowledge, CplBkMatrix, CplBkMappingPair, BkCourseMatrix, BkCourseMappingPair, CpmkCplMkMatrix, CplCpmkMatrix, CplCpmkMappingPair, AssessmentComponent, CourseCpmkWeight, BulkSaveWeightRequest } from '@/types';

// ─── CPL ────────────────────────────────────────────────────────
export const cplService = {
  getAll: (params?: Record<string, unknown>) => obeApi.get<PaginatedResponse<Cpl>>('/cpl', { params }).then((r) => r.data),
  getById: (id: string) => obeApi.get<ApiDetailResponse<Cpl>>(`/cpl/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => obeApi.post<ApiDetailResponse<Cpl>>('/cpl', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) => obeApi.put<ApiDetailResponse<Cpl>>(`/cpl/${id}`, data).then((r) => r.data),
  remove: (id: string) => obeApi.delete(`/cpl/${id}`).then((r) => r.data),
};

// ─── CPMK ───────────────────────────────────────────────────────
export const cpmkService = {
  getAll: (params?: Record<string, unknown>) => obeApi.get<PaginatedResponse<Cpmk>>('/cpmk', { params }).then((r) => r.data),
  getById: (id: string) => obeApi.get<ApiDetailResponse<CpmkDetail>>(`/cpmk/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => obeApi.post<ApiDetailResponse<Cpmk>>('/cpmk', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) => obeApi.put<ApiDetailResponse<Cpmk>>(`/cpmk/${id}`, data).then((r) => r.data),
  remove: (id: string) => obeApi.delete(`/cpmk/${id}`).then((r) => r.data),
  mapCpl: (id: string, cpls: { cplId: string; weight: number }[]) => obeApi.post(`/cpmk/${id}/cpl`, { cpls }).then((r) => r.data),
};

// ─── SUB CPMK ───────────────────────────────────────────────────
export const subCpmkService = {
  getAll: (params?: Record<string, unknown>) => obeApi.get<PaginatedResponse<SubCpmk>>('/sub-cpmk', { params }).then((r) => r.data),
  getById: (id: string) => obeApi.get<ApiDetailResponse<SubCpmk>>(`/sub-cpmk/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => obeApi.post<ApiDetailResponse<SubCpmk>>('/sub-cpmk', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) => obeApi.put<ApiDetailResponse<SubCpmk>>(`/sub-cpmk/${id}`, data).then((r) => r.data),
  remove: (id: string) => obeApi.delete(`/sub-cpmk/${id}`).then((r) => r.data),
};

// ─── ASSESSMENT ─────────────────────────────────────────────────
export const assessmentService = {
  getAll: (params?: Record<string, unknown>) => obeApi.get<PaginatedResponse<Assessment>>('/assessments', { params }).then((r) => r.data),
  getById: (id: string) => obeApi.get<ApiDetailResponse<Assessment>>(`/assessments/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => obeApi.post<ApiDetailResponse<Assessment>>('/assessments', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) => obeApi.put<ApiDetailResponse<Assessment>>(`/assessments/${id}`, data).then((r) => r.data),
  remove: (id: string) => obeApi.delete(`/assessments/${id}`).then((r) => r.data),
};

// ─── RUBRIC ─────────────────────────────────────────────────────
export const rubricService = {
  getAll: (params?: Record<string, unknown>) => obeApi.get<PaginatedResponse<Rubric>>('/rubrics', { params }).then((r) => r.data),
  getById: (id: string) => obeApi.get<ApiDetailResponse<Rubric>>(`/rubrics/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => obeApi.post<ApiDetailResponse<Rubric>>('/rubrics', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) => obeApi.put<ApiDetailResponse<Rubric>>(`/rubrics/${id}`, data).then((r) => r.data),
  remove: (id: string) => obeApi.delete(`/rubrics/${id}`).then((r) => r.data),
};

// ─── COURSES (from api-akademik) ────────────────────────────────
export const courseService = {
  getAll: (params?: Record<string, unknown>) => akademikApi.get<PaginatedResponse<Course>>('/courses', { params }).then((r) => r.data),
};

// ─── CURRICULUM (from api-akademik) ─────────────────────────────
export const curriculumService = {
  getAll: (params?: Record<string, unknown>) => akademikApi.get<PaginatedResponse<Curriculum>>('/curriculums', { params }).then((r) => r.data),
  getById: (id: string) => akademikApi.get<ApiDetailResponse<Curriculum>>(`/curriculums/${id}`).then((r) => r.data),
};

// ─── VISI MISI ──────────────────────────────────────────────────
export const visiMisiService = {
  getAll: (params?: Record<string, unknown>) => obeApi.get<PaginatedResponse<VisiMisi>>('/visi-misi', { params }).then((r) => r.data),
  getById: (id: string) => obeApi.get<ApiDetailResponse<VisiMisi>>(`/visi-misi/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => obeApi.post<ApiDetailResponse<VisiMisi>>('/visi-misi', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) => obeApi.put<ApiDetailResponse<VisiMisi>>(`/visi-misi/${id}`, data).then((r) => r.data),
  remove: (id: string) => obeApi.delete(`/visi-misi/${id}`).then((r) => r.data),
};

// ─── GRADUATE PROFILE (Profil Lulusan) ──────────────────────────
export const graduateProfileService = {
  getAll: (params?: Record<string, unknown>) => obeApi.get<PaginatedResponse<GraduateProfile>>('/graduate-profiles', { params }).then((r) => r.data),
  getById: (id: string) => obeApi.get<ApiDetailResponse<GraduateProfile>>(`/graduate-profiles/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => obeApi.post<ApiDetailResponse<GraduateProfile>>('/graduate-profiles', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) => obeApi.put<ApiDetailResponse<GraduateProfile>>(`/graduate-profiles/${id}`, data).then((r) => r.data),
  remove: (id: string) => obeApi.delete(`/graduate-profiles/${id}`).then((r) => r.data),
};

// ─── BODY OF KNOWLEDGE ──────────────────────────────────────────
export const bodyOfKnowledgeService = {
  getAll: (params?: Record<string, unknown>) => obeApi.get<PaginatedResponse<BodyOfKnowledge>>('/body-of-knowledges', { params }).then((r) => r.data),
  getById: (id: string) => obeApi.get<ApiDetailResponse<BodyOfKnowledge>>(`/body-of-knowledges/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => obeApi.post<ApiDetailResponse<BodyOfKnowledge>>('/body-of-knowledges', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) => obeApi.put<ApiDetailResponse<BodyOfKnowledge>>(`/body-of-knowledges/${id}`, data).then((r) => r.data),
  remove: (id: string) => obeApi.delete(`/body-of-knowledges/${id}`).then((r) => r.data),
};

// ─── CPL-PROFILE MAPPING ─────────────────────────────────────────
export const cplProfileMappingService = {
  getMatrix: (params: { curriculumId: string; curriculumYear?: number }) =>
    obeApi.get<ApiDetailResponse<CplProfileMatrix>>('/cpl-profile-mapping', { params }).then((r) => r.data),
  saveMappings: (data: { curriculumId: string; mappings: MappingPair[] }) =>
    obeApi.post<ApiDetailResponse<{ count: number }>>('/cpl-profile-mapping', data).then((r) => r.data),
};

// ─── CPL-BK MAPPING ──────────────────────────────────────────────
export const cplBkMappingService = {
  getMatrix: (params: { curriculumId: string; curriculumYear?: number }) =>
    obeApi.get<ApiDetailResponse<CplBkMatrix>>('/cpl-bk-mapping', { params }).then((r) => r.data),
  saveMappings: (data: { curriculumId: string; mappings: CplBkMappingPair[] }) =>
    obeApi.post<ApiDetailResponse<{ count: number }>>('/cpl-bk-mapping', data).then((r) => r.data),
};

// ─── BK-COURSE MAPPING ───────────────────────────────────────────
export const bkCourseMappingService = {
  getMatrix: (params: { curriculumId: string }) =>
    obeApi.get<ApiDetailResponse<BkCourseMatrix>>('/bk-course-mapping', { params }).then((r) => r.data),
  saveMappings: (data: { curriculumId: string; mappings: BkCourseMappingPair[] }) =>
    obeApi.post<ApiDetailResponse<{ count: number }>>('/bk-course-mapping', data).then((r) => r.data),
};

// ─── CPMK-CPL MAPPING ────────────────────────────────────────────
export const cpmkCplMappingService = {
  getMatrix: (params: { curriculumId: string; curriculumYear?: number }) =>
    obeApi.get<ApiDetailResponse<CplCpmkMatrix>>('/cpmk-cpl-mapping', { params }).then((r) => r.data),
  saveMappings: (data: { curriculumId: string; mappings: CplCpmkMappingPair[] }) =>
    obeApi.post<ApiDetailResponse<{ count: number }>>('/cpmk-cpl-mapping', data).then((r) => r.data),
};

// ─── ASSESSMENT COMPONENT ────────────────────────────────────────
export const assessmentComponentService = {
  getAll: (params?: Record<string, unknown>) =>
    obeApi.get<PaginatedResponse<AssessmentComponent>>('/assessment-components', { params }).then((r) => r.data),
  getById: (id: string) =>
    obeApi.get<ApiDetailResponse<AssessmentComponent>>(`/assessment-components/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    obeApi.post<ApiDetailResponse<AssessmentComponent>>('/assessment-components', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    obeApi.put<ApiDetailResponse<AssessmentComponent>>(`/assessment-components/${id}`, data).then((r) => r.data),
  remove: (id: string) =>
    obeApi.delete(`/assessment-components/${id}`).then((r) => r.data),
};

// ─── CPMK-COURSE MAPPING ─────────────────────────────────────────
export const cpmkCourseMappingService = {
  getMatrix: (params: { curriculumId: string; curriculumYear?: number }) =>
    obeApi.get<ApiDetailResponse<CpmkCplMkMatrix>>('/cpmk-course-mapping/matrix', { params }).then((r) => r.data),
  saveMappings: (data: { cpmkId: string; courseIds: string[] }) =>
    obeApi.post('/cpmk-course-mapping', data).then((r) => r.data),
};

// ─── COURSE CPMK WEIGHT ──────────────────────────────────────────
export const courseCpmkWeightService = {
  getAll: (params: { courseId?: string; curriculumId?: string }) =>
    obeApi.get<{ data: CourseCpmkWeight[]; meta: { total: number } }>('/course-cpmk-weights', { params }).then((r) => r.data),
  bulkSave: (data: BulkSaveWeightRequest) =>
    obeApi.post<ApiDetailResponse<{ courseId: string; saved: number }>>('/course-cpmk-weights/bulk', data).then((r) => r.data),
  deleteAllByCourse: (courseId: string) =>
    obeApi.delete(`/course-cpmk-weights/course/${courseId}`).then((r) => r.data),
};
