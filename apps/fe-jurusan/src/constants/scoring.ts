// Kode-kode mata kuliah Pendidikan Agama yang dianggap 1 slot dalam perhitungan CPMK/CPL.
// Mahasiswa hanya mengambil SALAH SATU, jadi keseluruhan grup dihitung sebagai 1 MK.
export const RELIGION_COURSE_CODES = new Set([
  'MKU62101', 'MKU62102', 'MKU62103', 'MKU62104', 'MKU62105',
]);

/**
 * Menghitung jumlah MK efektif untuk denominasi nilai CPMK.
 * Seluruh MK agama (MKU62101-05) dihitung sebagai 1 slot, bukan 5.
 */
export function effectiveCourseCount(
  courseIds: string[],
  infoMap: Map<string, { code: string; name: string }>,
): number {
  if (courseIds.length === 0) return 0;
  let religionCount = 0;
  for (const id of courseIds) {
    if (RELIGION_COURSE_CODES.has(infoMap.get(id)?.code ?? '')) religionCount++;
  }
  return courseIds.length - religionCount + (religionCount > 0 ? 1 : 0);
}
