export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Faculty {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudyProgram {
  id: string;
  facultyId: string;
  code: string;
  name: string;
  description: string | null;
  degree: string;
  accreditation: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  faculty?: Faculty;
}

export interface Curriculum {
  id: string;
  studyProgramId: string;
  code: string;
  name: string;
  description: string | null;
  year: number;
  totalSemester: number;
  totalSks: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  studyProgram?: StudyProgram;
}

export interface Course {
  id: string;
  curriculumId: string;
  code: string;
  name: string;
  description: string | null;
  sks: number;
  semester: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  curriculum?: Curriculum;
}

export type SemesterType = 'GANJIL' | 'GENAP' | 'PENDEK';

export interface AcademicSemester {
  id: string;
  code: string;
  name: string;
  academicYear: string;
  semesterType: SemesterType;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
