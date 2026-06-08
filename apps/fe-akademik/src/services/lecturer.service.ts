import type { Lecturer, PaginatedResponse } from '@/types';
import { api } from './api';

export interface LecturerQuery {
  page?: number;
  limit?: number;
  search?: string;
  facultyId?: string;
  studyProgramId?: string;
  lastEducation?: string;
  academicPosition?: string;
  isActive?: boolean;
  authentikStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateLecturerPayload {
  nidn: string;
  nrk: string;
  name: string;
  frontTitle?: string;
  backTitle?: string;
  email: string;
  phoneNumber?: string;
  lastEducation: string;
  academicPosition?: string;
  facultyId: string;
  studyProgramId: string;
  isActive?: boolean;
  username: string;
  password: string;
}

export interface UpdateLecturerPayload {
  nidn?: string;
  nrk?: string;
  name?: string;
  frontTitle?: string;
  backTitle?: string;
  email?: string;
  phoneNumber?: string;
  lastEducation?: string;
  academicPosition?: string;
  facultyId?: string;
  studyProgramId?: string;
  isActive?: boolean;
}

export const lecturerService = {
  getAll: (params: LecturerQuery) =>
    api.get<PaginatedResponse<Lecturer>>('/lecturers', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<{ data: Lecturer }>(`/lecturers/${id}`).then((r) => r.data),

  create: (data: CreateLecturerPayload) =>
    api.post<Lecturer>('/lecturers', data).then((r) => r.data),

  update: (id: string, data: UpdateLecturerPayload) =>
    api.put<Lecturer>(`/lecturers/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete<Lecturer>(`/lecturers/${id}`).then((r) => r.data),

  syncAuthentik: (id: string) =>
    api.post<{ message: string }>(`/lecturers/${id}/sync-authentik`).then((r) => r.data),

  resetPassword: (id: string, newPassword: string) =>
    api.post<{ message: string }>(`/lecturers/${id}/reset-password`, { newPassword }).then((r) => r.data),
};
