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
  studyProgramId: string | null;
  facultyId: string | null;
  scope: 'universitas' | 'fakultas' | 'prodi';
  code: string;
  name: string;
  description: string | null;
  year: number;
  totalSemester: number;
  totalSks: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  studyProgram?: { id: string; code: string; name: string; facultyId: string } | null;
  faculty?: { id: string; code: string; name: string } | null;
}

export interface Course {
  id: string;
  curriculumId: string | null;
  facultyId: string | null;
  code: string;
  name: string;
  description: string | null;
  sks: number;
  semester: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  curriculum?: { id: string; code: string; name: string; studyProgramId: string | null; facultyId: string | null } | null;
  faculty?: { id: string; code: string; name: string } | null;
  studyProgram?: { id: string; code: string; name: string; facultyId?: string } | null;
}

export type LastEducation = 'S1' | 'S2' | 'S3' | 'D4' | 'PROFESI' | 'SPESIALIS_1' | 'SPESIALIS_2' | 'LAINNYA';
export type AcademicPosition = 'TENAGA_PENGAJAR' | 'ASISTEN_AHLI' | 'LEKTOR' | 'LEKTOR_KEPALA' | 'GURU_BESAR';
export type AuthentikStatus = 'NOT_SYNCED' | 'ACTIVE' | 'DISABLED';

export interface Lecturer {
  id: string;
  nidn: string;
  nrk: string;
  name: string;
  frontTitle: string | null;
  backTitle: string | null;
  email: string;
  phoneNumber: string | null;
  lastEducation: LastEducation;
  academicPosition: AcademicPosition;
  facultyId: string;
  studyProgramId: string;
  isActive: boolean;
  identityUserId: string | null;
  identityUsername: string | null;
  authentikStatus: AuthentikStatus;
  faculty?: { id: string; code: string; name: string } | null;
  studyProgram?: { id: string; code: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  // create response extras
  authentikCreated?: boolean;
  authentikMessage?: string;
}

export type Gender = 'LAKI_LAKI' | 'PEREMPUAN';
export type StudentStatus = 'AKTIF' | 'CUTI' | 'NON_AKTIF' | 'LULUS' | 'DROP_OUT' | 'MENGUNDURKAN_DIRI';
export type AdmissionPath = 'REGULER' | 'KELAS_KARYAWAN' | 'RPL' | 'PASCA_SARJANA';
export type Agama = 'ISLAM' | 'KRISTEN_PROTESTAN' | 'KRISTEN_KATOLIK' | 'HINDU' | 'BUDDHA' | 'KONGHUCU';

export interface Student {
  id: string;
  nim: string;
  name: string;
  birthPlace: string | null;
  birthDate: string | null;
  gender: Gender;
  agama: Agama | null;
  email: string | null;
  phoneNumber: string | null;
  facultyId: string;
  studyProgramId: string;
  curriculumId: string | null;
  academicSemesterId: string | null;
  admissionPath: AdmissionPath;
  entryYear: number;
  studentStatus: StudentStatus;
  isActive: boolean;
  faculty?: { id: string; code: string; name: string } | null;
  studyProgram?: { id: string; code: string; name: string } | null;
  curriculum?: { id: string; code: string; name: string; year: number } | null;
  academicSemester?: { id: string; code: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export type LecturerRole = 'PRIMARY' | 'ASSISTANT';

export interface ClassLecturerItem {
  id: string;
  classId: string;
  lecturerId: string;
  role: LecturerRole;
  lecturer?: {
    id: string;
    nidn: string;
    name: string;
    frontTitle: string | null;
    backTitle: string | null;
  } | null;
}

export interface ClassStudentItem {
  id: string;
  classId: string;
  studentId: string;
  student?: {
    id: string;
    nim: string;
    name: string;
    gender: string;
    studyProgram?: { id: string; code: string; name: string } | null;
  } | null;
}

export interface AcademicClass {
  id: string;
  semesterId: string;
  courseId: string;
  code: string;
  name: string;
  capacity: number;
  isActive: boolean;
  semester?: { id: string; code: string; name: string; academicYear: string; semesterType: string } | null;
  course?: { id: string; code: string; name: string; sks: number } | null;
  lecturers?: ClassLecturerItem[];
  students?: ClassStudentItem[];
  totalStudents?: number;
  createdAt: string;
  updatedAt: string;
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
