import { obeApi, akademikApi } from './api';
import type { PaginatedResponse, Cpl, Cpmk, CpmkDetail, SubCpmk, Assessment, Rubric, Course, GraduateProfile, ApiDetailResponse } from '@/types';

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
  mapCpl: (id: string, data: { cplId: string; weight: number }) => obeApi.post(`/cpmk/${id}/cpl`, data).then((r) => r.data),
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

// ─── GRADUATE PROFILE (Visi & Misi) ─────────────────────────────
export const graduateProfileService = {
  getAll: (params?: Record<string, unknown>) => obeApi.get<PaginatedResponse<GraduateProfile>>('/graduate-profiles', { params }).then((r) => r.data),
  getById: (id: string) => obeApi.get<ApiDetailResponse<GraduateProfile>>(`/graduate-profiles/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => obeApi.post<ApiDetailResponse<GraduateProfile>>('/graduate-profiles', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) => obeApi.put<ApiDetailResponse<GraduateProfile>>(`/graduate-profiles/${id}`, data).then((r) => r.data),
  remove: (id: string) => obeApi.delete(`/graduate-profiles/${id}`).then((r) => r.data),
};
