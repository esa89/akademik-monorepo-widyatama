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
  code: string;
  name: string;
  description: string | null;
  orderNumber: number;
  isActive: boolean;
  course: CourseSummary;
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
  code: string;
  name: string;
  description: string | null;
  orderNumber: number;
  targetPercentage: number;
  isActive: boolean;
  cpmk: CpmkSummary;
  course: CourseSummary;
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
