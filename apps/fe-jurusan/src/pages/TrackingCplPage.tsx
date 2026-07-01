import { useState, useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import {
  Target, Search, X, BookOpen, Users, CheckCircle2,
  MinusCircle, AlertTriangle, HelpCircle,
  SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw, TrendingUp,
} from 'lucide-react';
import {
  academicClassService, studentCpmkScoreService, cplService,
  cpmkCplMappingService, cpmkCourseMappingService, courseCpmkWeightService, courseService,
} from '@/services/obe.service';
import { useApp } from '@/contexts/AppContext';
import { effectiveCourseCount } from '@/constants/scoring';
import type { CourseCpmkWeight, Cpl } from '@/types';

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 75) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: '#10b981' };
  if (s >= 50) return { text: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   bar: '#f59e0b' };
  return          { text: 'text-red-500',          bg: 'bg-red-50',     border: 'border-red-200',     bar: '#f87171' };
}

function calcWeighted(compMap: Map<string, number>, compWeights?: Map<string, number>): number {
  if (!compWeights || compWeights.size === 0) {
    const v = [...compMap.values()];
    return v.reduce((a, b) => a + b, 0) / (v.length || 1);
  }
  let wSum = 0, wTotal = 0;
  for (const [compId, score] of compMap) {
    const w = compWeights.get(compId);
    if (w !== undefined) { wSum += score * w; wTotal += w; }
  }
  return wTotal > 0 ? wSum / wTotal : [...compMap.values()].reduce((a, b) => a + b, 0) / (compMap.size || 1);
}

// ─── Threshold Panel ─────────────────────────────────────────────────────────

function ThresholdPanel({
  thresholds, onChange, onReset,
}: {
  thresholds: Record<string, number>;
  onChange: (cat: string, val: number) => void;
  onReset: () => void;
}) {
  return (
    <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Atur Threshold Kelulusan CPL</p>
        <button onClick={onReset} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-primary transition-colors">
          <RotateCcw size={11} /> Reset default
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${CATEGORY_CHIP[key] ?? 'bg-gray-100 text-gray-600'}`}>{label}</label>
              <span className="text-sm font-bold text-gray-800">{thresholds[key]}%</span>
            </div>
            <input type="range" min={0} max={100} step={1} value={thresholds[key]}
              onChange={(e) => onChange(key, Number(e.target.value))}
              className="w-full h-1.5 rounded-full accent-primary cursor-pointer" />
            <div className="flex justify-between text-[10px] text-gray-400"><span>0%</span><span>100%</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TrackingCplPage() {
  const { selectedCurriculum } = useApp();
  const curriculumId = selectedCurriculum?.id;

  const [selectedCplId,       setSelectedCplId      ] = useState<string | null>(null);
  const [search,              setSearch             ] = useState('');
  const [filterCategory,      setFilterCategory     ] = useState('');
  const [studentSearch,       setStudentSearch      ] = useState('');
  const [filterAngkatan,      setFilterAngkatan     ] = useState<number[]>([]);
  const [thresholds,          setThresholds         ] = useState<Record<string, number>>(DEFAULT_THRESHOLDS);
  const [showThresholds,      setShowThresholds     ] = useState(true);
  const [expandedStudent,     setExpandedStudent    ] = useState<string | null>(null);

  // ── Static curriculum data ─────────────────────────────────────────────────
  const { data: cplListData } = useQuery({
    queryKey: ['cpl-list-full'],
    queryFn:  () => cplService.getAll({ limit: 100 }),
    staleTime: 10 * 60 * 1000,
  });

  const { data: cplCpmkMatrix } = useQuery({
    queryKey: ['cpmk-cpl-matrix-dashboard', curriculumId],
    queryFn:  () => cpmkCplMappingService.getMatrix({ curriculumId: curriculumId! }),
    enabled:  !!curriculumId,
    staleTime: 10 * 60 * 1000,
  });

  const { data: cpmkMkMatrix } = useQuery({
    queryKey: ['cpmk-mk-matrix-dashboard', curriculumId, selectedCurriculum?.year],
    queryFn:  () => cpmkCourseMappingService.getMatrix({ curriculumId: curriculumId!, curriculumYear: selectedCurriculum?.year }),
    enabled:  !!curriculumId,
    staleTime: 10 * 60 * 1000,
  });

  // ── All classes (paginated, shared cache) ─────────────────────────────────
  const { data: classesData } = useQuery({
    queryKey: ['all-classes-export'],
    queryFn: async () => {
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
  const allClasses = useMemo(() => classesData?.data ?? [], [classesData]);

  // ── All class scores (shared cache with Dashboard) ─────────────────────────
  const classScoreResults = useQueries({
    queries: allClasses.map((cls) => ({
      queryKey: ['class-scores-dash', cls.id],
      queryFn:  () => studentCpmkScoreService.getByClass(cls.id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  // ── Derived curriculum maps ────────────────────────────────────────────────
  const allCpls = useMemo(() =>
    ([...(cplListData?.data ?? [])] as Cpl[]).sort((a, b) =>
      a.code.localeCompare(b.code, undefined, { numeric: true })
    ), [cplListData]);

  // cplId → cpmkId[]
  const cplToCpmkIds = useMemo(() => {
    const map = new Map<string, string[]>();
    (cplCpmkMatrix?.data?.mappings ?? []).forEach(({ cplId, cpmkId }) => {
      if (!map.has(cplId)) map.set(cplId, []);
      map.get(cplId)!.push(cpmkId);
    });
    return map;
  }, [cplCpmkMatrix]);

  // cpmkId → { code, name } from matrix
  const cpmkInfoMap = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    (cplCpmkMatrix?.data?.cpmks ?? []).forEach((c) => map.set(c.id, { code: c.code, name: c.name }));
    // also from score records
    for (const res of classScoreResults) {
      for (const s of res.data?.data ?? []) {
        if (!map.has(s.cpmkId)) map.set(s.cpmkId, { code: s.cpmk.code, name: s.cpmk.name });
      }
    }
    return map;
  }, [cplCpmkMatrix, classScoreResults]);

  // cpmkId → courseIds[] from curriculum
  const cpmkIdToCourseIds = useMemo(() => {
    const map = new Map<string, string[]>();
    const matrix = cpmkMkMatrix?.data;
    if (!matrix) return map;
    [...(matrix.matrix ?? []).flatMap((r) => r.cpmks), ...(matrix.unmappedCpmks ?? [])].forEach(
      (c) => { if (c.courseIds?.length) map.set(c.id, c.courseIds); }
    );
    return map;
  }, [cpmkMkMatrix]);

  const allCurriculumCourseIds = useMemo(() => {
    const ids = new Set<string>();
    for (const courseIds of cpmkIdToCourseIds.values()) courseIds.forEach((id) => ids.add(id));
    return [...ids];
  }, [cpmkIdToCourseIds]);

  // Course name/code lookup
  const courseByIdResults = useQueries({
    queries: allCurriculumCourseIds.map((courseId) => ({
      queryKey: ['course-by-id-dash', courseId],
      queryFn:  () => courseService.getById(courseId),
      staleTime: 30 * 60 * 1000,
    })),
  });

  const allCourseInfoMap = useMemo(() => {
    const m = new Map<string, { code: string; name: string }>();
    courseByIdResults.forEach((q, i) => {
      const courseId = allCurriculumCourseIds[i];
      const course = q.data?.data;
      if (course) m.set(courseId, { code: course.code, name: course.name });
    });
    allClasses.forEach((cls) => { if (!m.has(cls.course.id)) m.set(cls.course.id, { code: cls.course.code, name: cls.course.name }); });
    return m;
  }, [courseByIdResults, allCurriculumCourseIds, allClasses]);

  // Course component weights (shared cache)
  const dashCourseWeightResults = useQueries({
    queries: allCurriculumCourseIds.map((courseId) => ({
      queryKey: ['course-weights-dash', courseId],
      queryFn:  () => courseCpmkWeightService.getAll({ courseId }),
      staleTime: 30 * 60 * 1000,
    })),
  });

  // courseId → cpmkId → compId → weight
  const courseWeightMap = useMemo(() => {
    const map = new Map<string, Map<string, Map<string, number>>>();
    dashCourseWeightResults.forEach((q, i) => {
      const courseId = allCurriculumCourseIds[i];
      const cpmkWMap = new Map<string, Map<string, number>>();
      (q.data?.data ?? []).forEach((w: CourseCpmkWeight) => {
        if (!cpmkWMap.has(w.cpmkId)) cpmkWMap.set(w.cpmkId, new Map());
        cpmkWMap.get(w.cpmkId)!.set(w.assessmentComponentId, w.weight);
      });
      map.set(courseId, cpmkWMap);
    });
    return map;
  }, [dashCourseWeightResults, allCurriculumCourseIds]);

  // ── Build score index: studentId → cpmkId → courseId → compId → score ────
  // Also track: cpmkId → Set<classId> (for loading student details)
  const { scoresByStudent, cpmkToClassIds } = useMemo(() => {
    const scores  = new Map<string, Map<string, Map<string, Map<string, number>>>>();
    const classIds = new Map<string, Set<string>>();
    for (const res of classScoreResults) {
      for (const s of res.data?.data ?? []) {
        if (!scores.has(s.studentId)) scores.set(s.studentId, new Map());
        const sm = scores.get(s.studentId)!;
        if (!sm.has(s.cpmkId)) sm.set(s.cpmkId, new Map());
        const cm = sm.get(s.cpmkId)!;
        if (!cm.has(s.courseId)) cm.set(s.courseId, new Map());
        cm.get(s.courseId)!.set(s.assessmentComponentId, s.score);

        if (!classIds.has(s.cpmkId)) classIds.set(s.cpmkId, new Set());
        classIds.get(s.cpmkId)!.add(s.classId);
      }
    }
    return { scoresByStudent: scores, cpmkToClassIds: classIds };
  }, [classScoreResults]);

  const scoresLoading = allClasses.length > 0 && classScoreResults.some((r) => r.isLoading);

  // ── Per-CPL list stats (for left panel) ───────────────────────────────────
  const cplListStats = useMemo(() => {
    const stats = new Map<string, { students: number; avgScore: number; passRate: number }>();
    for (const cpl of allCpls) {
      const linkedCpmkIds = cplToCpmkIds.get(cpl.id) ?? [];
      if (linkedCpmkIds.length === 0) continue;
      const threshold = thresholds[cpl.category] ?? 75;

      // Collect all students who scored in any CPMK of this CPL
      const studentsWithAnyScore = new Set<string>();
      for (const [studentId, cpmkMap] of scoresByStudent) {
        if (linkedCpmkIds.some((id) => cpmkMap.has(id))) studentsWithAnyScore.add(studentId);
      }
      if (studentsWithAnyScore.size === 0) continue;

      let totalScore = 0, passCount = 0;
      for (const studentId of studentsWithAnyScore) {
        const cpmkMap = scoresByStudent.get(studentId)!;
        let cplScore = 0;
        for (const cpmkId of linkedCpmkIds) {
          const courseMap = cpmkMap.get(cpmkId);
          if (!courseMap) continue;
          const currIds = cpmkIdToCourseIds.get(cpmkId);
          const denom   = currIds ? effectiveCourseCount(currIds, allCourseInfoMap) : courseMap.size;
          let sum = 0;
          for (const [courseId, compMap] of courseMap) {
            sum += calcWeighted(compMap, courseWeightMap.get(courseId)?.get(cpmkId));
          }
          cplScore += sum / (denom || 1);
        }
        cplScore /= linkedCpmkIds.length;
        totalScore += cplScore;
        if (cplScore >= threshold) passCount++;
      }
      const n = studentsWithAnyScore.size;
      stats.set(cpl.id, {
        students: n,
        avgScore: Math.round(totalScore / n),
        passRate: Math.round((passCount / n) * 100),
      });
    }
    return stats;
  }, [allCpls, cplToCpmkIds, scoresByStudent, thresholds, cpmkIdToCourseIds, allCourseInfoMap, courseWeightMap]);

  // ── Selected CPL data ──────────────────────────────────────────────────────
  const selectedCpl     = useMemo(() => allCpls.find((c) => c.id === selectedCplId) ?? null, [allCpls, selectedCplId]);
  const selectedCplThreshold = selectedCpl ? (thresholds[selectedCpl.category] ?? 75) : 75;
  const linkedCpmkIds   = selectedCplId ? (cplToCpmkIds.get(selectedCplId) ?? []) : [];

  // Class IDs relevant to selected CPL (union of class IDs for all its CPMKs)
  const relevantClassIds = useMemo(() => {
    const ids = new Set<string>();
    for (const cpmkId of linkedCpmkIds) {
      for (const classId of cpmkToClassIds.get(cpmkId) ?? new Set()) ids.add(classId);
    }
    return ids;
  }, [linkedCpmkIds, cpmkToClassIds]);

  const relevantClasses = useMemo(
    () => allClasses.filter((cls) => relevantClassIds.has(cls.id)),
    [allClasses, relevantClassIds],
  );

  // Load student details for relevant classes
  const classDetailResults = useQueries({
    queries: relevantClasses.map((cls) => ({
      queryKey: ['class-detail-cpl-tracking', cls.id],
      queryFn:  () => academicClassService.getById(cls.id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const studentInfoMap = useMemo(() => {
    const map = new Map<string, { nim: string; name: string; entryYear: number }>();
    for (const q of classDetailResults) {
      for (const { student } of q.data?.data?.students ?? []) map.set(student.id, student);
    }
    return map;
  }, [classDetailResults]);

  const studentsLoading = classDetailResults.some((r) => r.isLoading);

  // ── Per-CPMK stats for selected CPL ───────────────────────────────────────
  const cpmkBreakdownStats = useMemo(() => {
    if (!selectedCplId) return [];
    return linkedCpmkIds.map((cpmkId) => {
      const info      = cpmkInfoMap.get(cpmkId);
      const currIds   = cpmkIdToCourseIds.get(cpmkId) ?? [];
      const denom     = effectiveCourseCount(currIds, allCourseInfoMap) || currIds.length || 1;
      // Collect all students who scored this CPMK
      const studentScores: number[] = [];
      for (const [, cpmkMap] of scoresByStudent) {
        const courseMap = cpmkMap.get(cpmkId);
        if (!courseMap) continue;
        let sum = 0;
        for (const [courseId, compMap] of courseMap) {
          sum += calcWeighted(compMap, courseWeightMap.get(courseId)?.get(cpmkId));
        }
        studentScores.push(sum / denom);
      }
      const n = studentScores.length;
      const avg = n > 0 ? studentScores.reduce((a, b) => a + b, 0) / n : 0;
      const pass = studentScores.filter((s) => s >= selectedCplThreshold).length;
      return {
        cpmkId,
        code:     info?.code ?? '',
        name:     info?.name ?? '',
        totalMk:  currIds.length,
        students: n,
        avgScore: n > 0 ? Math.round(avg) : null as number | null,
        passRate: n > 0 ? Math.round((pass / n) * 100) : null as number | null,
      };
    }).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }, [selectedCplId, linkedCpmkIds, cpmkInfoMap, cpmkIdToCourseIds, allCourseInfoMap, scoresByStudent, courseWeightMap, selectedCplThreshold]);

  // ── Per-student CPL scores ─────────────────────────────────────────────────
  const studentCplScores = useMemo(() => {
    if (!selectedCplId || linkedCpmkIds.length === 0) return [];

    // Collect all students who scored in any CPMK of this CPL
    const studentsWithData = new Set<string>();
    for (const [studentId, cpmkMap] of scoresByStudent) {
      if (linkedCpmkIds.some((id) => cpmkMap.has(id))) studentsWithData.add(studentId);
    }

    return [...studentsWithData].map((studentId) => {
      const info    = studentInfoMap.get(studentId);
      const cpmkMap = scoresByStudent.get(studentId)!;

      const perCpmk: Record<string, number> = {};
      let totalCplScore = 0;
      let scoredCount   = 0;
      for (const cpmkId of linkedCpmkIds) {
        const courseMap = cpmkMap.get(cpmkId);
        if (!courseMap) continue;
        scoredCount++;
        const currIds = cpmkIdToCourseIds.get(cpmkId);
        const denom   = currIds ? effectiveCourseCount(currIds, allCourseInfoMap) : courseMap.size;
        let sum = 0;
        for (const [courseId, compMap] of courseMap) {
          sum += calcWeighted(compMap, courseWeightMap.get(courseId)?.get(cpmkId));
        }
        const cpmkScore = sum / (denom || 1);
        perCpmk[cpmkId]  = Math.round(cpmkScore);
        totalCplScore   += cpmkScore;
      }
      // Divide by TOTAL linked CPMKs — unscored count as 0
      const cplScore = Math.round(totalCplScore / linkedCpmkIds.length);
      const passed   = cplScore >= selectedCplThreshold;

      const status =
        scoredCount === 0                                    ? 'no_data'  :
        passed && scoredCount === linkedCpmkIds.length       ? 'met'      :
        passed                                               ? 'partial'  :
                                                               'not_met';

      return {
        studentId,
        nim:       info?.nim      ?? '–',
        name:      info?.name     ?? studentId.slice(0, 8),
        entryYear: info?.entryYear ?? 0,
        perCpmk,
        cplScore,
        status,
        scoredCount,
      };
    }).sort((a, b) => b.cplScore - a.cplScore);
  }, [selectedCplId, linkedCpmkIds, scoresByStudent, studentInfoMap, cpmkIdToCourseIds, allCourseInfoMap, courseWeightMap, selectedCplThreshold]);

  // ── Filters ────────────────────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    let list = studentCplScores;
    if (filterAngkatan.length > 0) list = list.filter((s) => filterAngkatan.includes(s.entryYear));
    const q = studentSearch.trim().toLowerCase();
    if (q) list = list.filter((s) => s.name.toLowerCase().includes(q) || s.nim.includes(q));
    return list;
  }, [studentCplScores, filterAngkatan, studentSearch]);

  const filteredCpls = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allCpls.filter((c) => {
      const matchSearch   = !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
      const matchCategory = !filterCategory || c.category === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [allCpls, search, filterCategory]);

  const uniqueAngkatan = useMemo(() => {
    const years = new Set<number>();
    studentCplScores.forEach((s) => { if (s.entryYear) years.add(s.entryYear); });
    return [...years].sort();
  }, [studentCplScores]);

  const selectedStats = selectedCplId ? cplListStats.get(selectedCplId) : null;
  const isBaseLoading = !cplListData || !cplCpmkMatrix;

  const STATUS_CONFIG = {
    met:     { label: 'Terpenuhi',       cls: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 size={13} /> },
    partial: { label: 'Sebagian',        cls: 'text-amber-500',   bg: 'bg-amber-50 border-amber-200',     icon: <AlertTriangle size={13} /> },
    not_met: { label: 'Belum Terpenuhi', cls: 'text-red-500',     bg: 'bg-red-50 border-red-200',         icon: <MinusCircle size={13} /> },
    no_data: { label: 'Belum Dinilai',   cls: 'text-gray-400',    bg: 'bg-gray-50 border-gray-200',       icon: <HelpCircle size={13} /> },
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)] overflow-hidden">

      {/* ══ Left Panel: CPL List ════════════════════════════════════════════ */}
      <div className="w-[300px] shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <Target size={15} className="text-primary" />
            <h2 className="text-sm font-bold text-gray-800">CPL Kurikulum</h2>
            <span className="ml-auto text-[11px] bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">
              {filteredCpls.length}
            </span>
          </div>

          <div className="relative mb-2">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text" placeholder="Cari kode atau nama..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={11} />
              </button>
            )}
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Semua Kategori</option>
            {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isBaseLoading ? (
            <div className="p-3 space-y-2">
              {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : filteredCpls.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400 italic">Tidak ada CPL ditemukan.</div>
          ) : filteredCpls.map((cpl) => {
            const stats      = cplListStats.get(cpl.id);
            const isSelected = selectedCplId === cpl.id;
            const sc         = stats ? scoreColor(stats.avgScore) : null;
            const chipCls    = CATEGORY_CHIP[cpl.category] ?? 'bg-gray-100 text-gray-600';

            return (
              <button
                key={cpl.id}
                onClick={() => { setSelectedCplId(cpl.id); setStudentSearch(''); setFilterAngkatan([]); setExpandedStudent(null); }}
                className={`w-full text-left px-3 py-3 border-b border-gray-50 last:border-0 transition-all
                  ${isSelected ? 'bg-primary/5 border-l-[3px] border-l-primary pl-[9px]' : 'hover:bg-gray-50/80'}`}
              >
                <div className="flex items-start gap-2 mb-1.5">
                  <span className={`text-[11px] font-bold shrink-0 mt-0.5 ${isSelected ? 'text-primary' : 'text-indigo-600'}`}>
                    {cpl.code}
                  </span>
                  <span className="text-[11px] text-gray-700 leading-snug line-clamp-2 flex-1">{cpl.name}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${chipCls}`}>
                    {cpl.category?.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-gray-400">{cplToCpmkIds.get(cpl.id)?.length ?? 0} CPMK</span>
                  {stats && sc && (
                    <>
                      <span className="ml-auto text-[10px] text-gray-400">{stats.students} mhs</span>
                      <span className={`text-[10px] font-bold ${sc.text}`}>{stats.passRate}%</span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ Right Panel: Detail ═════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-w-0">
        {!selectedCpl ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <Target size={40} className="mb-3 opacity-20" />
            <p className="text-sm font-medium text-gray-500">Pilih CPL dari daftar</p>
            <p className="text-xs mt-1 text-gray-400">untuk melihat CPMK terhubung, capaian, dan nilai per mahasiswa</p>
          </div>
        ) : (
          <>
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                      {selectedCpl.code}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${CATEGORY_CHIP[selectedCpl.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      {selectedCpl.category?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-gray-400">Threshold: {selectedCplThreshold}%</span>
                  </div>
                  <h1 className="text-base font-bold text-gray-900 leading-snug">{selectedCpl.name}</h1>
                </div>
                <button
                  onClick={() => setShowThresholds((p) => !p)}
                  className={`flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border transition-colors shrink-0
                    ${showThresholds ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/40 hover:text-primary'}`}
                >
                  <SlidersHorizontal size={12} />
                  Threshold
                  {showThresholds ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>
              </div>

              {showThresholds && (
                <ThresholdPanel
                  thresholds={thresholds}
                  onChange={(cat, val) => setThresholds((prev) => ({ ...prev, [cat]: val }))}
                  onReset={() => setThresholds(DEFAULT_THRESHOLDS)}
                />
              )}

              {/* Stats tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
                {[
                  { label: 'CPMK Terhubung', value: linkedCpmkIds.length, sub: `${cpmkBreakdownStats.filter((s) => s.students > 0).length} sudah dinilai`, icon: <BookOpen size={14} className="text-violet-500" />, bg: 'bg-violet-50' },
                  { label: 'Mahasiswa Dinilai', value: selectedStats?.students ?? (scoresLoading ? '…' : 0), sub: 'ada skor minimal 1 CPMK', icon: <Users size={14} className="text-blue-500" />, bg: 'bg-blue-50' },
                  { label: 'Rata-rata Skor CPL', value: selectedStats ? `${selectedStats.avgScore}%` : (scoresLoading ? '…' : '–'), sub: 'curriculum-adjusted', icon: <TrendingUp size={14} className="text-teal-500" />, bg: 'bg-teal-50' },
                  { label: 'Tingkat Kelulusan', value: selectedStats ? `${selectedStats.passRate}%` : (scoresLoading ? '…' : '–'), sub: `≥ ${selectedCplThreshold}% threshold`, icon: <CheckCircle2 size={14} className="text-emerald-500" />, bg: 'bg-emerald-50' },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 flex items-start gap-2.5`}>
                    <div className="p-1.5 bg-white rounded-lg shadow-sm shrink-0">{s.icon}</div>
                    <div>
                      <p className="text-[10px] text-gray-500 leading-tight">{s.label}</p>
                      <p className="text-lg font-bold text-gray-800 leading-tight">{s.value}</p>
                      <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── CPMK Breakdown ──────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <BookOpen size={15} className="text-violet-500" />
                <h2 className="text-sm font-bold text-gray-800">CPMK yang Berkontribusi ke {selectedCpl.code}</h2>
                <span className="ml-auto text-[11px] bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">{linkedCpmkIds.length}</span>
              </div>
              {linkedCpmkIds.length === 0 ? (
                <p className="px-5 py-6 text-xs text-gray-400 italic">Belum ada CPMK yang dipetakan ke CPL ini.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {cpmkBreakdownStats.map((s) => {
                    const sc = s.avgScore !== null ? scoreColor(s.avgScore) : null;
                    return (
                      <div key={s.cpmkId} className="px-5 py-3 flex items-center gap-4">
                        <div className="w-[90px] shrink-0">
                          <span className="text-[11px] font-bold font-mono text-violet-600">{s.code}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 leading-snug truncate">{s.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{s.totalMk} MK kurikulum · {s.students} mhs dinilai</p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          {s.avgScore !== null && sc ? (
                            <>
                              <div className="hidden sm:block w-24">
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${s.avgScore}%`, backgroundColor: sc.bar }} />
                                </div>
                              </div>
                              <span className={`text-sm font-bold w-10 text-right ${sc.text}`}>{s.avgScore}%</span>
                              <span className="text-[11px] text-gray-400 w-16 text-right">{s.passRate}% lulus</span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-300 italic">Belum dinilai</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Student Table ────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={15} className="text-blue-500" />
                  <h2 className="text-sm font-bold text-gray-800">Nilai Mahasiswa</h2>
                  <span className="ml-auto text-[11px] bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">
                    {filteredStudents.length}
                  </span>
                </div>

                {/* Angkatan chips */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <button
                    onClick={() => setFilterAngkatan([])}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${filterAngkatan.length === 0 ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}
                  >
                    Semua
                  </button>
                  {uniqueAngkatan.map((y) => (
                    <button key={y}
                      onClick={() => setFilterAngkatan((prev) => prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y])}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${filterAngkatan.includes(y) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}
                    >
                      {y}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative max-w-xs">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text" placeholder="Cari nama atau NIM…"
                    value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-7 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {studentSearch && (
                    <button onClick={() => setStudentSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X size={11} />
                    </button>
                  )}
                </div>
              </div>

              {(scoresLoading || studentsLoading) ? (
                <div className="p-4 space-y-2">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400 italic">
                  {studentCplScores.length === 0 ? 'Belum ada mahasiswa yang dinilai untuk CPL ini.' : 'Tidak ada mahasiswa sesuai filter.'}
                </div>
              ) : filteredStudents.map((s, idx) => {
                const sc       = s.cplScore > 0 ? scoreColor(s.cplScore) : null;
                const cfg      = STATUS_CONFIG[s.status];
                const isExpand = expandedStudent === s.studentId;
                const initials = s.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

                return (
                  <div key={s.studentId} className="border-b border-gray-50 last:border-0">
                    <button
                      className="w-full text-left px-5 py-3 hover:bg-gray-50/70 transition-colors"
                      onClick={() => setExpandedStudent(isExpand ? null : s.studentId)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Rank */}
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0
                          ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-200 text-gray-500' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
                          {idx + 1}
                        </span>
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {initials}
                        </div>
                        {/* Name / NIM */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-gray-800 truncate">{s.name}</p>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">{s.entryYear}</span>
                          </div>
                          <p className="text-[10px] text-gray-400">{s.nim}</p>
                        </div>
                        {/* Score */}
                        <div className="flex items-center gap-2 shrink-0">
                          {sc ? (
                            <>
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                                <div className="h-full rounded-full" style={{ width: `${s.cplScore}%`, backgroundColor: sc.bar }} />
                              </div>
                              <span className={`text-sm font-bold w-10 text-right ${sc.text}`}>{s.cplScore}%</span>
                            </>
                          ) : <span className="text-xs text-gray-300">–</span>}
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.cls} hidden sm:inline-block`}>
                            {cfg.label}
                          </span>
                          <span className="text-gray-400">{isExpand ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</span>
                        </div>
                      </div>
                    </button>

                    {isExpand && (
                      <div className="px-5 pb-3 pt-0">
                        <div className="bg-gray-50 rounded-xl p-3 space-y-2.5">
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Rincian per CPMK</p>
                          {cpmkBreakdownStats.map((cpmk) => {
                            const cpmkScore      = s.perCpmk[cpmk.cpmkId];
                            const hasCpmkScore   = cpmkScore !== undefined;
                            const cpmkCc         = hasCpmkScore ? scoreColor(cpmkScore) : null;
                            const linkedCourseIds = cpmkIdToCourseIds.get(cpmk.cpmkId) ?? [];
                            const studentCourseMap = scoresByStudent.get(s.studentId)?.get(cpmk.cpmkId);

                            return (
                              <div key={cpmk.cpmkId}>
                                {/* CPMK chip */}
                                {hasCpmkScore ? (
                                  <span title={cpmk.name}
                                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-default ${cpmkCc!.bg} ${cpmkCc!.text} ${cpmkCc!.border}`}>
                                    {cpmk.code} · {cpmkScore}%
                                  </span>
                                ) : (
                                  <span title={`${cpmk.name} — belum dinilai`}
                                    className="inline-block text-[10px] text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full cursor-default opacity-60">
                                    {cpmk.code}
                                  </span>
                                )}
                                {/* Per-MK chips */}
                                {linkedCourseIds.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1 ml-2">
                                    {linkedCourseIds.map((courseId) => {
                                      const courseInfo = allCourseInfoMap.get(courseId);
                                      const compMap    = studentCourseMap?.get(courseId);
                                      const mkScore    = compMap
                                        ? Math.round(calcWeighted(compMap, courseWeightMap.get(courseId)?.get(cpmk.cpmkId)))
                                        : null;
                                      const mkCc = mkScore !== null ? scoreColor(mkScore) : null;
                                      return mkScore !== null ? (
                                        <span key={courseId}
                                          title={courseInfo?.name ?? courseId}
                                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border cursor-default ${mkCc!.bg} ${mkCc!.text} ${mkCc!.border}`}>
                                          {courseInfo?.code ?? courseId.slice(0, 8)} - {mkScore}
                                        </span>
                                      ) : (
                                        <span key={courseId}
                                          title={`${courseInfo?.name ?? courseId} — belum dinilai`}
                                          className="text-[10px] text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full cursor-default opacity-50">
                                          {courseInfo?.code ?? courseId.slice(0, 8)}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <div className={`flex items-center gap-1.5 pt-1 border-t border-gray-200 text-[11px] font-semibold ${cfg.cls}`}>
                            {cfg.icon}
                            {cfg.label} · {s.scoredCount}/{linkedCpmkIds.length} CPMK dinilai
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
