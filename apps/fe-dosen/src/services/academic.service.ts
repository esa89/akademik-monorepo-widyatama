import { akademikApi } from './api';
import type { PaginatedResponse, AcademicClass, AcademicClassDetail, AcademicSemester, Lecturer, CourseDetail } from '@/types';

export const lecturerService = {
  findByEmail: (email: string) =>
    akademikApi
      .get<PaginatedResponse<Lecturer>>('/lecturers', { params: { search: email, limit: 5 } })
      .then((r) => r.data),
};

export const semesterService = {
  getAll: () =>
    akademikApi
      .get<PaginatedResponse<AcademicSemester>>('/academic-semesters', { params: { limit: 100, sortBy: 'createdAt', sortOrder: 'desc' } })
      .then((r) => r.data),
};

export const courseService = {
  getById: (id: string) =>
    akademikApi
      .get<{ data: CourseDetail }>(`/courses/${id}`)
      .then((r) => r.data),
};

export const academicClassService = {
  getAll: (params: {
    lecturerId?: string;
    semesterId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) =>
    akademikApi
      .get<PaginatedResponse<AcademicClass>>('/academic-classes', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    akademikApi
      .get<{ data: AcademicClassDetail }>(`/academic-classes/${id}`)
      .then((r) => r.data),
};
