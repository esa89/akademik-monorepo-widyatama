import { useMemo, useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { BarChart2, AlertTriangle, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import {
  academicClassService,
  studentCpmkScoreService,
  courseCpmkWeightService,
} from '@/services/obe.service';

// ── Grade bands ──────────────────────────────────────────────────────────────
const BANDS = [
  { key: 'E',  label: 'E',  sub: '0–49',   pass: false },
  { key: 'D',  label: 'D',  sub: '50–54',  pass: false },
  { key: 'CD', label: 'CD', sub: '55–59',  pass: false },
  { key: 'C',  label: 'C',  sub: '60–64',  pass: false },
  { key: 'BC', label: 'BC', sub: '65–69',  pass: true  },
  { key: 'B',  label: 'B',  sub: '70–74',  pass: true  },
  { key: 'AB', label: 'AB', sub: '75–79',  pass: true  },
  { key: 'A',  label: 'A',  sub: '80–100', pass: true  },
] as const;

type GradeKey = (typeof BANDS)[number]['key'];

function scoreToGrade(score: number): GradeKey {
  if (score >= 80) return 'A';
  if (score >= 75) return 'AB';
  if (score >= 70) return 'B';
  if (score >= 65) return 'BC';
  if (score >= 60) return 'C';
  if (score >= 55) return 'CD';
  if (score >= 50) return 'D';
  return 'E';
}


type CourseDist = {
  courseId:   string;
  courseName: string;
  courseCode: string;
  semester:   string;
  dist:       Record<GradeKey, number>;
  total:      number;
  passCount:  number;
  passRate:   number | null;
};

// ── Cell color helper ─────────────────────────────────────────────────────────
function cellCls(count: number, max: number, pass: boolean): string {
  if (count === 0) return '';
  const r = count / Math.max(max, 1);
  if (pass) {
    if (r >= 0.8) return 'bg-blue-700 text-white';
    if (r >= 0.6) return 'bg-blue-600 text-white';
    if (r >= 0.4) return 'bg-blue-400 text-white';
    if (r >= 0.2) return 'bg-blue-300 text-white';
    return 'bg-blue-200 text-blue-900';
  } else {
    if (r >= 0.8) return 'bg-red-500 text-white';
    if (r >= 0.6) return 'bg-red-400 text-white';
    if (r >= 0.4) return 'bg-red-300 text-white';
    if (r >= 0.2) return 'bg-red-200 text-red-900';
    return 'bg-red-100 text-red-800';
  }
}

// ── Checkbox helper ───────────────────────────────────────────────────────────
function Checkbox({ checked, onChange, label, accent }: {
  checked: boolean; onChange: () => void; label: string; accent?: string;
}) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none group">
      <div
        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
          checked
            ? (accent ?? 'bg-primary border-primary')
            : 'border-gray-300 bg-white group-hover:border-primary'
        }`}
        onClick={onChange}
      >
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="text-xs text-gray-700">{label}</span>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function DistribusiNilaiPage() {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [semesterFilter, setSemesterFilter] = useState('');
  const [gradeFilter, setGradeFilter]       = useState<Set<GradeKey>>(new Set());
  const [angkatanFilter, setAngkatanFilter] = useState<Set<number>>(new Set());

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['classes-distrib'],
    queryFn:  () => academicClassService.getAll({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });
  const allClasses = classesData?.data ?? [];

  const uniqueCourseIds = useMemo(
    () => [...new Set(allClasses.map((c) => c.course.id))],
    [allClasses],
  );

  // Scores per class
  const classScoreResults = useQueries({
    queries: allClasses.map((cls) => ({
      queryKey: ['class-scores-distrib', cls.id],
      queryFn:  () => studentCpmkScoreService.getByClass(cls.id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Class details (for student NIM → angkatan)
  const classDetailResults = useQueries({
    queries: allClasses.map((cls) => ({
      queryKey: ['class-detail-distrib', cls.id],
      queryFn:  () => academicClassService.getById(cls.id),
      staleTime: 10 * 60 * 1000,
    })),
  });

  // Weights per unique course
  const courseWeightResults = useQueries({
    queries: uniqueCourseIds.map((courseId) => ({
      queryKey: ['course-weights-distrib', courseId],
      queryFn:  () => courseCpmkWeightService.getAll({ courseId }),
      staleTime: 5 * 60 * 1000,
    })),
  });

  // ── Derived maps ──────────────────────────────────────────────────────────

  // courseId → weight lookup
  const courseWeightMap = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    uniqueCourseIds.forEach((courseId, i) => {
      const weights = courseWeightResults[i]?.data?.data ?? [];
      if (weights.length > 0) {
        const wm = new Map<string, number>();
        for (const w of weights) wm.set(`${w.cpmkId}:${w.assessmentComponentId}`, w.weight);
        map.set(courseId, wm);
      }
    });
    return map;
  }, [uniqueCourseIds, courseWeightResults]);

  // studentId → angkatan year (e.g. 2024) — from entryYear field
  const studentAngkatanMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of classDetailResults) {
      const students = r.data?.data?.students ?? [];
      for (const { student } of students) {
        if (!map.has(student.id) && student.entryYear) {
          map.set(student.id, student.entryYear);
        }
      }
    }
    return map;
  }, [classDetailResults]);

  // Available filter options
  const availableSemesters = useMemo(() => {
    const names = [...new Set(allClasses.map((c) => c.semester?.name ?? '').filter(Boolean))];
    return names.sort();
  }, [allClasses]);

  const availableAngkatan = [2024, 2025];

  // ── Grade distribution computation ───────────────────────────────────────
  const courseDistributions = useMemo((): CourseDist[] => {
    if (allClasses.length === 0) return [];

    // Group class indices by courseId, filtering by semester
    const courseIndex = new Map<string, { name: string; code: string; semester: string; indices: number[] }>();
    allClasses.forEach((cls, i) => {
      const semName = cls.semester?.name ?? '';
      if (semesterFilter && semName !== semesterFilter) return;

      if (!courseIndex.has(cls.course.id)) {
        courseIndex.set(cls.course.id, {
          name:     cls.course.name,
          code:     cls.course.code,
          semester: semName,
          indices:  [],
        });
      }
      courseIndex.get(cls.course.id)!.indices.push(i);
    });

    const result: CourseDist[] = [];

    for (const [courseId, meta] of courseIndex) {
      const weightMap = courseWeightMap.get(courseId);

      const studentScores = new Map<string, { wsum: number; wTotal: number; rawSum: number; rawN: number }>();

      for (const idx of meta.indices) {
        const scores = classScoreResults[idx]?.data?.data ?? [];
        for (const s of scores) {
          // Angkatan filter
          if (angkatanFilter.size > 0) {
            const year = studentAngkatanMap.get(s.studentId);
            if (!year || !angkatanFilter.has(year)) continue;
          }

          if (!studentScores.has(s.studentId)) {
            studentScores.set(s.studentId, { wsum: 0, wTotal: 0, rawSum: 0, rawN: 0 });
          }
          const acc = studentScores.get(s.studentId)!;
          acc.rawSum += s.score;
          acc.rawN   += 1;

          if (weightMap) {
            const w = weightMap.get(`${s.cpmkId}:${s.assessmentComponentId}`);
            if (w !== undefined) {
              acc.wsum   += s.score * w;
              acc.wTotal += w;
            }
          }
        }
      }

      if (studentScores.size === 0) continue;

      const dist = Object.fromEntries(BANDS.map((b) => [b.key, 0])) as Record<GradeKey, number>;
      let passCount = 0;

      for (const acc of studentScores.values()) {
        const finalScore = acc.wTotal > 0
          ? acc.wsum / acc.wTotal
          : acc.rawN > 0 ? acc.rawSum / acc.rawN : null;
        if (finalScore === null) continue;

        const grade = scoreToGrade(finalScore);
        dist[grade] += 1;
        if (BANDS.find((b) => b.key === grade)?.pass) passCount++;
      }

      const total = studentScores.size;
      result.push({
        courseId,
        courseName: meta.name,
        courseCode: meta.code,
        semester:   meta.semester,
        dist,
        total,
        passCount,
        passRate: total > 0 ? Math.round((passCount / total) * 100) : null,
      });
    }

    return result.sort((a, b) => (a.passRate ?? 0) - (b.passRate ?? 0));
  }, [allClasses, courseWeightMap, classScoreResults, semesterFilter, angkatanFilter, studentAngkatanMap]);

  // Visible bands (grade filter)
  const visibleBands = useMemo(
    () => gradeFilter.size > 0 ? BANDS.filter((b) => gradeFilter.has(b.key)) : [...BANDS],
    [gradeFilter],
  );

  // Max count per visible band (for color intensity)
  const maxPerBand = useMemo(() => {
    const m = {} as Record<GradeKey, number>;
    for (const b of BANDS) {
      m[b.key] = Math.max(1, ...courseDistributions.map((c) => c.dist[b.key] ?? 0));
    }
    return m;
  }, [courseDistributions]);

  const avgPassRate = useMemo(() => {
    const w = courseDistributions.filter((c) => c.passRate !== null);
    return w.length ? Math.round(w.reduce((s, c) => s + c.passRate!, 0) / w.length) : null;
  }, [courseDistributions]);

  const lowestCourse    = courseDistributions[0];
  const scoresLoading   = classScoreResults.some((r) => r.isLoading);
  const isLoading       = classesLoading || scoresLoading;
  const hasData         = courseDistributions.length > 0;

  // ── Toggle helpers ────────────────────────────────────────────────────────
  function toggleGrade(key: GradeKey) {
    setGradeFilter((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleAngkatan(year: number) {
    setAngkatanFilter((prev) => {
      const next = new Set(prev);
      next.has(year) ? next.delete(year) : next.add(year);
      return next;
    });
  }

  const activeFilterCount =
    (semesterFilter ? 1 : 0) + gradeFilter.size + angkatanFilter.size;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-4">
      {/* ── Page header ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Distribusi Nilai Mata Kuliah</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Sebaran huruf mutu per MK · merah = tidak lulus · biru = lulus
        </p>
      </div>

      {/* ── Filter panel ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
          <SlidersHorizontal size={14} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Filter</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
              {activeFilterCount} aktif
            </span>
          )}
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setSemesterFilter('');
                setGradeFilter(new Set());
                setAngkatanFilter(new Set());
              }}
              className="ml-auto text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Reset semua
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {/* Semester */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Semester</p>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">Semua Semester</option>
              {availableSemesters.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Nilai (grade bands) */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nilai</p>
              {gradeFilter.size > 0 && (
                <button
                  onClick={() => setGradeFilter(new Set())}
                  className="text-[11px] text-gray-400 hover:text-primary"
                >
                  Tampilkan semua
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {BANDS.map((b) => (
                <Checkbox
                  key={b.key}
                  checked={gradeFilter.has(b.key)}
                  onChange={() => toggleGrade(b.key)}
                  label={`${b.label} (${b.sub})`}
                  accent={b.pass ? 'bg-blue-600 border-blue-600' : 'bg-red-500 border-red-500'}
                />
              ))}
            </div>
            {gradeFilter.size > 0 && (
              <p className="text-[11px] text-gray-400 mt-2">
                Menampilkan kolom: {[...gradeFilter].join(', ')}
              </p>
            )}
          </div>

          {/* Angkatan */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Angkatan</p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {availableAngkatan.map((year) => (
                <Checkbox
                  key={year}
                  checked={angkatanFilter.has(year)}
                  onChange={() => toggleAngkatan(year)}
                  label={`Angkatan ${year}`}
                />
              ))}
            </div>
            {angkatanFilter.size > 0 && (
              <p className="text-[11px] text-gray-400 mt-2">
                Filter aktif: {[...angkatanFilter].sort().join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Alert banners ─────────────────────────────────────────── */}
      {hasData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowestCourse?.passRate !== null && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm">
              <AlertTriangle size={15} className="text-yellow-600 shrink-0 mt-0.5" />
              <span className="text-yellow-700">
                MK kelulusan terendah:{' '}
                <span className="font-semibold text-yellow-800">
                  {lowestCourse.courseName} ({lowestCourse.passRate}% lulus)
                </span>
              </span>
            </div>
          )}
          {avgPassRate !== null && (
            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-emerald-700">
                Rata-rata kelulusan{' '}
                <span className="font-semibold text-emerald-800">{avgPassRate}%</span>
                {semesterFilter && <> semester <span className="font-semibold text-emerald-800">{semesterFilter}</span></>}
                {angkatanFilter.size > 0 && <> · angkatan <span className="font-semibold text-emerald-800">{[...angkatanFilter].sort().join(', ')}</span></>}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Heatmap table ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Card header + legend */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              Distribusi Nilai Mata Kuliah
              {courseDistributions.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({courseDistributions.length} MK)
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-400">Sebaran huruf mutu per MK · merah = tidak lulus · biru = lulus</p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
            <span>Sedikit</span>
            <div className="w-5 h-5 rounded-md bg-blue-200" />
            <div className="w-5 h-5 rounded-md bg-blue-400" />
            <div className="w-5 h-5 rounded-md bg-blue-600" />
            <div className="w-5 h-5 rounded-md bg-blue-800" />
            <span>Banyak</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Memuat data distribusi nilai…
          </div>
        ) : !hasData ? (
          <div className="py-20 text-center">
            <BarChart2 size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-400">Belum ada data distribusi nilai.</p>
            <p className="text-xs text-gray-300 mt-1">
              {activeFilterCount > 0
                ? 'Coba ubah atau reset filter untuk melihat lebih banyak data.'
                : 'Pastikan data kelas, bobot CPMK, dan nilai sudah diinput.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 min-w-[220px]">
                    Mata Kuliah
                  </th>
                  {visibleBands.map((b) => (
                    <th
                      key={b.key}
                      className={`px-2 py-3 text-center text-xs font-bold min-w-[64px] ${
                        b.pass ? 'text-blue-600' : 'text-red-400'
                      }`}
                    >
                      <div>{b.label}</div>
                      <div className="text-[10px] font-normal text-gray-400">{b.sub}</div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 min-w-[64px]">
                    Lulus
                  </th>
                </tr>
              </thead>
              <tbody>
                {courseDistributions.map((course) => (
                  <tr
                    key={course.courseId}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-800 text-[13px] leading-snug">
                        {course.courseName}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-primary font-mono">{course.courseCode}</span>
                        {course.semester && (
                          <span className="text-[10px] text-gray-400">{course.semester}</span>
                        )}
                      </div>
                    </td>
                    {visibleBands.map((b) => {
                      const count = course.dist[b.key] ?? 0;
                      const cls   = cellCls(count, maxPerBand[b.key], b.pass);
                      return (
                        <td key={b.key} className="px-2 py-2">
                          {count > 0 ? (
                            <div className={`rounded-xl text-center font-semibold text-sm py-2 px-1 ${cls}`}>
                              {count}
                            </div>
                          ) : (
                            <div className="text-center text-gray-100 text-sm select-none">–</div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2 text-center">
                      {course.passRate !== null ? (
                        <span
                          className={`font-bold text-sm ${
                            course.passRate >= 80 ? 'text-emerald-600' :
                            course.passRate >= 65 ? 'text-yellow-600' : 'text-red-500'
                          }`}
                        >
                          {course.passRate}%
                        </span>
                      ) : (
                        <span className="text-gray-200 text-sm">–</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
