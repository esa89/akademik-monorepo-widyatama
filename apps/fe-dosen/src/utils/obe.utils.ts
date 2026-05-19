/**
 * Utility functions untuk kalkulasi OBE
 * Semua rumus berdasarkan spreadsheet OBE Widyatama
 */

import type {
  KualitatifLabel,
  NilaiMutu,
  NilaiSubCPMK,
  KetercapaianCPMK,
  NilaiPLO,
  NilaiSIAKAD,
  SiakadWeights,
  SummaryLO,
  CPMK,
  PLO,
  SubCPMK,
  NilaiOBEMahasiswa,
  Mahasiswa,
} from '@/types/obe.types';

import {
  KUALITATIF_THRESHOLDS,
  NILAI_MUTU_THRESHOLDS,
  DEFAULT_SIAKAD_WEIGHTS,
} from '@/types/obe.types';

// ============================================================
// Kalkulasi Dasar
// ============================================================

/**
 * Hitung nilai setelah persentase (bobot × persentase / 100)
 * Contoh: bobot=80, persentase=5 → 80 × 5 / 100 = 4
 */
export function calculateNilaiPersentase(bobot: number, persentase: number): number {
  return Math.round((bobot * persentase / 100) * 100) / 100;
}

/**
 * Hitung Z Nilai x Bobot
 * Z = nilai yang sudah dikalikan persentase (= nilaiPersentase)
 * Pada spreadsheet: kolom "Z Nilai x bobot" = bobot × (persentase/100)
 */
export function calculateZNilaiBobot(bobot: number, persentase: number): number {
  return calculateNilaiPersentase(bobot, persentase);
}

/**
 * Tentukan label kualitatif berdasarkan nilai kuantitatif
 * >= 80: EXCELLENT, >= 60: GOOD, >= 40: AVERAGE, < 40: POOR
 */
export function getKualitatif(kuantitatif: number): KualitatifLabel {
  for (const threshold of KUALITATIF_THRESHOLDS) {
    if (kuantitatif >= threshold.min) {
      return threshold.label;
    }
  }
  return 'POOR';
}

/**
 * Tentukan nilai mutu berdasarkan nilai akhir
 * >= 85: A, >= 80: A-, >= 75: B+, >= 70: B, >= 65: B-, >= 60: C+, >= 55: C, >= 40: D, < 40: E
 */
export function getNilaiMutu(nilaiAkhir: number): NilaiMutu {
  for (const threshold of NILAI_MUTU_THRESHOLDS) {
    if (nilaiAkhir >= threshold.min) {
      return threshold.mutu;
    }
  }
  return 'E';
}

// ============================================================
// Kalkulasi Per Mahasiswa
// ============================================================

/**
 * Hitung nilai Sub-CPMK untuk satu mahasiswa
 * @param subCPMK - definisi Sub-CPMK
 * @param nilaiMentah - nilai mentah (bobot) yang diperoleh mahasiswa
 */
export function calculateSubCPMKScore(subCPMK: SubCPMK, nilaiMentah: number): NilaiSubCPMK {
  const nilaiPersentase = calculateNilaiPersentase(nilaiMentah, subCPMK.persentase);
  return {
    subCPMKId: subCPMK.id,
    bobot: nilaiMentah,
    nilaiPersentase,
    zNilaiBobot: nilaiPersentase,
  };
}

/**
 * Hitung ketercapaian satu CPMK/LO untuk satu mahasiswa
 * Kuantitatif = Σ Z Nilai x Bobot dari semua Sub-CPMK yang terkait
 */
export function calculateKetercapaianCPMK(
  cpmk: CPMK,
  nilaiSubCPMKList: NilaiSubCPMK[]
): KetercapaianCPMK {
  // Filter nilaiSubCPMK yang termasuk dalam CPMK ini
  const subCPMKIds = new Set(cpmk.subCPMK.map(s => s.id));
  const relevantScores = nilaiSubCPMKList.filter(n => subCPMKIds.has(n.subCPMKId));

  const kuantitatif = relevantScores.reduce((sum, n) => sum + n.zNilaiBobot, 0);

  return {
    cpmkId: cpmk.id,
    kuantitatif: Math.round(kuantitatif * 100) / 100,
    kualitatif: getKualitatif(kuantitatif),
  };
}

/**
 * Hitung nilai PLO untuk satu mahasiswa
 * PLO = rata-rata kuantitatif dari CPMK yang dipetakan ke PLO tersebut
 */
export function calculateNilaiPLO(
  plo: PLO,
  ketercapaianList: KetercapaianCPMK[]
): NilaiPLO {
  const relevantCPMK = ketercapaianList.filter(k =>
    plo.cpmkIds.includes(k.cpmkId)
  );

  if (relevantCPMK.length === 0) {
    return {
      ploId: plo.id,
      nilai: 0,
      persentase: 100,
      kualitatif: 'POOR',
    };
  }

  const total = relevantCPMK.reduce((sum, k) => sum + k.kuantitatif, 0);
  const nilai = Math.round((total / relevantCPMK.length) * 100) / 100;

  return {
    ploId: plo.id,
    nilai,
    persentase: 100,
    kualitatif: getKualitatif(nilai),
  };
}

/**
 * Hitung nilai akhir SIAKAD (weighted sum)
 */
export function calculateNilaiAkhirSIAKAD(
  nilai: NilaiSIAKAD,
  weights: SiakadWeights = DEFAULT_SIAKAD_WEIGHTS
): number {
  const result =
    (nilai.absensi * weights.absensi / 100) +
    (nilai.tugas * weights.tugas / 100) +
    (nilai.kuis * weights.kuis / 100) +
    (nilai.uts * weights.uts / 100) +
    (nilai.uas * weights.uas / 100);

  return Math.round(result * 100) / 100;
}

// ============================================================
// Kalkulasi Lengkap (satu mahasiswa)
// ============================================================

/**
 * Hitung semua nilai OBE untuk satu mahasiswa
 */
export function calculateFullOBE(
  mahasiswa: Mahasiswa,
  cpmkList: CPMK[],
  ploList: PLO[],
  rawScores: Record<string, number>, // key = subCPMKId, value = nilai mentah
  nilaiSIAKAD: NilaiSIAKAD,
  siakadWeights: SiakadWeights = DEFAULT_SIAKAD_WEIGHTS
): NilaiOBEMahasiswa {
  // 1. Hitung semua Sub-CPMK scores
  const allSubCPMK: SubCPMK[] = cpmkList.flatMap(c => c.subCPMK);
  const nilaiSubCPMK: NilaiSubCPMK[] = allSubCPMK.map(sub =>
    calculateSubCPMKScore(sub, rawScores[sub.id] ?? 0)
  );

  // 2. Hitung ketercapaian per CPMK
  const ketercapaianCPMK: KetercapaianCPMK[] = cpmkList.map(cpmk =>
    calculateKetercapaianCPMK(cpmk, nilaiSubCPMK)
  );

  // 3. Hitung nilai per PLO
  const nilaiPLO: NilaiPLO[] = ploList.map(plo =>
    calculateNilaiPLO(plo, ketercapaianCPMK)
  );

  // 4. Hitung nilai akhir & mutu
  const nilaiAkhir = calculateNilaiAkhirSIAKAD(nilaiSIAKAD, siakadWeights);
  const nilaiMutu = getNilaiMutu(nilaiAkhir);

  return {
    mahasiswa,
    nilaiSubCPMK,
    ketercapaianCPMK,
    nilaiPLO,
    nilaiSIAKAD,
    nilaiAkhir,
    nilaiMutu,
  };
}

// ============================================================
// Summary / Aggregation
// ============================================================

/**
 * Hitung summary per CPMK/LO dari seluruh mahasiswa
 * Keberhasilan = (excellent + good + average) / total × 100
 * (di spreadsheet: non-POOR / total)
 */
export function calculateSummaryLO(
  cpmk: CPMK,
  allMahasiswa: NilaiOBEMahasiswa[]
): SummaryLO {
  let excellent = 0;
  let good = 0;
  let average = 0;
  let poor = 0;

  allMahasiswa.forEach(mhs => {
    const ketercapaian = mhs.ketercapaianCPMK.find(k => k.cpmkId === cpmk.id);
    if (ketercapaian) {
      switch (ketercapaian.kualitatif) {
        case 'EXCELLENT': excellent++; break;
        case 'GOOD': good++; break;
        case 'AVERAGE': average++; break;
        case 'POOR': poor++; break;
      }
    }
  });

  const total = excellent + good + average + poor;
  // Keberhasilan di spreadsheet: 87.88% = (excellent + good) / total
  // Tapi juga bisa (non-POOR)/total. Dari data: 21/33 = 63.6% bukan 87.88%
  // (21+0+8)/33 = 87.88% → jadi keberhasilan = (non-POOR) / total
  const keberhasilan = total > 0
    ? Math.round(((excellent + good + average) / total) * 10000) / 100
    : 0;

  return {
    cpmkId: cpmk.id,
    cpmkNama: cpmk.nama,
    excellent,
    good,
    average,
    poor,
    total,
    keberhasilan,
  };
}

/**
 * Hitung semua summary LO
 */
export function calculateAllSummaryLO(
  cpmkList: CPMK[],
  allMahasiswa: NilaiOBEMahasiswa[]
): SummaryLO[] {
  return cpmkList.map(cpmk => calculateSummaryLO(cpmk, allMahasiswa));
}

// ============================================================
// Warna & Styling Helpers
// ============================================================

/** Warna background untuk kualitatif */
export function getKualitatifColor(label: KualitatifLabel): {
  bg: string;
  text: string;
  bgClass: string;
  textClass: string;
} {
  switch (label) {
    case 'EXCELLENT':
      return { bg: '#dcfce7', text: '#166534', bgClass: 'bg-green-100', textClass: 'text-green-800' };
    case 'GOOD':
      return { bg: '#dbeafe', text: '#1e40af', bgClass: 'bg-blue-100', textClass: 'text-blue-800' };
    case 'AVERAGE':
      return { bg: '#fef9c3', text: '#854d0e', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' };
    case 'POOR':
      return { bg: '#fecaca', text: '#991b1b', bgClass: 'bg-red-100', textClass: 'text-red-800' };
  }
}

/** Warna untuk nilai mutu */
export function getNilaiMutuColor(mutu: NilaiMutu): string {
  if (mutu === 'A' || mutu === 'A-') return 'text-green-700';
  if (mutu === 'B+' || mutu === 'B' || mutu === 'B-') return 'text-blue-700';
  if (mutu === 'C+' || mutu === 'C') return 'text-yellow-700';
  return 'text-red-700';
}
