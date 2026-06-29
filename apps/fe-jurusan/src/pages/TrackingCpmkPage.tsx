import { useState, useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import {
  BookOpen, Target, Search, X, Users, CheckCircle2,
  AlertTriangle, Layers, TrendingUp, BookOpenCheck, SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw,
} from 'lucide-react';
import {
  academicClassService, studentCpmkScoreService, cplService, cpmkService,
  cpmkCourseMappingService, subCpmkService, courseService,
} from '@/services/obe.service';
import { useApp } from '@/contexts/AppContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_THRESHOLDS: Record<string, number> = {
  SIKAP: 80, PENGETAHUAN: 70, KETERAMPILAN_UMUM: 75, KETERAMPILAN_KHUSUS: 75,
};

const CATEGORY_LABEL: Record<string, string> = {
  SIKAP: 'Sikap', PENGETAHUAN: 'Pengetahuan',
  KETERAMPILAN_UMUM: 'Keterampilan Umum', KETERAMPILAN_KHUSUS: 'Keterampilan Khusus',
};

const CATEGORY_CHIP: Record<string, string> = {
  SIKAP:               'bg-blue-100 text-blue-700',
  PENGETAHUAN:         'bg-purple-100 text-purple-700',
  KETERAMPILAN_UMUM:   'bg-teal-100 text-teal-700',
  KETERAMPILAN_KHUSUS: 'bg-orange-100 text-orange-700',
};

function scoreColor(s: number) {
  if (s >= 75) return { bar: '#10b981', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  if (s >= 50) return { bar: '#f59e0b', text: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200'   };
  return           { bar: '#f87171', text: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200'     };
}

// ─── Threshold Panel ─────────────────────────────────────────────────────────

interface ThresholdPanelProps {
  thresholds: Record<string, number>;
  onChange: (cat: string, val: number) => void;
  onReset: () => void;
}

function ThresholdPanel({ thresholds, onChange, onReset }: ThresholdPanelProps) {
  return (
    <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Atur Threshold Kelulusan CPL</p>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-primary transition-colors"
        >
          <RotateCcw size={11} /> Reset default
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${CATEGORY_CHIP[key] ?? 'bg-gray-100 text-gray-600'}`}>
                {label}
              </label>
              <span className="text-sm font-bold text-gray-800">{thresholds[key]}%</span>
            </div>
            <input
              type="range" min={0} max={100} step={1}
              value={thresholds[key]}
              onChange={(e) => onChange(key, Number(e.target.value))}
              className="w-full h-1.5 rounded-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>0%</span><span>100%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TrackingCpmkPage() {
  const { selectedCurriculum } = useApp();
  const curriculumId = selectedCurriculum?.id;

  const [selectedCpmkId,         setSelectedCpmkId        ] = useState<string | null>(null);
  const [search,                  setSearch                ] = useState('');
  const [filterCplCode,           setFilterCplCode         ] = useState('');
  const [studentSearch,           setStudentSearch         ] = useState('');
  const [selectedAngkatanFilter,  setSelectedAngkatanFilter] = useState<number[]>([]);
  const [thresholds,              setThresholds            ] = useState<Record<string, number>>(DEFAULT_THRESHOLDS);
  const [showThresholds,          setShowThresholds        ] = useState(false);

  // ── Base queries ───────────────────────────────────────────────────────────
  const { data: cpmkMkMatrix } = useQuery({
    queryKey: ['cpmk-mk-matrix-cpmk-tracking', curriculumId, selectedCurriculum?.year],
    queryFn:  () => cpmkCourseMappingService.getMatrix({ curriculumId: curriculumId!, curriculumYear: selectedCurriculum?.year }),
    enabled:  !!curriculumId,
    staleTime: 10 * 60 * 1000,
  });

  const { data: cplListData } = useQuery({
    queryKey: ['cpl-list-full'],
    queryFn:  () => cplService.getAll({ limit: 100 }),
    staleTime: 10 * 60 * 1000,
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes-all-cpmk-tracking'],
    queryFn:  async () => {
      const first = await academicClassService.getAll({ limit: 100, page: 1 });
      if (!first.meta.hasNextPage) return first;
      const rest = await Promise.all(
        Array.from({ length: first.meta.totalPages - 1 }, (_, i) =>
          academicClassService.getAll({ limit: 100, page: i + 2 })
        )
      );
      return { ...first, data: [...first.data, ...rest.flatMap((p) => p.data)] };
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: selectedCpmkDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['cpmk-detail-cpmk-tracking', selectedCpmkId],
    queryFn:  () => cpmkService.getById(selectedCpmkId!),
    enabled:  !!selectedCpmkId,
    staleTime: 10 * 60 * 1000,
  });

  const { data: subCpmkData } = useQuery({
    queryKey: ['sub-cpmk-by-cpmk-tracking', selectedCpmkId],
    queryFn:  () => subCpmkService.getAll({ cpmkId: selectedCpmkId!, limit: 100 }),
    enabled:  !!selectedCpmkId,
    staleTime: 10 * 60 * 1000,
  });

  // ── Derived base ───────────────────────────────────────────────────────────
  const allClasses = classesData?.data ?? [];
  const allCpls    = useMemo(() =>
    [...(cplListData?.data ?? [])].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })),
    [cplListData]
  );

  const allCpmkRows = useMemo(() => {
    const m = cpmkMkMatrix?.data;
    if (!m) return [];
    return [
      ...(m.matrix ?? []).flatMap((r) => r.cpmks),
      ...(m.unmappedCpmks ?? []),
    ].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }, [cpmkMkMatrix]);

  // cpmkId → courseIds[] (from OBE matrix)
  const cpmkIdToCourseIds = useMemo(() => {
    const map = new Map<string, string[]>();
    allCpmkRows.forEach((c) => { if (c.courseIds?.length) map.set(c.id, c.courseIds); });
    return map;
  }, [allCpmkRows]);

  // cplById for category lookup
  const cplById = useMemo(() => new Map(allCpls.map((c) => [c.id, c])), [allCpls]);

  // All unique curriculum course IDs
  const allCurriculumCourseIds = useMemo(() => {
    const ids = new Set<string>();
    for (const courseIds of cpmkIdToCourseIds.values()) courseIds.forEach((id) => ids.add(id));
    return [...ids];
  }, [cpmkIdToCourseIds]);

  // Fetch each curriculum course info directly
  const courseByIdResults = useQueries({
    queries: allCurriculumCourseIds.map((courseId) => ({
      queryKey: ['course-by-id-cpmk-tracking', courseId],
      queryFn:  () => courseService.getById(courseId),
      staleTime: 30 * 60 * 1000,
    })),
  });

  const courseInfoMap = useMemo(() => {
    const m = new Map<string, { code: string; name: string }>();
    courseByIdResults.forEach((q, i) => {
      const courseId = allCurriculumCourseIds[i];
      const course   = q.data?.data;
      if (course) m.set(courseId, { code: course.code, name: course.name });
    });
    allClasses.forEach((cls) => {
      if (!m.has(cls.course.id)) m.set(cls.course.id, { code: cls.course.code, name: cls.course.name });
    });
    return m;
  }, [courseByIdResults, allCurriculumCourseIds, allClasses]);

  // ── Scores: all classes ────────────────────────────────────────────────────
  const classScoreResults = useQueries({
    queries: allClasses.map((cls) => ({
      queryKey: ['class-scores-cpmk-tracking', cls.id],
      queryFn:  () => studentCpmkScoreService.getByClass(cls.id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  // cpmkId → courseId → studentId → scores[]
  // Also track which class IDs have scores per CPMK (for student info loading)
  const { cpmkCourseStudentScores, cpmkToClassIds } = useMemo(() => {
    const scores  = new Map<string, Map<string, Map<string, number[]>>>();
    const classIds = new Map<string, Set<string>>();
    for (const res of classScoreResults) {
      for (const s of res.data?.data ?? []) {
        if (!scores.has(s.cpmkId))  scores.set(s.cpmkId, new Map());
        const cm = scores.get(s.cpmkId)!;
        if (!cm.has(s.courseId))    cm.set(s.courseId, new Map());
        const sm = cm.get(s.courseId)!;
        if (!sm.has(s.studentId))   sm.set(s.studentId, []);
        sm.get(s.studentId)!.push(s.score);

        if (!classIds.has(s.cpmkId)) classIds.set(s.cpmkId, new Set());
        classIds.get(s.cpmkId)!.add(s.classId);
      }
    }
    return { cpmkCourseStudentScores: scores, cpmkToClassIds: classIds };
  }, [classScoreResults]);

  const classesLoaded = !!classesData;
  const scoresLoading = !classesLoaded || classScoreResults.some((r) => r.isLoading);

  // ── Student details: load class details for classes that actually have scores ─
  const selectedCpmkCourseIds = useMemo(
    () => selectedCpmkId ? (cpmkIdToCourseIds.get(selectedCpmkId) ?? []) : [],
    [selectedCpmkId, cpmkIdToCourseIds],
  );

  const selectedCpmkClassIds = useMemo(
    () => selectedCpmkId ? (cpmkToClassIds.get(selectedCpmkId) ?? new Set<string>()) : new Set<string>(),
    [selectedCpmkId, cpmkToClassIds],
  );

  // Match by class ID (from score records) — avoids OBE vs akademik course ID mismatch
  const relevantClasses = useMemo(
    () => allClasses.filter((cls) => selectedCpmkClassIds.has(cls.id)),
    [allClasses, selectedCpmkClassIds],
  );

  const classDetailResults = useQueries({
    queries: relevantClasses.map((cls) => ({
      queryKey: ['class-detail-cpmk-tracking', cls.id],
      queryFn:  () => academicClassService.getById(cls.id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const studentInfoMap = useMemo(() => {
    const map = new Map<string, { nim: string; name: string; entryYear: number }>();
    classDetailResults.forEach((res) => {
      for (const { student } of res.data?.data?.students ?? []) {
        map.set(student.id, student);
      }
    });
    return map;
  }, [classDetailResults]);

  const studentsLoading = classDetailResults.some((r) => r.isLoading);

  // ── Helper: get threshold for a CPMK ─────────────────────────────────────
  const getCpmkThreshold = useMemo(() => {
    return (cpmkRow: typeof allCpmkRows[0] | undefined) => {
      if (!cpmkRow) return 60;
      const cats = (cpmkRow.cpls ?? [])
        .map((c) => cplById.get(c.id)?.category)
        .filter(Boolean) as string[];
      if (cats.length === 0) return 60;
      return Math.min(...cats.map((cat) => thresholds[cat] ?? 60));
    };
  }, [allCpmkRows, cplById, thresholds]);

  // ── Per-CPMK list stats ────────────────────────────────────────────────────
  const cpmkListStats = useMemo(() => {
    const stats = new Map<string, { totalStudents: number; avgScore: number; passRate: number; scoredMk: number }>();
    for (const [cpmkId, courseMap] of cpmkCourseStudentScores) {
      const totalCurr   = cpmkIdToCourseIds.get(cpmkId)?.length ?? courseMap.size;
      const cpmkRow     = allCpmkRows.find((c) => c.id === cpmkId);
      const threshold   = getCpmkThreshold(cpmkRow);
      const allStuds    = new Set<string>();
      courseMap.forEach((sm) => sm.forEach((_, sid) => allStuds.add(sid)));
      let totalScore = 0, pass = 0;
      for (const sid of allStuds) {
        let sum = 0;
        for (const [, sm] of courseMap) {
          const sc = sm.get(sid);
          if (sc) sum += sc.reduce((a, b) => a + b, 0) / sc.length;
        }
        const adj = sum / totalCurr;
        totalScore += adj;
        if (adj >= threshold) pass++;
      }
      const n = allStuds.size;
      stats.set(cpmkId, {
        totalStudents: n,
        avgScore:  n > 0 ? Math.round(totalScore / n) : 0,
        passRate:  n > 0 ? Math.round((pass / n) * 100) : 0,
        scoredMk:  courseMap.size,
      });
    }
    return stats;
  }, [cpmkCourseStudentScores, cpmkIdToCourseIds, allCpmkRows, getCpmkThreshold]);

  // ── Selected CPMK threshold ────────────────────────────────────────────────
  const selectedCpmkRow    = selectedCpmkId ? allCpmkRows.find((c) => c.id === selectedCpmkId) : null;
  const selectedThreshold  = getCpmkThreshold(selectedCpmkRow ?? undefined);

  // ── Selected CPMK per-course stats ────────────────────────────────────────
  const selectedPerCourseStats = useMemo(() => {
    if (!selectedCpmkId) return [];
    const courseMap = cpmkCourseStudentScores.get(selectedCpmkId) ?? new Map();
    return selectedCpmkCourseIds.map((courseId) => {
      const sm   = courseMap.get(courseId) ?? new Map<string, number[]>();
      const info = courseInfoMap.get(courseId);
      let totalScore = 0, pass = 0;
      for (const scores of sm.values()) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        totalScore += avg;
        if (avg >= selectedThreshold) pass++;
      }
      const n = sm.size;
      const hasCls = allClasses.some((cls) => cls.course.id === courseId);
      const hasScoreData = sm.size > 0;
      return {
        courseId,
        code:          info?.code ?? courseId.slice(0, 8),
        name:          info?.name ?? '–',
        totalStudents: n,
        avgScore:      n > 0 ? Math.round(totalScore / n) : null as number | null,
        passRate:      n > 0 ? Math.round((pass / n) * 100) : null as number | null,
        hasData:       n > 0,
        hasCls:        hasCls || hasScoreData,
      };
    }).sort((a, b) => a.code.localeCompare(b.code));
  }, [selectedCpmkId, cpmkCourseStudentScores, selectedCpmkCourseIds, courseInfoMap, selectedThreshold, allClasses]);

  // ── Selected CPMK per-student scores ──────────────────────────────────────
  const selectedStudentScores = useMemo(() => {
    if (!selectedCpmkId) return [];
    const courseMap   = cpmkCourseStudentScores.get(selectedCpmkId) ?? new Map();
    const totalCurr   = cpmkIdToCourseIds.get(selectedCpmkId)?.length ?? courseMap.size;
    const allStuds    = new Set<string>();
    courseMap.forEach((sm) => sm.forEach((_, sid) => allStuds.add(sid)));

    return [...allStuds].map((studentId) => {
      const info: { nim: string; name: string; entryYear: number } | undefined = studentInfoMap.get(studentId);
      const perCourse: Record<string, number> = {};
      let sum = 0;
      for (const [courseId, sm] of courseMap) {
        const sc = sm.get(studentId);
        if (sc) {
          const avg = sc.reduce((a, b) => a + b, 0) / sc.length;
          perCourse[courseId] = Math.round(avg);
          sum += avg;
        }
      }
      const adjScore = Math.round(sum / totalCurr);
      return {
        studentId,
        nim:       info?.nim      ?? '–',
        name:      info?.name     ?? studentId.slice(0, 8),
        entryYear: info?.entryYear ?? 0,
        perCourse,
        adjScore,
        passed: adjScore >= selectedThreshold,
      };
    }).sort((a, b) => b.adjScore - a.adjScore);
  }, [selectedCpmkId, cpmkCourseStudentScores, studentInfoMap, cpmkIdToCourseIds, selectedThreshold]);

  // ── Angkatan filter ────────────────────────────────────────────────────────
  const uniqueAngkatan = useMemo(() => {
    const years = new Set<number>();
    selectedStudentScores.forEach((s) => { if (s.entryYear) years.add(s.entryYear); });
    return [...years].sort();
  }, [selectedStudentScores]);

  const filteredStudents = useMemo(() => {
    let list = selectedStudentScores;
    if (selectedAngkatanFilter.length > 0) {
      list = list.filter((s) => selectedAngkatanFilter.includes(s.entryYear));
    }
    const q = studentSearch.trim().toLowerCase();
    if (q) list = list.filter((s) => s.name.toLowerCase().includes(q) || s.nim.includes(q));
    return list;
  }, [selectedStudentScores, studentSearch, selectedAngkatanFilter]);

  // ── CPMK list filter ──────────────────────────────────────────────────────
  const filteredCpmks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allCpmkRows.filter((c) => {
      const matchSearch = !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
      const matchCpl    = !filterCplCode || c.cpls.some((cpl) => cpl.code === filterCplCode);
      return matchSearch && matchCpl;
    });
  }, [allCpmkRows, search, filterCplCode]);

  const selectedLinkedCpls = useMemo(() =>
    (selectedCpmkRow?.cpls ?? []).map((c) => ({ ...c, category: cplById.get(c.id)?.category ?? '' })),
    [selectedCpmkRow, cplById]
  );
  const subCpmks        = subCpmkData?.data ?? [];
  const selectedStats   = selectedCpmkId ? cpmkListStats.get(selectedCpmkId) : null;
  const cpmkDescription = selectedCpmkDetail?.data?.description;
  const isBaseLoading   = !cpmkMkMatrix;

  const uniqueCplCodes = useMemo(() => {
    const codes = new Set<string>();
    allCpmkRows.forEach((c) => c.cpls.forEach((cpl) => codes.add(cpl.code)));
    return [...codes].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [allCpmkRows]);

  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)] overflow-hidden">

      {/* ══ Left Panel: CPMK List ═══════════════════════════════════════════ */}
      <div className="w-[300px] shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <BookOpenCheck size={15} className="text-primary" />
            <h2 className="text-sm font-bold text-gray-800">CPMK Kurikulum</h2>
            <span className="ml-auto text-[11px] bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">
              {filteredCpmks.length}
            </span>
          </div>

          <div className="relative mb-2">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari kode atau nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={11} />
              </button>
            )}
          </div>

          <select
            value={filterCplCode}
            onChange={(e) => setFilterCplCode(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Semua CPL</option>
            {uniqueCplCodes.map((code) => <option key={code} value={code}>{code}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isBaseLoading ? (
            <div className="p-3 space-y-2">
              {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : filteredCpmks.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400 italic">
              Tidak ada CPMK ditemukan.
            </div>
          ) : filteredCpmks.map((cpmk) => {
            const stats     = cpmkListStats.get(cpmk.id);
            const totalMk   = cpmkIdToCourseIds.get(cpmk.id)?.length ?? 0;
            const isSelected = selectedCpmkId === cpmk.id;
            const sc        = stats ? scoreColor(stats.avgScore) : null;

            return (
              <button
                key={cpmk.id}
                onClick={() => { setSelectedCpmkId(cpmk.id); setStudentSearch(''); setSelectedAngkatanFilter([]); }}
                className={`w-full text-left px-3 py-3 border-b border-gray-50 last:border-0 transition-all
                  ${isSelected ? 'bg-primary/5 border-l-[3px] border-l-primary pl-[9px]' : 'hover:bg-gray-50/80'}`}
              >
                <div className="flex items-start gap-2 mb-1.5">
                  <span className={`text-[11px] font-bold font-mono shrink-0 mt-0.5 ${isSelected ? 'text-primary' : 'text-violet-600'}`}>
                    {cpmk.code}
                  </span>
                  <span className="text-[11px] text-gray-700 leading-snug line-clamp-2 flex-1">{cpmk.name}</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {cpmk.cpls.slice(0, 4).map((cpl) => {
                    const cat = cplById.get(cpl.id)?.category ?? '';
                    return (
                      <span key={cpl.id} className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${CATEGORY_CHIP[cat] ?? 'bg-gray-100 text-gray-600'}`}>
                        {cpl.code}
                      </span>
                    );
                  })}
                  <span className="ml-auto text-[10px] text-gray-400">{totalMk} MK</span>
                  {stats && sc && (
                    <span className={`text-[10px] font-bold ${sc.text}`}>{stats.passRate}%</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ Right Panel: Detail ══════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-w-0">
        {!selectedCpmkRow ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <BookOpenCheck size={40} className="mb-3 opacity-20" />
            <p className="text-sm font-medium text-gray-500">Pilih CPMK dari daftar</p>
            <p className="text-xs mt-1 text-gray-400">untuk melihat relasi, capaian, dan nilai mahasiswa</p>
          </div>
        ) : (
          <>
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-xs font-bold font-mono text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-0.5 rounded-full">
                      {selectedCpmkRow.code}
                    </span>
                    {selectedLinkedCpls.map((cpl) => (
                      <span key={cpl.id} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${CATEGORY_CHIP[cpl.category] ?? 'bg-gray-100 text-gray-600'}`}>
                        {cpl.code}
                      </span>
                    ))}
                  </div>
                  <h1 className="text-base font-bold text-gray-900 leading-snug">{selectedCpmkRow.name}</h1>
                  {cpmkDescription && (
                    <p className="text-xs text-gray-500 leading-relaxed mt-1.5">{cpmkDescription}</p>
                  )}
                </div>

                {/* Threshold toggle */}
                <button
                  onClick={() => setShowThresholds((p) => !p)}
                  className={`flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border transition-colors shrink-0
                    ${showThresholds
                      ? 'bg-primary text-white border-primary'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/40 hover:text-primary'}`}
                >
                  <SlidersHorizontal size={12} />
                  Threshold
                  {showThresholds ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>
              </div>

              {/* Threshold sliders */}
              {showThresholds && (
                <ThresholdPanel
                  thresholds={thresholds}
                  onChange={(cat, val) => setThresholds((prev) => ({ ...prev, [cat]: val }))}
                  onReset={() => setThresholds(DEFAULT_THRESHOLDS)}
                />
              )}

              {/* Quick stat tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
                {[
                  {
                    label: 'Mata Kuliah',
                    value: selectedCpmkCourseIds.length,
                    sub:   `${selectedPerCourseStats.filter((s) => s.hasData).length} sudah dinilai`,
                    icon: <BookOpen size={14} className="text-indigo-500" />,
                    bg: 'bg-indigo-50',
                  },
                  {
                    label: 'CPL Terhubung',
                    value: selectedLinkedCpls.length,
                    sub:   selectedLinkedCpls.map((c) => c.code).join(', ') || '–',
                    icon: <Target size={14} className="text-primary" />,
                    bg: 'bg-blue-50',
                  },
                  {
                    label: 'Sub-CPMK',
                    value: subCpmks.length,
                    sub:   'sub-capaian terdaftar',
                    icon: <Layers size={14} className="text-teal-500" />,
                    bg: 'bg-teal-50',
                  },
                  {
                    label: 'Mhs Dinilai',
                    value: selectedStats?.totalStudents ?? 0,
                    sub:   selectedStats ? `avg ${selectedStats.avgScore} · ${selectedStats.passRate}% lulus` : scoresLoading ? 'Memuat...' : '–',
                    icon: <Users size={14} className="text-emerald-500" />,
                    bg: 'bg-emerald-50',
                  },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3`}>
                    <div className="flex items-center gap-1.5 mb-1">{s.icon}<span className="text-[10px] text-gray-500 font-medium">{s.label}</span></div>
                    <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Relasi: CPL | Mata Kuliah | Sub-CPMK ────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* CPL */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={14} className="text-primary shrink-0" />
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">CPL Terhubung</h3>
                </div>
                {selectedLinkedCpls.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Belum ada CPL</p>
                ) : (
                  <div className="space-y-2">
                    {selectedLinkedCpls.map((cpl) => {
                      const fullCpl = cplById.get(cpl.id);
                      return (
                        <div key={cpl.id} className="rounded-xl bg-gray-50 border border-gray-100 p-2.5">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[11px] font-bold text-primary font-mono">{cpl.code}</span>
                            {cpl.category && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${CATEGORY_CHIP[cpl.category] ?? 'bg-gray-100 text-gray-600'}`}>
                                {cpl.category.replace(/_/g, ' ')}
                              </span>
                            )}
                            <span className="ml-auto text-[9px] text-gray-400">threshold ≥{thresholds[cpl.category] ?? 60}%</span>
                          </div>
                          <p className="text-[10px] text-gray-500 leading-snug line-clamp-3">{fullCpl?.name ?? cpl.name}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mata Kuliah */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={14} className="text-indigo-500 shrink-0" />
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Mata Kuliah</h3>
                </div>
                {selectedCpmkCourseIds.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Belum ada mata kuliah</p>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {selectedCpmkCourseIds.map((courseId) => {
                      const info   = courseInfoMap.get(courseId);
                      const stat   = selectedPerCourseStats.find((s) => s.courseId === courseId);
                      const sc     = stat?.avgScore != null ? scoreColor(stat.avgScore) : null;
                      return (
                        <div key={courseId} className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-2">
                          <span className="text-[11px] font-bold text-indigo-600 font-mono shrink-0 w-16 truncate">
                            {info?.code ?? courseId.slice(0, 8)}
                          </span>
                          <span className="text-[10px] text-gray-600 truncate flex-1">{info?.name ?? '–'}</span>
                          {stat?.hasData && stat.avgScore != null ? (
                            <span className={`text-[9px] font-bold shrink-0 ${sc!.text}`}>{stat.avgScore}</span>
                          ) : (
                            <span className="text-[9px] text-gray-300 shrink-0">{stat?.hasCls ? '–' : 'No kelas'}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sub-CPMK */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={14} className="text-teal-500 shrink-0" />
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Sub-CPMK</h3>
                </div>
                {detailLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
                  </div>
                ) : subCpmks.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Belum ada sub-CPMK</p>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {subCpmks.map((sub) => (
                      <div key={sub.id} className="rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-2">
                        <div className="flex items-start gap-2">
                          <span className="text-[11px] font-bold text-teal-600 font-mono shrink-0">{sub.code}</span>
                          <span className="text-[10px] text-gray-600 leading-snug">{sub.name}</span>
                        </div>
                        {sub.targetPercentage > 0 && (
                          <p className="text-[9px] text-gray-400 mt-0.5">Target: {sub.targetPercentage}%</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Capaian per Mata Kuliah ──────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <TrendingUp size={15} className="text-primary shrink-0" />
                <h3 className="text-sm font-bold text-gray-800">Capaian per Mata Kuliah</h3>
                <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full ml-1">
                  threshold ≥{selectedThreshold}%
                </span>
              </div>

              {scoresLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-[80px_1fr_64px_52px_200px] gap-3 px-4 py-2 bg-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                    <span>Kode</span>
                    <span>Mata Kuliah</span>
                    <span className="text-right">Mhs</span>
                    <span className="text-right">Avg</span>
                    <span className="text-right">% Lulus</span>
                  </div>
                  {selectedPerCourseStats.map((cs) => {
                    const sc = cs.avgScore != null ? scoreColor(cs.avgScore) : null;
                    return (
                      <div key={cs.courseId} className="grid grid-cols-[80px_1fr_64px_52px_200px] gap-3 items-center px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                        <span className="text-[11px] font-bold text-indigo-600 font-mono truncate">{cs.code}</span>
                        <span className="text-xs text-gray-700 truncate">{cs.name}</span>
                        <span className="text-xs text-gray-500 text-right">{cs.hasData ? cs.totalStudents : '–'}</span>
                        <span className={`text-xs font-bold text-right ${sc ? sc.text : 'text-gray-300'}`}>
                          {cs.avgScore ?? '–'}
                        </span>
                        <div className="flex items-center gap-2">
                          {cs.hasData ? (
                            <>
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${cs.passRate}%`, backgroundColor: sc?.bar }} />
                              </div>
                              <span className={`text-xs font-bold shrink-0 w-10 text-right ${sc!.text}`}>{cs.passRate}%</span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-300 w-full text-right">
                              {cs.hasCls ? 'Belum ada nilai' : 'Belum ada kelas'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* ── Nilai Mahasiswa ──────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start gap-3 flex-wrap">
                  <Users size={15} className="text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-800">Nilai Mahasiswa</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {selectedStudentScores.length} mhs ·
                      nilai CPMK = Σ nilai per MK ÷ {selectedCpmkCourseIds.length} total MK ·
                      threshold ≥{selectedThreshold}%
                    </p>
                  </div>
                  <div className="relative w-48 shrink-0">
                    <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Cari nama atau NIM..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Angkatan filter */}
                {uniqueAngkatan.length > 1 && (
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-[10px] text-gray-400 font-medium">Angkatan:</span>
                    <button
                      onClick={() => setSelectedAngkatanFilter([])}
                      className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold transition-colors
                        ${selectedAngkatanFilter.length === 0
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-primary/40'}`}
                    >
                      Semua
                    </button>
                    {uniqueAngkatan.map((year) => (
                      <button
                        key={year}
                        onClick={() => setSelectedAngkatanFilter((prev) =>
                          prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
                        )}
                        className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold transition-colors
                          ${selectedAngkatanFilter.includes(year)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-primary/40'}`}
                      >
                        {year}
                      </button>
                    ))}
                    {selectedAngkatanFilter.length > 0 && (
                      <span className="text-[10px] text-gray-400">({filteredStudents.length} mhs)</span>
                    )}
                  </div>
                )}
              </div>

              {(scoresLoading || studentsLoading) ? (
                <div className="p-4 space-y-2">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="sticky left-0 bg-gray-50 text-left px-4 py-2.5 text-gray-500 font-semibold min-w-[160px] z-10">Mahasiswa</th>
                        <th className="text-center px-3 py-2.5 text-gray-400 font-medium w-16">Angk.</th>
                        {selectedCpmkCourseIds.map((courseId) => {
                          const info = courseInfoMap.get(courseId);
                          return (
                            <th key={courseId} title={info?.name} className="text-center px-2 py-2.5 text-gray-400 font-medium w-20 whitespace-nowrap cursor-default">
                              {info?.code ?? courseId.slice(0, 6)}
                            </th>
                          );
                        })}
                        <th className="text-center px-3 py-2.5 text-gray-700 font-semibold w-24 whitespace-nowrap">Nilai CPMK</th>
                        <th className="text-center px-3 py-2.5 text-gray-500 font-medium w-20">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={4 + selectedCpmkCourseIds.length} className="text-center py-10 text-gray-300 text-sm">
                            {selectedStudentScores.length === 0 ? 'Belum ada data nilai' : 'Mahasiswa tidak ditemukan'}
                          </td>
                        </tr>
                      ) : filteredStudents.map((s) => {
                        const sc = scoreColor(s.adjScore);
                        return (
                          <tr key={s.studentId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                            <td className="sticky left-0 bg-white px-4 py-2.5 z-10 border-r border-gray-50">
                              <p className="font-semibold text-gray-800">{s.name}</p>
                              <p className="text-gray-400 text-[10px]">{s.nim}</p>
                            </td>
                            <td className="px-3 py-2.5 text-center text-gray-400 text-[11px]">{s.entryYear || '–'}</td>
                            {selectedCpmkCourseIds.map((courseId) => {
                              const score  = s.perCourse[courseId];
                              const hasSc  = score !== undefined;
                              const csc    = hasSc ? scoreColor(score) : null;
                              return (
                                <td key={courseId} className="px-2 py-2.5 text-center">
                                  {hasSc ? (
                                    <span className={`text-[11px] font-bold ${csc!.text}`}>{score}</span>
                                  ) : (
                                    <span className="text-gray-200">–</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-3 py-2.5 text-center">
                              <span className={`text-sm font-bold ${sc.text}`}>{s.adjScore}</span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {s.passed ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                                  <CheckCircle2 size={10} /> Lulus
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                                  <AlertTriangle size={10} /> Belum
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
