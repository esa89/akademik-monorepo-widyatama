import type { AcademicClass, PaginatedResponse } from '@/types';
import { api } from './api';

export interface AcademicClassQuery {
  page?: number;
  limit?: number;
  search?: string;
  semesterId?: string;
  courseId?: string;
  lecturerId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AcademicClassPayload {
  semesterId: string;
  courseId: string;
  code: string;
  name: string;
  capacity: number;
  isActive?: boolean;
  lecturers: { lecturerId: string; role: string }[];
  studentIds?: string[];
}

export interface StudentGradePayload {
  nim: string;
  kehadiran?: number;
  uts?: number;
  uas?: number;
  quiz?: number;
  tugas?: number;
  nilaiAkhir?: number;
  grade?: string;
}

export const academicClassService = {
  getAll: (params: AcademicClassQuery) =>
    api.get<PaginatedResponse<AcademicClass>>('/academic-classes', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<{ data: AcademicClass }>(`/academic-classes/${id}`).then((r) => r.data),

  create: (data: AcademicClassPayload) =>
    api.post<{ data: AcademicClass }>('/academic-classes', data).then((r) => r.data),

  update: (id: string, data: Partial<AcademicClassPayload>) =>
    api.put<{ data: AcademicClass }>(`/academic-classes/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/academic-classes/${id}`).then((r) => r.data),

  importGrades: (classId: string, grades: StudentGradePayload[]) =>
    api.patch<{ updated: number; notFound: string[] }>(`/academic-classes/${classId}/grades`, { grades }).then((r) => r.data),
};
