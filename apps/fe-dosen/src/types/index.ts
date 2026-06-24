export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ApiDetailResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
}

// ─── Akademik ─────────────────────────────────────────────
export interface CourseDetail {
  id: string;
  code: string;
  name: string;
  sks: number;
  curriculumId: string;
  curriculum: { id: string; code: string; name: string };
}

export interface Lecturer {
  id: string;
  nidn: string;
  nrk: string;
  name: string;
  frontTitle?: string;
  backTitle?: string;
  email: string;
  studyProgram: { id: string; name: string; code: string };
  faculty: { id: string; name: string };
}

export interface AcademicSemester {
  id: string;
  code: string;
  name: string;
  academicYear: string;
  semesterType: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  sks: number;
}

export interface Student {
  id: string;
  nim: string;
  name: string;
  email?: string;
}

export interface ClassStudent {
  id: string;
  classId: string;
  studentId: string;
  kehadiran?: number;
  uts?: number;
  uas?: number;
  quiz?: number;
  tugas?: number;
  nilaiAkhir?: number;
  grade?: string;
  student: Student;
}

export interface ClassLecturer {
  id: string;
  lecturerId: string;
  role: string;
  lecturer: { id: string; nidn: string; name: string; frontTitle?: string; backTitle?: string };
}

export interface AcademicClass {
  id: string;
  code: string;
  name: string;
  capacity: number;
  isActive: boolean;
  semester: AcademicSemester;
  course: Course;
  lecturers: ClassLecturer[];
  totalStudents: number;
}

export interface AcademicClassDetail extends AcademicClass {
  students: ClassStudent[];
}

// ─── OBE ─────────────────────────────────────────────────
export interface Cpmk {
  id: string;
  code: string;
  name: string;
  description?: string;
  curriculumId: string;
  isActive: boolean;
}

export interface AssessmentComponent {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface CourseCpmkWeight {
  id: string;
  courseId: string;
  cpmkId: string;
  assessmentComponentId: string;
  weight: number;
  cpmk: { id: string; code: string; name: string };
  assessmentComponent: { id: string; code: string; name: string };
}

export interface StudentCpmkScore {
  id: string;
  classId: string;
  studentId: string;
  courseId: string;
  cpmkId: string;
  assessmentComponentId: string;
  score: number;
  cpmk: { id: string; code: string; name: string };
  assessmentComponent: { id: string; code: string; name: string };
}

export interface ScoreEntry {
  studentId: string;
  cpmkId: string;
  assessmentComponentId: string;
  score: number;
}

export interface BulkSaveScoreRequest {
  classId: string;
  courseId: string;
  scores: ScoreEntry[];
}

// Cpmk course matrix row (from cpmk-course-mapping/matrix)
export interface CpmkMatrixRow {
  cpmkId: string;
  cpmkCode: string;
  cpmkName: string;
  courseIds: string[];
}

// CPL-CPMK mapping matrix
export interface CplInfo {
  id: string;
  code: string;
  name: string;
}

export interface CplCpmkMatrix {
  cpls: CplInfo[];
  cpmks: { id: string; code: string; name: string }[];
  mappings: { cpmkId: string; cplId: string }[];
}
