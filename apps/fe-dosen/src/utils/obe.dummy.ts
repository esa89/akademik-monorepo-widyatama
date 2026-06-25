/**
 * Data dummy OBE berdasarkan screenshot Excel
 * Mata Kuliah: MATH101 - Kalkulus 1
 */

import type {
  OBEConfig,
  Mahasiswa,
  CPMK,
  PLO,
  NilaiSIAKAD,
} from '@/types/obe.types';
import { DEFAULT_SIAKAD_WEIGHTS } from '@/types/obe.types';

// ============================================================
// Mahasiswa
// ============================================================

export const dummyMahasiswa: Mahasiswa[] = [
  { npm: '230511001', nama: 'ADINDA FARIDA' },
  { npm: '230511002', nama: 'RAYYAN SAHNATA CANDRAPUTRA' },
  { npm: '230511003', nama: 'TRAPSILA OPHELIA ARDIEN' },
  { npm: '230511004', nama: 'ZHAHRA ANITA SOLIKHASARI' },
  { npm: '230511005', nama: 'MOHAMAD ARIIQ RAISAL AL KINDI' },
  { npm: '230511006', nama: 'RIKI SOPANDI' },
  { npm: '230511007', nama: 'JIHAN ZAHRA NABIILAH' },
  { npm: '230511008', nama: 'DIMAS RAMADHAN' },
  { npm: '230511009', nama: 'RINDY ANTIKA' },
  { npm: '230511010', nama: 'BAMBANG NURDIMAN' },
  { npm: '230511011', nama: 'DANIEL FIRMANSYAH' },
  { npm: '230511012', nama: 'ARYA FATHURRAHMAN' },
  { npm: '230511013', nama: 'SITI NURHALIZA' },
  { npm: '230511014', nama: 'AHMAD RIZKY PRATAMA' },
  { npm: '230511015', nama: 'DEWI SAFITRI' },
  { npm: '230511016', nama: 'FARHAN MAULANA' },
  { npm: '230511017', nama: 'PUTRI AMELIA SARI' },
  { npm: '230511018', nama: 'RIDWAN HAKIM' },
  { npm: '230511019', nama: 'NUR AINI FITRIANI' },
  { npm: '230511020', nama: 'GILANG RAMADHAN PUTRA' },
  { npm: '230511021', nama: 'ANISA RAHMA WATI' },
  { npm: '230511022', nama: 'BAYU SAPUTRA' },
  { npm: '230511023', nama: 'CITRA DEWI LESTARI' },
  { npm: '230511024', nama: 'EKO PRASETYO' },
  { npm: '230511025', nama: 'FITRI HANDAYANI' },
  { npm: '230511026', nama: 'GALIH PRATAMA WIJAYA' },
  { npm: '230511027', nama: 'HANA PERTIWI' },
  { npm: '230511028', nama: 'MUHAMMAD NAUFAL OKTAVIANSYAH' },
  { npm: '230511029', nama: 'AGNIA CITRA SABRINA' },
  { npm: '230511030', nama: 'MOCHAMMAD RONAL' },
  { npm: '230511061', nama: 'RIFQY KAMALUL ZAMAN' },
  { npm: '230511062', nama: 'ZEEBRAND ILHAM SULAEMAN' },
  { npm: '230511063', nama: 'SAMUEL BAMBANG YOSAFAT SIMANULLANG' },
];

// ============================================================
// CPMK / Learning Outcomes
// ============================================================

export const dummyCPMK: CPMK[] = [
  {
    id: 'LO1',
    nama: 'Memahami konsep limit dan turunan',
    subCPMK: [
      { id: 'LO1.1', nama: 'Tugas 1', bobotMax: 100, persentase: 5 },
      { id: 'LO1.2', nama: 'Tugas 2', bobotMax: 100, persentase: 5 },
    ],
  },
  {
    id: 'LO2',
    nama: 'Menerapkan teknik integral',
    subCPMK: [
      { id: 'LO2.1', nama: 'Kuis 1', bobotMax: 100, persentase: 5 },
      { id: 'LO2.2', nama: 'Kuis 2', bobotMax: 100, persentase: 5 },
    ],
  },
  {
    id: 'LO3',
    nama: 'Menganalisis fungsi multivariabel',
    subCPMK: [
      { id: 'LO3.1', nama: 'Tugas 3', bobotMax: 100, persentase: 5 },
      { id: 'LO3.2', nama: 'UTS', bobotMax: 100, persentase: 10 },
    ],
  },
  {
    id: 'LO4',
    nama: 'Menyelesaikan persamaan diferensial',
    subCPMK: [
      { id: 'LO4.1', nama: 'Tugas 4', bobotMax: 100, persentase: 5 },
      { id: 'LO4.2', nama: 'Kuis 3', bobotMax: 100, persentase: 5 },
    ],
  },
  {
    id: 'LO5',
    nama: 'Menerapkan kalkulus dalam pemecahan masalah',
    subCPMK: [
      { id: 'LO5.1', nama: 'Tugas 4', bobotMax: 100, persentase: 5 },
      { id: 'LO5.2', nama: 'UAS', bobotMax: 100, persentase: 10 },
    ],
  },
];

// ============================================================
// PLO
// ============================================================

export const dummyPLO: PLO[] = [
  {
    id: 'PLO1',
    nama: 'Mampu menerapkan konsep dasar matematika dan sains',
    cpmkIds: ['LO1', 'LO2', 'LO3', 'LO4', 'LO5'],
  },
];

// ============================================================
// Raw Scores (nilai mentah per mahasiswa per subCPMK)
// key format: "npm:subCPMKId"
// ============================================================

/** Nilai mentah dari gambar (sebagian, sisanya di-generate) */
const baseRawScores: Record<string, Record<string, number>> = {
  '230511001': { 'LO1.1': 80, 'LO1.2': 85, 'LO2.1': 75, 'LO2.2': 70, 'LO3.1': 80, 'LO3.2': 85, 'LO4.1': 70, 'LO4.2': 75, 'LO5.1': 80, 'LO5.2': 85 },
  '230511002': { 'LO1.1': 80, 'LO1.2': 75, 'LO2.1': 50, 'LO2.2': 60, 'LO3.1': 70, 'LO3.2': 65, 'LO4.1': 55, 'LO4.2': 60, 'LO5.1': 80, 'LO5.2': 75 },
  '230511003': { 'LO1.1': 85, 'LO1.2': 88, 'LO2.1': 90, 'LO2.2': 85, 'LO3.1': 80, 'LO3.2': 90, 'LO4.1': 85, 'LO4.2': 80, 'LO5.1': 80, 'LO5.2': 88 },
  '230511004': { 'LO1.1': 60, 'LO1.2': 60, 'LO2.1': 60, 'LO2.2': 55, 'LO3.1': 65, 'LO3.2': 60, 'LO4.1': 50, 'LO4.2': 55, 'LO5.1': 60, 'LO5.2': 65 },
  '230511005': { 'LO1.1': 55, 'LO1.2': 65, 'LO2.1': 70, 'LO2.2': 60, 'LO3.1': 55, 'LO3.2': 65, 'LO4.1': 60, 'LO4.2': 55, 'LO5.1': 65, 'LO5.2': 70 },
  '230511006': { 'LO1.1': 75, 'LO1.2': 75, 'LO2.1': 70, 'LO2.2': 80, 'LO3.1': 75, 'LO3.2': 80, 'LO4.1': 70, 'LO4.2': 75, 'LO5.1': 80, 'LO5.2': 85 },
  '230511007': { 'LO1.1': 50, 'LO1.2': 50, 'LO2.1': 68, 'LO2.2': 55, 'LO3.1': 60, 'LO3.2': 55, 'LO4.1': 45, 'LO4.2': 50, 'LO5.1': 55, 'LO5.2': 60 },
  '230511008': { 'LO1.1': 70, 'LO1.2': 77, 'LO2.1': 64, 'LO2.2': 70, 'LO3.1': 75, 'LO3.2': 72, 'LO4.1': 68, 'LO4.2': 70, 'LO5.1': 80, 'LO5.2': 75 },
  '230511009': { 'LO1.1': 80, 'LO1.2': 80, 'LO2.1': 70, 'LO2.2': 75, 'LO3.1': 80, 'LO3.2': 78, 'LO4.1': 72, 'LO4.2': 80, 'LO5.1': 80, 'LO5.2': 82 },
  '230511010': { 'LO1.1': 70, 'LO1.2': 80, 'LO2.1': 70, 'LO2.2': 65, 'LO3.1': 75, 'LO3.2': 70, 'LO4.1': 68, 'LO4.2': 72, 'LO5.1': 80, 'LO5.2': 78 },
  '230511011': { 'LO1.1': 70, 'LO1.2': 82, 'LO2.1': 60, 'LO2.2': 65, 'LO3.1': 70, 'LO3.2': 75, 'LO4.1': 60, 'LO4.2': 68, 'LO5.1': 80, 'LO5.2': 80 },
  '230511012': { 'LO1.1': 70, 'LO1.2': 78, 'LO2.1': 70, 'LO2.2': 72, 'LO3.1': 75, 'LO3.2': 70, 'LO4.1': 65, 'LO4.2': 70, 'LO5.1': 80, 'LO5.2': 76 },
  '230511030': { 'LO1.1': 0, 'LO1.2': 0, 'LO2.1': 0, 'LO2.2': 0, 'LO3.1': 0, 'LO3.2': 0, 'LO4.1': 0, 'LO4.2': 0, 'LO5.1': 0, 'LO5.2': 0 },
  '230511062': { 'LO1.1': 0, 'LO1.2': 0, 'LO2.1': 0, 'LO2.2': 0, 'LO3.1': 0, 'LO3.2': 0, 'LO4.1': 0, 'LO4.2': 0, 'LO5.1': 0, 'LO5.2': 0 },
};

/** Generate random scores for mahasiswa yang belum ada data mentah */
function generateRandomScore(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getDummyRawScores(): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = { ...baseRawScores };
  const subIds = dummyCPMK.flatMap(c => c.subCPMK.map(s => s.id));

  for (const mhs of dummyMahasiswa) {
    if (!result[mhs.npm]) {
      const scores: Record<string, number> = {};
      for (const subId of subIds) {
        scores[subId] = generateRandomScore(50, 95);
      }
      result[mhs.npm] = scores;
    }
  }

  return result;
}

/** Nilai SIAKAD dummy */
export function getDummySiakadScores(): Record<string, NilaiSIAKAD> {
  const result: Record<string, NilaiSIAKAD> = {};

  const baseSiakad: Record<string, NilaiSIAKAD> = {
    '230511001': { absensi: 100, tugas: 80, kuis: 75, uts: 89, uas: 55 },
    '230511002': { absensi: 86, tugas: 75, kuis: 35, uts: 10, uas: 65 },
    '230511003': { absensi: 79, tugas: 85, kuis: 86, uts: 92, uas: 70 },
    '230511004': { absensi: 100, tugas: 60, kuis: 75, uts: 58, uas: 30 },
    '230511005': { absensi: 93, tugas: 60, kuis: 75, uts: 68, uas: 70 },
    '230511006': { absensi: 100, tugas: 75, kuis: 65, uts: 31, uas: 55 },
    '230511007': { absensi: 100, tugas: 40, kuis: 75, uts: 81, uas: 55 },
    '230511008': { absensi: 93, tugas: 73, kuis: 70, uts: 68, uas: 70 },
    '230511009': { absensi: 93, tugas: 80, kuis: 70, uts: 10, uas: 40 },
    '230511010': { absensi: 100, tugas: 78, kuis: 75, uts: 74, uas: 55 },
    '230511011': { absensi: 100, tugas: 78, kuis: 55, uts: 42, uas: 60 },
    '230511012': { absensi: 93, tugas: 75, kuis: 70, uts: 73, uas: 65 },
    '230511030': { absensi: 0, tugas: 0, kuis: 0, uts: 0, uas: 0 },
    '230511062': { absensi: 0, tugas: 0, kuis: 0, uts: 0, uas: 0 },
  };

  for (const mhs of dummyMahasiswa) {
    result[mhs.npm] = baseSiakad[mhs.npm] ?? {
      absensi: generateRandomScore(70, 100),
      tugas: generateRandomScore(50, 90),
      kuis: generateRandomScore(40, 90),
      uts: generateRandomScore(40, 90),
      uas: generateRandomScore(40, 85),
    };
  }

  return result;
}

// ============================================================
// Config
// ============================================================

export const dummyOBEConfig: OBEConfig = {
  mataKuliah: {
    kode: 'MATH101',
    nama: 'Kalkulus 1',
    sks: 3,
    semester: 1,
    jurusan: 'Teknik Informatika',
    dosen: 'Esa Fauzi, S.T., M.T.',
    kelas: 'A',
    reg: 'Reg A',
  },
  cpmkList: dummyCPMK,
  ploList: dummyPLO,
  siakadWeights: DEFAULT_SIAKAD_WEIGHTS,
  mahasiswaList: dummyMahasiswa,
};
