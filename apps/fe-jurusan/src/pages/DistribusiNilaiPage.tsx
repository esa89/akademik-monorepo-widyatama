import { useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { BarChart2, AlertTriangle, CheckCircle2 } from 'lucide-react';
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

// ─────────────────────────────────────────────────────────────────────────────
export default function DistribusiNilaiPage() {
  // All academic classes
  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['classes-distrib'],
    queryFn:  () => academicClassService.getAll({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });
  const allClasses = classesData?.data ?? [];

  // Unique course IDs
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

  // Weights per unique course
  const courseWeightResults = useQueries({
    queries: uniqueCourseIds.map((courseId) => ({
      queryKey: ['course-weights-distrib', courseId],
      queryFn:  () => courseCpmkWeightService.getAll({ courseId }),
      staleTime: 5 * 60 * 1000,
    })),
  });

  // courseId → weight lookup: `${cpmkId}:${compId}` → weight
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

  // Compute grade distribution per course
  const courseDistributions = useMemo((): CourseDist[] => {
    if (allClasses.length === 0) return [];

    // Group class indices by courseId
    const courseIndex = new Map<string, { name: string; code: string; semester: string; indices: number[] }>();
    allClasses.forEach((cls, i) => {
      if (!courseIndex.has(cls.course.id)) {
        courseIndex.set(cls.course.id, {
          name: cls.course.name,
          code: cls.course.code,
          semester: cls.semester?.name ?? '',
          indices: [],
        });
      }
      courseIndex.get(cls.course.id)!.indices.push(i);
    });

    const result: CourseDist[] = [];

    for (const [courseId, meta] of courseIndex) {
      const weightMap = courseWeightMap.get(courseId);

      // Accumulate per student: studentId → {wsum, wTotal}
      const studentScores = new Map<string, { wsum: number; wTotal: number; rawSum: number; rawN: number }>();

      for (const idx of meta.indices) {
        const scores = classScoreResults[idx]?.data?.data ?? [];
        for (const s of scores) {
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
  }, [allClasses, courseWeightMap, classScoreResults]);

  // Max count per band (for color intensity)
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

  const lowestCourse = courseDistributions[0];

  const scoresLoading = classScoreResults.some((r) => r.isLoading);
  const isLoading     = classesLoading || scoresLoading;
  const hasData       = courseDistributions.length > 0;

  return (
    <div className="space-y-6 pb-4">
      {/* ── Page header ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Distribusi Nilai Mata Kuliah</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Sebaran huruf mutu per MK · merah = tidak lulus · biru = lulus
        </p>
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
                <span className="font-semibold text-emerald-800">{avgPassRate}%</span>{' '}
                dari seluruh mata kuliah aktif semester ini
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
            <h2 className="text-base font-bold text-gray-800">Distribusi Nilai Mata Kuliah</h2>
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
              Pastikan data kelas, bobot CPMK, dan nilai sudah diinput.
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
                  {BANDS.map((b) => (
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
                      <div className="text-[11px] text-primary font-mono mt-0.5">{course.courseCode}</div>
                    </td>
                    {BANDS.map((b) => {
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
