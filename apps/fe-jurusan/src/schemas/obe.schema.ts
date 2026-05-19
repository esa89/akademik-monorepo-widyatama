import { z } from 'zod';

// ─── CPL Schema ────────────────────────────────────
export const cplSchema = z.object({
  code: z.string().min(1, 'Kode CPL wajib diisi').max(20, 'Kode maksimal 20 karakter'),
  name: z.string().min(1, 'Nama CPL wajib diisi').max(200, 'Nama maksimal 200 karakter'),
  category: z.enum(['SIKAP', 'PENGETAHUAN', 'KETERAMPILAN_UMUM', 'KETERAMPILAN_KHUSUS'], {
    required_error: 'Kategori wajib dipilih',
  }),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional().or(z.literal('')),
  curriculumYear: z.coerce.number().min(2000, 'Tahun kurikulum minimal 2000').max(2100, 'Tahun kurikulum maksimal 2100'),
  isActive: z.boolean().default(true),
});

export type CplFormData = z.infer<typeof cplSchema>;

// ─── CPMK Schema ───────────────────────────────────
export const cpmkSchema = z.object({
  code: z.string().min(1, 'Kode CPMK wajib diisi').max(20, 'Kode maksimal 20 karakter'),
  name: z.string().min(1, 'Nama CPMK wajib diisi').max(200, 'Nama maksimal 200 karakter'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional().or(z.literal('')),
  orderNumber: z.coerce.number().min(1, 'Urutan minimal 1'),
  courseId: z.string().min(1, 'Mata kuliah wajib dipilih'),
  isActive: z.boolean().default(true),
});

export type CpmkFormData = z.infer<typeof cpmkSchema>;

// ─── CPL Mapping Schema ────────────────────────────
export const cplMappingSchema = z.object({
  cplId: z.string().min(1, 'CPL wajib dipilih'),
  weight: z.coerce.number().min(1, 'Bobot minimal 1').max(100, 'Bobot maksimal 100'),
});

export type CplMappingFormData = z.infer<typeof cplMappingSchema>;

// ─── Sub CPMK Schema ───────────────────────────────
export const subCpmkSchema = z.object({
  code: z.string().min(1, 'Kode Sub CPMK wajib diisi').max(20, 'Kode maksimal 20 karakter'),
  name: z.string().min(1, 'Nama Sub CPMK wajib diisi').max(200, 'Nama maksimal 200 karakter'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional().or(z.literal('')),
  orderNumber: z.coerce.number().min(1, 'Urutan minimal 1'),
  targetPercentage: z.coerce.number().min(0, 'Target minimal 0').max(100, 'Target maksimal 100'),
  cpmkId: z.string().min(1, 'CPMK wajib dipilih'),
  courseId: z.string().min(1, 'Mata kuliah wajib dipilih'),
  isActive: z.boolean().default(true),
});

export type SubCpmkFormData = z.infer<typeof subCpmkSchema>;

// ─── Assessment Schema ─────────────────────────────
export const assessmentSchema = z.object({
  code: z.string().min(1, 'Kode Assessment wajib diisi').max(20, 'Kode maksimal 20 karakter'),
  name: z.string().min(1, 'Nama Assessment wajib diisi').max(200, 'Nama maksimal 200 karakter'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional().or(z.literal('')),
  type: z.enum(['QUIZ', 'ASSIGNMENT', 'PRACTICUM', 'PROJECT', 'PRESENTATION', 'UTS', 'UAS', 'OTHER'], {
    required_error: 'Tipe assessment wajib dipilih',
  }),
  weight: z.coerce.number().min(1, 'Bobot minimal 1').max(100, 'Bobot maksimal 100'),
  maxScore: z.coerce.number().min(1, 'Skor maksimal minimal 1').max(1000, 'Skor maksimal 1000'),
  orderNumber: z.coerce.number().min(1, 'Urutan minimal 1'),
  subCpmkId: z.string().min(1, 'Sub CPMK wajib dipilih'),
  cpmkId: z.string().min(1, 'CPMK wajib dipilih'),
  courseId: z.string().min(1, 'Mata kuliah wajib dipilih'),
  isActive: z.boolean().default(true),
});

export type AssessmentFormData = z.infer<typeof assessmentSchema>;

// ─── Rubric Schema ─────────────────────────────────
export const rubricSchema = z.object({
  code: z.string().min(1, 'Kode Rubrik wajib diisi').max(20, 'Kode maksimal 20 karakter'),
  name: z.string().min(1, 'Nama Rubrik wajib diisi').max(200, 'Nama maksimal 200 karakter'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional().or(z.literal('')),
  weight: z.coerce.number().min(1, 'Bobot minimal 1').max(100, 'Bobot maksimal 100'),
  maxScore: z.coerce.number().min(1, 'Skor maksimal minimal 1').max(1000, 'Skor maksimal 1000'),
  orderNumber: z.coerce.number().min(1, 'Urutan minimal 1'),
  assessmentId: z.string().min(1, 'Assessment wajib dipilih'),
  subCpmkId: z.string().min(1, 'Sub CPMK wajib dipilih'),
  cpmkId: z.string().min(1, 'CPMK wajib dipilih'),
  isActive: z.boolean().default(true),
});

export type RubricFormData = z.infer<typeof rubricSchema>;
