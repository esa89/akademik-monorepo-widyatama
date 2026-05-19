import type { Faculty, PaginatedResponse } from '@/types';
import { api } from './api';

export interface FacultyQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const facultyService = {
  getAll: (params: FacultyQuery) =>
    api.get<PaginatedResponse<Faculty>>('/faculties', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Faculty>(`/faculties/${id}`).then((r) => r.data),

  create: (data: { code: string; name: string; description?: string }) =>
    api.post<Faculty>('/faculties', data).then((r) => r.data),

  update: (id: string, data: { code?: string; name?: string; description?: string; isActive?: boolean }) =>
    api.put<Faculty>(`/faculties/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete<Faculty>(`/faculties/${id}`).then((r) => r.data),
};
