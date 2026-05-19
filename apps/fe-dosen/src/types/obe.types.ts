/**
 * Tipe data untuk Outcome-Based Education (OBE) Widyatama
 * Berdasarkan struktur spreadsheet perhitungan nilai OBE
 */

// ============================================================
// Enums & Constants
// ============================================================

/** Label kualitatif ketercapaian */
export type KualitatifLabel = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';

/** Nilai mutu (grade letter) */
export type NilaiMutu = 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'D' | 'E';

/** Skala kualitatif — threshold */
export const KUALITATIF_THRESHOLDS: { min: number; label: KualitatifLabel }[] = [
  { min: 80, label: 'EXCELLENT' },
  { min: 60, label: 'GOOD' },
  { min: 40, label: 'AVERAGE' },
  { min: 0, label: 'POOR' },
];

/** Skala nilai mutu */
export const NILAI_MUTU_THRESHOLDS: { min: number; mutu: NilaiMutu }[] = [
  { min: 85, mutu: 'A' },
  { min: 80, mutu: 'A-' },
  { min: 75, mutu: 'B+' },
  { min: 70, mutu: 'B' },
  { min: 65, mutu: 'B-' },
  { min: 60, mutu: 'C+' },
  { min: 55, mutu: 'C' },
  { min: 40, mutu: 'D' },
  { min: 0, mutu: 'E' },
];

/** Bobot default SIAKAD */
export const DEFAULT_SIAKAD_WEIGHTS: SiakadWeights = {
  absensi: 10,
  tugas: 10,
  kuis: 20,
  uts: 30,
  uas: 30,
};

// ============================================================
// Core Entities
// ============================================================

/** Mata kuliah */
export interface MataKuliah {
  kode: string;         // e.g. "MATH101"
  nama: string;         // e.g. "Kalkulus 1"
  sks: number;
  semester: number;
  jurusan: string;
  dosen: string;
  kelas: string;
  reg: string;          // e.g. "Reg A"
}

/** Program Learning Outcome */
export interface PLO {
  id: string;           // e.g. "PLO1"
  nama: string;         // e.g. "Mampu menerapkan konsep matematika"
  /** ID CPMK yang berkontribusi ke PLO ini */
  cpmkIds: string[];
}

/** Capaian Pembelajaran Mata Kuliah (Course Learning Outcome) */
export interface CPMK {
  id: string;           // e.g. "LO1"
  nama: string;         // e.g. "Memahami konsep limit dan turunan"
  /** Sub-CPMK assessment items */
  subCPMK: SubCPMK[];
}

/** Sub-CPMK: satu komponen assessment yang berkontribusi ke CPMK */
export interface SubCPMK {
  id: string;           // e.g. "LO1.1"
  nama: string;         // e.g. "Tugas 1"
  /** Bobot assessment (nilai mentah max, e.g. 100) */
  bobotMax: number;
  /** Persentase kontribusi ke CPMK parent (e.g. 5 = 5%) */
  persentase: number;
}

// ============================================================
// Score Data per Mahasiswa
// ============================================================

/** Data mahasiswa */
export interface Mahasiswa {
  npm: string;
  nama: string;
}

/** Nilai mentah per Sub-CPMK untuk satu mahasiswa */
export interface NilaiSubCPMK {
  subCPMKId: string;
  /** Bobot (nilai mentah yang diperoleh, e.g. 80 dari 100) */
  bobot: number;
  /** Nilai setelah dikalikan persentase (otomatis dihitung) */
  nilaiPersentase: number;
  /** Z Nilai x Bobot (otomatis dihitung) */
  zNilaiBobot: number;
}

/** Ketercapaian satu CPMK/LO untuk satu mahasiswa */
export interface KetercapaianCPMK {
  cpmkId: string;
  /** Kuantitatif: sum of Z Nilai x Bobot dari semua Sub-CPMK */
  kuantitatif: number;
  /** Kualitatif: EXCELLENT / GOOD / AVERAGE / POOR */
  kualitatif: KualitatifLabel;
}

/** Nilai PLO untuk satu mahasiswa */
export interface NilaiPLO {
  ploId: string;
  /** Nilai PLO (rata-rata kuantitatif CPMK yang dipetakan) */
  nilai: number;
  /** Persentase (biasanya 100%) */
  persentase: number;
  /** Kualitatif */
  kualitatif: KualitatifLabel;
}

/** Komponen nilai SIAKAD */
export interface NilaiSIAKAD {
  absensi: number;
  tugas: number;
  kuis: number;
  uts: number;
  uas: number;
}

/** Bobot SIAKAD (persentase) */
export interface SiakadWeights {
  absensi: number;  // default 10%
  tugas: number;    // default 10%
  kuis: number;     // default 20%
  uts: number;      // default 30%
  uas: number;      // default 30%
}

/** Rekap lengkap nilai OBE satu mahasiswa */
export interface NilaiOBEMahasiswa {
  mahasiswa: Mahasiswa;
  /** Nilai per Sub-CPMK */
  nilaiSubCPMK: NilaiSubCPMK[];
  /** Ketercapaian per CPMK */
  ketercapaianCPMK: KetercapaianCPMK[];
  /** Nilai per PLO */
  nilaiPLO: NilaiPLO[];
  /** Nilai SIAKAD */
  nilaiSIAKAD: NilaiSIAKAD;
  /** Nilai akhir mahasiswa (weighted sum SIAKAD) */
  nilaiAkhir: number;
  /** Nilai mutu (A, B+, B, dll) */
  nilaiMutu: NilaiMutu;
}

// ============================================================
// Summary & Aggregation
// ============================================================

/** Summary ketercapaian per LO */
export interface SummaryLO {
  cpmkId: string;
  cpmkNama: string;
  excellent: number;
  good: number;
  average: number;
  poor: number;
  total: number;
  /** Persentase keberhasilan (non-POOR / total × 100) */
  keberhasilan: number;
}

/** Summary PLO keseluruhan */
export interface SummaryPLO {
  ploId: string;
  ploNama: string;
  rataRata: number;
  kualitatif: KualitatifLabel;
  keberhasilan: number;
}

// ============================================================
// Konfigurasi OBE per Mata Kuliah
// ============================================================

/** Konfigurasi OBE untuk satu mata kuliah */
export interface OBEConfig {
  mataKuliah: MataKuliah;
  /** Daftar CPMK dan Sub-CPMK */
  cpmkList: CPMK[];
  /** Daftar PLO yang relevan */
  ploList: PLO[];
  /** Bobot SIAKAD */
  siakadWeights: SiakadWeights;
  /** Daftar mahasiswa */
  mahasiswaList: Mahasiswa[];
}

/** State keseluruhan halaman OBE */
export interface OBEPageState {
  config: OBEConfig;
  /** Nilai per mahasiswa — key = npm */
  nilaiMap: Record<string, NilaiOBEMahasiswa>;
  /** Summary per CPMK */
  summaryLO: SummaryLO[];
  /** Summary PLO */
  summaryPLO: SummaryPLO[];
}
