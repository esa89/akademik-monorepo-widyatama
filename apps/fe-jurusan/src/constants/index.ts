export const QUERY_KEYS = {
  cpl: (params?: Record<string, unknown>) => ['cpl', params] as const,
  cplDetail: (id: string) => ['cpl', id] as const,
  cpmk: (params?: Record<string, unknown>) => ['cpmk', params] as const,
  cpmkDetail: (id: string) => ['cpmk', id] as const,
  subCpmk: (params?: Record<string, unknown>) => ['sub-cpmk', params] as const,
  assessment: (params?: Record<string, unknown>) => ['assessment', params] as const,
  rubric: (params?: Record<string, unknown>) => ['rubric', params] as const,
  courses: (params?: Record<string, unknown>) => ['courses', params] as const,
} as const;

export const CPL_CATEGORY_LABELS: Record<string, string> = {
  SIKAP: 'Sikap',
  PENGETAHUAN: 'Pengetahuan',
  KETERAMPILAN_UMUM: 'Keterampilan Umum',
  KETERAMPILAN_KHUSUS: 'Keterampilan Khusus',
};

export const ASSESSMENT_TYPE_LABELS: Record<string, string> = {
  QUIZ: 'Quiz',
  ASSIGNMENT: 'Tugas',
  PRACTICUM: 'Praktikum',
  PROJECT: 'Proyek',
  PRESENTATION: 'Presentasi',
  UTS: 'UTS',
  UAS: 'UAS',
  OTHER: 'Lainnya',
};

export const ASSESSMENT_TYPE_COLORS: Record<string, string> = {
  QUIZ: 'bg-blue-100 text-blue-700',
  ASSIGNMENT: 'bg-green-100 text-green-700',
  PRACTICUM: 'bg-purple-100 text-purple-700',
  PROJECT: 'bg-orange-100 text-orange-700',
  PRESENTATION: 'bg-pink-100 text-pink-700',
  UTS: 'bg-yellow-100 text-yellow-700',
  UAS: 'bg-red-100 text-red-700',
  OTHER: 'bg-gray-100 text-gray-700',
};
