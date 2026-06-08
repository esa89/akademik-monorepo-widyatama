import type { AcademicSemester, PaginatedResponse } from '@/types';
import { api } from './api';

export interface AcademicSemesterQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  isCurrent?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const academicSemesterService = {
  getAll: (params: AcademicSemesterQuery) =>
    api.get<PaginatedResponse<AcademicSemester>>('/academic-semesters', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<AcademicSemester>(`/academic-semesters/${id}`).then((r) => r.data),

  create: (data: { code: string; name: string; academicYear: string; semesterType: string; startDate: string; endDate: string; isActive?: boolean; isCurrent?: boolean }) =>
    api.post<AcademicSemester>('/academic-semesters', data).then((r) => r.data),

  update: (id: string, data: Partial<{ code: string; name: string; academicYear: string; semesterType: string; startDate: string; endDate: string; isActive: boolean; isCurrent: boolean }>) =>
    api.put<AcademicSemester>(`/academic-semesters/${id}`, data).then((r) => r.data),

  setCurrent: (id: string) =>
    api.patch<AcademicSemester>(`/academic-semesters/${id}/set-current`).then((r) => r.data),

  remove: (id: string) =>
    api.delete<AcademicSemester>(`/academic-semesters/${id}`).then((r) => r.data),
};
