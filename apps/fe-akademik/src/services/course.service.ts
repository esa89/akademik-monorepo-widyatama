import type { Course, PaginatedResponse } from '@/types';
import { api } from './api';

export interface CourseQuery {
  page?: number;
  limit?: number;
  search?: string;
  curriculumId?: string;
  semester?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const courseService = {
  getAll: (params: CourseQuery) =>
    api.get<PaginatedResponse<Course>>('/courses', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Course>(`/courses/${id}`).then((r) => r.data),

  create: (data: { curriculumId?: string; facultyId?: string; code: string; name: string; description?: string; sks: number; semester: number }) =>
    api.post<Course>('/courses', data).then((r) => r.data),

  update: (id: string, data: Partial<{ curriculumId: string; facultyId: string; code: string; name: string; description: string; sks: number; semester: number; isActive: boolean }>) =>
    api.put<Course>(`/courses/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete<Course>(`/courses/${id}`).then((r) => r.data),
};
