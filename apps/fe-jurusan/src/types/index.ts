export type CplCategory = 'SIKAP' | 'PENGETAHUAN' | 'KETERAMPILAN_UMUM' | 'KETERAMPILAN_KHUSUS';

export type AssessmentType = 'QUIZ' | 'ASSIGNMENT' | 'PRACTICUM' | 'PROJECT' | 'PRESENTATION' | 'UTS' | 'UAS' | 'OTHER';

export interface Cpl {
  id: string;
  code: string;
  name: string;
  category: CplCategory;
  description: string | null;
  curriculumYear: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseSummary {
  id: string;
  code: string;
  name: string;
}

export interface CplMappingSummary {
  id: string;
  code: string;
  name: string;
  weight: number;
}

export interface Cpmk {
  id: string;
  curriculumId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  totalCpl: number;
  createdAt: string;
  updatedAt: string;
}

export interface CpmkDetail extends Cpmk {
  cpls: CplMappingSummary[];
}

export interface CpmkSummary {
  id: string;
  code: string;
  name: string;
}

export interface SubCpmk {
  id: string;
  curriculumId: string;
  courseId: string;
  cpmkId: string;
  code: string;
  name: string;
  description: string | null;
  orderNumber: number;
  targetPercentage: number;
  isActive: boolean;
  cpmk: CpmkSummary;
  createdAt: string;
  updatedAt: string;
}

export interface SubCpmkSummary {
  id: string;
  code: string;
  name: string;
}

export interface Assessment {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: AssessmentType;
  weight: number;
  maxScore: number;
  orderNumber: number;
  isActive: boolean;
  subCpmk: SubCpmkSummary;
  cpmk: CpmkSummary;
  course: CourseSummary;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentSummary {
  id: string;
  code: string;
  name: string;
}

export interface Rubric {
  id: string;
  code: string;
  name: string;
  description: string | null;
  weight: number;
  maxScore: number;
  orderNumber: number;
  isActive: boolean;
  assessment: AssessmentSummary;
  subCpmk: SubCpmkSummary;
  cpmk: CpmkSummary;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  sks: number;
  semester: number;
  isActive: boolean;
}

export interface GraduateProfile {
  id: string;
  code: string;
  name: string;
  description: string | null;
  vision: string | null;
  mission: string | null;
  curriculumYear: number;
  isActive: boolean;
  totalCpl: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Curriculum (from api-akademik) ────────────────────────────────────────────

export interface Curriculum {
  id: string;
  code: string;
  name: string;
  year: number;
  description: string | null;
  totalSemester: number;
  totalSks: number;
  isActive: boolean;
  studyProgram: { id: string; code: string; name: string };
  createdAt: string;
  updatedAt: string;
}

// ─── VisiMisi ─────────────────────────────────────────────────────────────────

export type VisiMisiType = 'VISI' | 'MISI';

export interface VisiMisi {
  id: string;
  type: VisiMisiType;
  content: string;
  curriculumYear: number;
  orderNumber: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── CPL-Profile Mapping ──────────────────────────────────────────────────────

export interface CplSummary {
  id: string;
  code: string;
  name: string;
  category: CplCategory;
  curriculumYear: number;
  description: string | null;
}

export interface GraduateProfileSummary {
  id: string;
  code: string;
  name: string;
  curriculumYear: number;
  description: string | null;
}

export interface MappingPair {
  cplId: string;
  graduateProfileId: string;
}

export interface CplProfileMatrix {
  cpls: CplSummary[];
  graduateProfiles: GraduateProfileSummary[];
  mappings: MappingPair[];
}

// ─── CPL-BK Mapping ──────────────────────────────────────────────────────────

export interface BkSummary {
  id: string;
  code: string;
  name: string;
  curriculumId: string;
}

export interface CplBkMappingPair {
  cplId: string;
  bodyOfKnowledgeId: string;
}

export interface CplBkMatrix {
  cpls: CplSummary[];
  bodyOfKnowledges: BkSummary[];
  mappings: CplBkMappingPair[];
}

// ─── BK-Course Mapping ───────────────────────────────────────────────────────

export interface BkCourseMappingPair {
  bodyOfKnowledgeId: string;
  courseId: string;
}

export interface BkCourseMatrix {
  bodyOfKnowledges: BkSummary[];
  mappings: BkCourseMappingPair[];
}

// ─── Body of Knowledge ───────────────────────────────────────────────────────

export interface BodyOfKnowledge {
  id: string;
  curriculumId: string;
  code: string;
  name: string;
  reference: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── CPL-CPMK Mapping Matrix ──────────────────────────────────────────────────

export interface CplCpmkMappingPair {
  cpmkId: string;
  cplId: string;
}

export interface CplCpmkMatrixCpl {
  id: string;
  code: string;
  name: string;
  description: string | null;
  curriculumYear: number;
}

export interface CplCpmkMatrixCpmk {
  id: string;
  code: string;
  name: string;
}

export interface CplCpmkMatrix {
  cpls: CplCpmkMatrixCpl[];
  cpmks: CplCpmkMatrixCpmk[];
  mappings: CplCpmkMappingPair[];
  totalMapped: number;
}

// ─── CPMK-Course Mapping Matrix ──────────────────────────────────────────────

export interface CpmkMatrixRow {
  id: string;
  code: string;
  name: string;
  courseIds: string[];
  cpls: { id: string; code: string; name: string }[];
}

export interface CplMatrixRow {
  cpl: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    curriculumYear: number;
  };
  cpmks: CpmkMatrixRow[];
}

export interface CpmkCplMkMatrix {
  matrix: CplMatrixRow[];
  unmappedCpmks: CpmkMatrixRow[];
  totalCpl: number;
  totalCpmk: number;
  mappedToCpl: number;
  mappedToMk: number;
}

// ─── Assessment Component ─────────────────────────────────────────────────────

export interface AssessmentComponent {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Course CPMK Assessment Weight ───────────────────────────────────────────

export interface CourseCpmkWeight {
  id: string;
  courseId: string;
  cpmkId: string;
  assessmentComponentId: string;
  weight: number;
  createdAt: string;
  updatedAt: string;
  cpmk: { id: string; code: string; name: string };
  assessmentComponent: { id: string; code: string; name: string };
}

export interface WeightEntry {
  cpmkId: string;
  assessmentComponentId: string;
  weight: number;
}

export interface BulkSaveWeightRequest {
  courseId: string;
  weights: WeightEntry[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiDetailResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}
