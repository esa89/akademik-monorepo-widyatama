import type { Student, PaginatedResponse } from '@/types';
import { api } from './api';

export interface StudentQuery {
  page?: number;
  limit?: number;
  search?: string;
  facultyId?: string;
  studyProgramId?: string;
  curriculumId?: string;
  entryYear?: number;
  studentStatus?: string;
  gender?: string;
  admissionPath?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateStudentPayload {
  nim: string;
  name: string;
  birthPlace?: string;
  birthDate?: string;
  gender: string;
  agama?: string;
  email?: string;
  phoneNumber?: string;
  facultyId: string;
  studyProgramId: string;
  curriculumId?: string;
  academicSemesterId?: string;
  entryYear: number;
  admissionPath?: string;
  studentStatus?: string;
  isActive?: boolean;
}

export const studentService = {
  getAll: (params: StudentQuery) =>
    api.get<PaginatedResponse<Student>>('/students', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Student>(`/students/${id}`).then((r) => r.data),

  create: (data: CreateStudentPayload) =>
    api.post<Student>('/students', data).then((r) => r.data),

  update: (id: string, data: Partial<CreateStudentPayload>) =>
    api.put<Student>(`/students/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete<Student>(`/students/${id}`).then((r) => r.data),
};
