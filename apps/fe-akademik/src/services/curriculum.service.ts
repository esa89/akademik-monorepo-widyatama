import type { Curriculum, PaginatedResponse } from '@/types';
import { api } from './api';

export interface CurriculumQuery {
  page?: number;
  limit?: number;
  search?: string;
  studyProgramId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const curriculumService = {
  getAll: (params: CurriculumQuery) =>
    api.get<PaginatedResponse<Curriculum>>('/curriculums', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Curriculum>(`/curriculums/${id}`).then((r) => r.data),

  create: (data: { studyProgramId: string; code: string; name: string; description?: string; year: number; totalSemester: number; totalSks: number }) =>
    api.post<Curriculum>('/curriculums', data).then((r) => r.data),

  update: (id: string, data: Partial<{ studyProgramId: string; code: string; name: string; description: string; year: number; totalSemester: number; totalSks: number; isActive: boolean }>) =>
    api.put<Curriculum>(`/curriculums/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete<Curriculum>(`/curriculums/${id}`).then((r) => r.data),
};
