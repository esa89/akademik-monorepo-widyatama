import type { StudyProgram, PaginatedResponse } from '@/types';
import { api } from './api';

export interface StudyProgramQuery {
  page?: number;
  limit?: number;
  search?: string;
  facultyId?: string;
  degree?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const studyProgramService = {
  getAll: (params: StudyProgramQuery) =>
    api.get<PaginatedResponse<StudyProgram>>('/study-programs', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<StudyProgram>(`/study-programs/${id}`).then((r) => r.data),

  create: (data: { facultyId: string; code: string; name: string; description?: string; degree: string; accreditation?: string }) =>
    api.post<StudyProgram>('/study-programs', data).then((r) => r.data),

  update: (id: string, data: Partial<{ facultyId: string; code: string; name: string; description: string; degree: string; accreditation: string; isActive: boolean }>) =>
    api.put<StudyProgram>(`/study-programs/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete<StudyProgram>(`/study-programs/${id}`).then((r) => r.data),
};
