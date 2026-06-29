import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import {
  Search, GraduationCap, BookOpen, Target, ChevronDown, ChevronRight, ChevronUp,
  X, CheckCircle2, MinusCircle, AlertTriangle, HelpCircle, User, SlidersHorizontal, RotateCcw,
} from 'lucide-react';
import {
  academicClassService, studentCpmkScoreService, cplService, cpmkService,
  cpmkCplMappingService, cpmkCourseMappingService, courseCpmkWeightService, courseService,
} from '@/services/obe.service';
import { useApp } from '@/contexts/AppContext';
import type { Cpl, CpmkDetail, CourseCpmkWeight } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type CplStatus = 'met' | 'partial' | 'not_met' | 'no_data';

interface StudentInfo {
  id: string;
  nim: string;
  name: string;
  entryYear: number;
}

interface StudentClass {
  classId: string;
  classCode: string;
  className: string;
  course: { id: string; code: string; name: string };
  semesterName: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_THRESHOLDS: Record<string, number> = {
  SIKAP: 80, PENGETAHUAN: 70, KETERAMPILAN_UMUM: 75, KETERAMPILAN_KHUSUS: 75,
};

const CATEGORY_LABEL_SHORT: Record<string, string> = {
  SIKAP: 'Sikap', PENGETAHUAN: 'Pengetahuan',
  KETERAMPILAN_UMUM: 'Keterampilan Umum', KETERAMPILAN_KHUSUS: 'Keterampilan Khusus',
};

const CATEGORY_LABEL: Record<string, string> = {
  SIKAP: 'Sikap', PENGETAHUAN: 'Pengetahuan',
  KETERAMPILAN_UMUM: 'KU', KETERAMPILAN_KHUSUS: 'KK',
};

const CATEGORY_COLOR: Record<string, string> = {
  SIKAP: 'bg-blue-100 text-blue-700',
  PENGETAHUAN: 'bg-purple-100 text-purple-700',
  KETERAMPILAN_UMUM: 'bg-teal-100 text-teal-700',
  KETERAMPILAN_KHUSUS: 'bg-orange-100 text-orange-700',
};

const STATUS_CONFIG: Record<CplStatus, {
  label: string; icon: typeof CheckCircle2; cls: string; bg: string; border: string;
}> = {
  met:     { label: 'Terpenuhi',       icon: CheckCircle2,  cls: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  partial: { label: 'Sebagian',        icon: AlertTriangle, cls: 'text-amber-500',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
  not_met: { label: 'Belum Terpenuhi', icon: MinusCircle,   cls: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-200'     },
  no_data: { label: 'Belum Ada Nilai', icon: HelpCircle,    cls: 'text-gray-400',    bg: 'bg-gray-50',    border: 'border-gray-200'    },
};

function scoreColor(v: number) {
  if (v >= 75) return { text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', bar: '#10b981' };
  if (v >= 50) return { text: 'text-yellow-600',  bg: 'bg-yellow-50 border-yellow-200',   bar: '#f59e0b' };
  return          { text: 'text-red-500',          bg: 'bg-red-50 border-red-200',         bar: '#f87171' };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TrackingMahasiswaPage() {
  const { selectedCurriculum } = useApp();
  const curriculumId = selectedCurriculum?.id;

  const [search, setSearch]               = useState('');
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [expandedCourse, setExpandedCourse]   = useState<string | null>(null);
  const [expandedCpl, setExpandedCpl]         = useState<string | null>(null);
  const [thresholds, setThresholds]           = useState<Record<string, number>>(DEFAULT_THRESHOLDS);
  const [showThresholds, setShowThresholds]   = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Phase 1: load all classes + student lists ─────────────────────────────

  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['all-classes-mhs-tracking'],
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

  const classDetailResults = useQueries({
    queries: allClasses.map((cls) => ({
      queryKey: ['class-detail-mhs-tracking', cls.id],
      queryFn: () => academicClassService.getById(cls.id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const loadedCount  = classDetailResults.filter((q) => !!q.data).length;
  const listLoading  = classesLoading || (allClasses.length > 0 && loadedCount < allClasses.length);

  // studentId → { info, classes[] }
  const studentMap = useMemo(() => {
    const map = new Map<string, { info: StudentInfo; classes: StudentClass[] }>();
    classDetailResults.forEach((q, i) => {
      const detail = q.data?.data;
      const cls    = allClasses[i];
      if (!detail || !cls) return;
      (detail.students ?? []).forEach(({ student }) => {
        if (!map.has(student.id)) {
          map.set(student.id, {
            info: { id: student.id, nim: student.nim, name: student.name, entryYear: student.entryYear },
            classes: [],
          });
        }
        map.get(student.id)!.classes.push({
          classId:     cls.id,
          classCode:   detail.code,
          className:   detail.name,
          course:      detail.course,
          semesterName: detail.semester?.name ?? '',
        });
      });
    });
    return map;
  }, [classDetailResults, allClasses]);

  // Filtered + grouped by angkatan for dropdown
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...studentMap.values()];
    const filtered = q
      ? list.filter((v) => v.info.nim.toLowerCase().includes(q) || v.info.name.toLowerCase().includes(q))
      : list;
    return filtered.map((v) => v.info).slice(0, 30);
  }, [studentMap, search]);

  const filteredByAngkatan = useMemo(() => {
    const map = new Map<number, StudentInfo[]>();
    for (const s of filteredStudents) {
      const y = s.entryYear ?? 0;
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(s);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [filteredStudents]);

  // ── Phase 2: CPLs (always load) ──────────────────────────────────────────

  const { data: cplData } = useQuery({
    queryKey: ['cpls-mhs-tracking'],
    queryFn: () => cplService.getAll({ limit: 100 }),
    staleTime: 10 * 60 * 1000,
  });

  const allCpls = useMemo(() => (cplData?.data ?? []) as Cpl[], [cplData]);

  // Full CPMK-CPL curriculum mapping (same source as dashboard)
  const { data: cplCpmkMatrixData } = useQuery({
    queryKey: ['cpl-cpmk-matrix-mhs-tracking', curriculumId],
    queryFn: () => cpmkCplMappingService.getMatrix({ curriculumId: curriculumId! }),
    enabled: !!curriculumId,
    staleTime: 10 * 60 * 1000,
  });

  // CPMK-to-course matrix (which courses teach each CPMK in curriculum)
  const { data: cpmkMkMatrixData } = useQuery({
    queryKey: ['cpmk-mk-matrix-mhs-tracking', curriculumId, selectedCurriculum?.year],
    queryFn: () => cpmkCourseMappingService.getMatrix({ curriculumId: curriculumId!, curriculumYear: selectedCurriculum?.year }),
    enabled: !!curriculumId,
    staleTime: 10 * 60 * 1000,
  });

  // cpmkId → courseIds[] (all courses in curriculum that teach this CPMK)
  const cpmkIdToCourseIds = useMemo(() => {
    const map = new Map<string, string[]>();
    const matrix = cpmkMkMatrixData?.data;
    if (!matrix) return map;
    const rows = [
      ...(matrix.matrix ?? []).flatMap((r) => r.cpmks),
      ...(matrix.unmappedCpmks ?? []),
    ];
    rows.forEach((cpmk) => { if (cpmk.courseIds?.length) map.set(cpmk.id, cpmk.courseIds); });
    return map;
  }, [cpmkMkMatrixData]);

  // All unique course IDs from the CPMK-course matrix
  const allCurriculumCourseIds = useMemo(() => {
    const ids = new Set<string>();
    for (const courseIds of cpmkIdToCourseIds.values()) courseIds.forEach((id) => ids.add(id));
    return [...ids];
  }, [cpmkIdToCourseIds]);

  // Fetch each curriculum course directly by ID (works even if course has no academic classes)
  const courseByIdResults = useQueries({
    queries: allCurriculumCourseIds.map((courseId) => ({
      queryKey: ['course-by-id-mhs', courseId],
      queryFn: () => courseService.getById(courseId),
      staleTime: 30 * 60 * 1000,
    })),
  });

  // courseId → { code, name } — built from per-course queries + allClasses fallback
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

  // cplId → cpmkId[] (ALL CPMKs in curriculum linked to each CPL)
  const cplIdToCpmkIds = useMemo(() => {
    const map = new Map<string, string[]>();
    (cplCpmkMatrixData?.data?.mappings ?? []).forEach(({ cplId, cpmkId }) => {
      if (!map.has(cplId)) map.set(cplId, []);
      map.get(cplId)!.push(cpmkId);
    });
    return map;
  }, [cplCpmkMatrixData]);

  // cpmkId → { code, name } for ALL CPMKs in curriculum
  const cpmkIdToInfo = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    (cplCpmkMatrixData?.data?.cpmks ?? []).forEach((c) => map.set(c.id, { code: c.code, name: c.name }));
    return map;
  }, [cplCpmkMatrixData]);

  // ── Phase 3: scores for selected student ─────────────────────────────────

  const studentClasses = useMemo(
    () => (selectedStudent ? (studentMap.get(selectedStudent.id)?.classes ?? []) : []),
    [selectedStudent, studentMap],
  );

  const scoreResults = useQueries({
    queries: studentClasses.map(({ classId }) => ({
      queryKey: ['class-scores-mhs-tracking', classId],
      queryFn: () => studentCpmkScoreService.getByClass(classId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  // courseId → cpmkId → assessmentComponentId → { score, cpmk, comp }
  const studentScoresByCourse = useMemo(() => {
    type CompEntry = { score: number; cpmk: { id: string; code: string; name: string }; comp: { id: string; code: string; name: string } };
    const result = new Map<string, Map<string, Map<string, CompEntry>>>();
    if (!selectedStudent) return result;
    scoreResults.forEach((q, i) => {
      if (i >= studentClasses.length) return;
      const courseId = studentClasses[i].course.id;
      (q.data?.data ?? [])
        .filter((s) => s.studentId === selectedStudent.id)
        .forEach((s) => {
          if (!result.has(courseId)) result.set(courseId, new Map());
          const cm = result.get(courseId)!;
          if (!cm.has(s.cpmkId)) cm.set(s.cpmkId, new Map());
          cm.get(s.cpmkId)!.set(s.assessmentComponentId, { score: s.score, cpmk: s.cpmk, comp: s.assessmentComponent });
        });
    });
    return result;
  }, [selectedStudent, scoreResults, studentClasses]);

  // cpmkId → { code, name } derived from score data (for display)
  const cpmkInfoFromScores = useMemo(() => {
    const map = new Map<string, { id: string; code: string; name: string }>();
    for (const cpmkMap of studentScoresByCourse.values()) {
      for (const [cpmkId, compMap] of cpmkMap) {
        if (!map.has(cpmkId)) {
          const first = [...compMap.values()][0];
          if (first) map.set(cpmkId, first.cpmk);
        }
      }
    }
    return map;
  }, [studentScoresByCourse]);

  const uniqueCpmkIds = useMemo(() => [...cpmkInfoFromScores.keys()], [cpmkInfoFromScores]);

  // Unique course IDs where student has scores (for weight queries)
  const uniqueStudentCourseIds = useMemo(
    () => [...new Set(studentClasses.map((c) => c.course.id))],
    [studentClasses],
  );

  // Fetch bobot penilaian for each course
  const courseWeightResults = useQueries({
    queries: uniqueStudentCourseIds.map((courseId) => ({
      queryKey: ['course-weights-mhs-tracking', courseId],
      queryFn: () => courseCpmkWeightService.getAll({ courseId }),
      staleTime: 10 * 60 * 1000,
    })),
  });

  // courseId → Map<cpmkId, Map<assessmentComponentId, { weight, code, name }>>
  const courseWeightMap = useMemo(() => {
    const map = new Map<string, Map<string, Map<string, { weight: number; code: string; name: string }>>>();
    courseWeightResults.forEach((q, i) => {
      const courseId = uniqueStudentCourseIds[i];
      const cpmkWMap = new Map<string, Map<string, { weight: number; code: string; name: string }>>();
      (q.data?.data ?? []).forEach((w: CourseCpmkWeight) => {
        if (!cpmkWMap.has(w.cpmkId)) cpmkWMap.set(w.cpmkId, new Map());
        cpmkWMap.get(w.cpmkId)!.set(w.assessmentComponentId, {
          weight: w.weight,
          code: w.assessmentComponent.code,
          name: w.assessmentComponent.name,
        });
      });
      map.set(courseId, cpmkWMap);
    });
    return map;
  }, [courseWeightResults, uniqueStudentCourseIds]);

  // cpmkId → per-course breakdown with weighted score
  type CpmkCourseDetail = {
    courseId: string;
    weightedScore: number;
    hasWeights: boolean;
    components: { code: string; name: string; score: number; weight: number | null }[];
  };
  const cpmkCourseDetails = useMemo(() => {
    const result = new Map<string, CpmkCourseDetail[]>();
    for (const [courseId, cpmkMap] of studentScoresByCourse) {
      const cpmkWMap = courseWeightMap.get(courseId);
      for (const [cpmkId, compMap] of cpmkMap) {
        const compWeights = cpmkWMap?.get(cpmkId);
        const hasWeights  = !!compWeights && compWeights.size > 0;
        const components  = [...compMap.entries()].map(([compId, { score, comp }]) => ({
          code: comp.code, name: comp.name, score,
          weight: compWeights?.get(compId)?.weight ?? null,
        })).sort((a, b) => a.code.localeCompare(b.code));

        let weightedScore: number;
        if (hasWeights) {
          let wSum = 0, wTotal = 0;
          components.forEach((c) => { if (c.weight !== null) { wSum += c.score * c.weight; wTotal += c.weight; } });
          weightedScore = wTotal > 0 ? wSum / wTotal : components.reduce((s, c) => s + c.score, 0) / components.length;
        } else {
          weightedScore = components.reduce((s, c) => s + c.score, 0) / components.length;
        }

        if (!result.has(cpmkId)) result.set(cpmkId, []);
        result.get(cpmkId)!.push({ courseId, weightedScore, hasWeights, components });
      }
    }
    return result;
  }, [studentScoresByCourse, courseWeightMap]);

  // Fetch CPMK details to get CPL links
  const cpmkDetailResults = useQueries({
    queries: uniqueCpmkIds.map((id) => ({
      queryKey: ['cpmk-detail-mhs-tracking', id],
      queryFn: () => cpmkService.getById(id),
      staleTime: 10 * 60 * 1000,
    })),
  });

  // cpmkId → cplCodes[]
  const cpmkCplCodes = useMemo(() => {
    const map = new Map<string, string[]>();
    cpmkDetailResults.forEach((q, i) => {
      const id = uniqueCpmkIds[i];
      const detail = q.data?.data as CpmkDetail | undefined;
      if (detail?.cpls) map.set(id, detail.cpls.map((c) => c.code));
    });
    return map;
  }, [cpmkDetailResults, uniqueCpmkIds]);

  // cpmkId → weighted average score (sum of student course scores / total curriculum courses for this CPMK)
  const avgCpmkScores = useMemo(() => {
    const map = new Map<string, number>();
    for (const [cpmkId, details] of cpmkCourseDetails) {
      const totalCourses = cpmkIdToCourseIds.get(cpmkId)?.length;
      const denominator  = totalCourses && totalCourses > 0 ? totalCourses : details.length;
      const sum = details.reduce((s, d) => s + d.weightedScore, 0);
      map.set(cpmkId, Math.round(sum / denominator));
    }
    return map;
  }, [cpmkCourseDetails, cpmkIdToCourseIds]);

  // All CPMKs in curriculum (union of all CPL-linked CPMKs + scored CPMKs)
  const allCurriculumCpmkIds = useMemo(() => {
    const ids = new Set<string>();
    for (const cpmkIds of cplIdToCpmkIds.values()) cpmkIds.forEach((id) => ids.add(id));
    uniqueCpmkIds.forEach((id) => ids.add(id));
    return [...ids];
  }, [cplIdToCpmkIds, uniqueCpmkIds]);

  // cpmkId → cplCodes[] from curriculum matrix (canonical, for display)
  const cpmkToCplCodes = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const cpl of allCpls) {
      for (const cpmkId of cplIdToCpmkIds.get(cpl.id) ?? []) {
        if (!map.has(cpmkId)) map.set(cpmkId, []);
        map.get(cpmkId)!.push(cpl.code);
      }
    }
    return map;
  }, [allCpls, cplIdToCpmkIds]);

  // cplCode → ALL linked CPMKs (scored and unscored) for the expand view
  const cplLinkedCpmks = useMemo(() => {
    const map = new Map<string, {
      cpmkId: string; code: string; name: string;
      avgScore: number | null; courseDetails: CpmkCourseDetail[];
      studentCourses: number; totalCourses: number;
    }[]>();
    for (const cpl of allCpls) {
      const linkedIds = cplIdToCpmkIds.get(cpl.id) ?? [];
      const items = linkedIds
        .map((id) => {
          const info = cpmkInfoFromScores.get(id) ?? cpmkIdToInfo.get(id);
          const details = cpmkCourseDetails.get(id) ?? [];
          return {
            cpmkId:        id,
            code:          info?.code ?? '',
            name:          info?.name ?? '',
            avgScore:      avgCpmkScores.has(id) ? avgCpmkScores.get(id)! : null,
            courseDetails: details,
            studentCourses: details.length,
            totalCourses:  cpmkIdToCourseIds.get(id)?.length ?? details.length,
          };
        })
        .filter((c) => c.code)
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
      if (items.length > 0) map.set(cpl.code, items);
    }
    return map;
  }, [allCpls, cplIdToCpmkIds, cpmkInfoFromScores, cpmkIdToInfo, avgCpmkScores, cpmkCourseDetails, cpmkIdToCourseIds]);

  // CPL achievement — uses full curriculum mapping (consistent with dashboard)
  const cplAchievement = useMemo(() => {
    if (!selectedStudent) return [] as (Cpl & { status: CplStatus; avgPct: number; threshold: number })[];
    return allCpls.map((cpl) => {
      const threshold  = thresholds[cpl.category] ?? 75;
      const linkedIds  = cplIdToCpmkIds.get(cpl.id) ?? [];
      if (linkedIds.length === 0) return { ...cpl, status: 'no_data' as CplStatus, avgPct: 0, threshold };
      const scored = linkedIds.filter((id) => avgCpmkScores.has(id));
      if (scored.length === 0) return { ...cpl, status: 'no_data' as CplStatus, avgPct: 0, threshold };
      const avg    = Math.round(scored.reduce((s, id) => s + avgCpmkScores.get(id)!, 0) / linkedIds.length);
      const status: CplStatus = avg < threshold ? 'not_met' : scored.length < linkedIds.length ? 'partial' : 'met';
      return { ...cpl, status, avgPct: avg, threshold };
    });
  }, [selectedStudent, allCpls, cplIdToCpmkIds, avgCpmkScores]);

  // Course groups: courseId → { course, classes[], cpmkIds, avgScore }
  const courseGroups = useMemo(() => {
    if (!selectedStudent) return [];
    const map = new Map<string, {
      course: { id: string; code: string; name: string };
      classes: StudentClass[];
      cpmkIds: Set<string>;
    }>();
    studentClasses.forEach((cls) => {
      if (!map.has(cls.course.id)) map.set(cls.course.id, { course: cls.course, classes: [], cpmkIds: new Set() });
      map.get(cls.course.id)!.classes.push(cls);
    });
    scoreResults.forEach((q, i) => {
      if (i >= studentClasses.length) return;
      const group = map.get(studentClasses[i].course.id);
      if (!group) return;
      (q.data?.data ?? [])
        .filter((s) => s.studentId === selectedStudent.id)
        .forEach((s) => group.cpmkIds.add(s.cpmkId));
    });
    return [...map.values()]
      .map((g) => {
        // Use per-course CPMK scores (the actual score in this specific course)
        const perCourseScores = [...g.cpmkIds]
          .map((id) => cpmkCourseDetails.get(id)?.find((d) => d.courseId === g.course.id)?.weightedScore)
          .filter((s): s is number => s !== undefined);
        const avg = perCourseScores.length > 0
          ? Math.round(perCourseScores.reduce((a, b) => a + b, 0) / perCourseScores.length)
          : null;
        return { ...g, avgScore: avg };
      })
      .sort((a, b) => a.course.code.localeCompare(b.course.code));
  }, [selectedStudent, studentClasses, scoreResults, cpmkCourseDetails]);

  const metCplCount = useMemo(() => cplAchievement.filter((c) => c.status === 'met').length, [cplAchievement]);

  // Rows for "Nilai Semua CPMK" — one row per CPMK, shows ALL curriculum courses + student scores
  const cpmkTableRows = useMemo(() => {
    type CourseEntry = { courseId: string; code: string; name: string; studentScore: number | null };
    type Row = { key: string; cpmkId: string; code: string; name: string; courses: CourseEntry[]; score: number | null; cplCodes: string[] };

    const rows: Row[] = [];
    const scoredIds = new Set<string>();

    for (const [cpmkId, details] of cpmkCourseDetails) {
      const info = cpmkInfoFromScores.get(cpmkId) ?? cpmkIdToInfo.get(cpmkId);
      if (!info?.code) continue;
      scoredIds.add(cpmkId);
      const studentScoreMap = new Map(details.map((d) => [d.courseId, Math.round(d.weightedScore)]));
      const allCourseIds = cpmkIdToCourseIds.get(cpmkId) ?? [...studentScoreMap.keys()];
      const courses: CourseEntry[] = allCourseIds
        .map((cid) => ({ courseId: cid, code: allCourseInfoMap.get(cid)?.code ?? cid, name: allCourseInfoMap.get(cid)?.name ?? '', studentScore: studentScoreMap.get(cid) ?? null }))
        .sort((a, b) => a.code.localeCompare(b.code));
      rows.push({ key: cpmkId, cpmkId, code: info.code, name: info.name, courses, score: avgCpmkScores.get(cpmkId) ?? null, cplCodes: cpmkToCplCodes.get(cpmkId) ?? [] });
    }

    // Curriculum CPMKs with no scores yet
    for (const id of allCurriculumCpmkIds) {
      if (scoredIds.has(id)) continue;
      const info = cpmkIdToInfo.get(id);
      if (!info?.code) continue;
      const allCourseIds = cpmkIdToCourseIds.get(id) ?? [];
      const courses: CourseEntry[] = allCourseIds
        .map((cid) => ({ courseId: cid, code: allCourseInfoMap.get(cid)?.code ?? cid, name: allCourseInfoMap.get(cid)?.name ?? '', studentScore: null }))
        .sort((a, b) => a.code.localeCompare(b.code));
      rows.push({ key: id, cpmkId: id, code: info.code, name: info.name, courses, score: null, cplCodes: cpmkToCplCodes.get(id) ?? [] });
    }

    return rows.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }, [cpmkCourseDetails, cpmkInfoFromScores, cpmkIdToInfo, cpmkToCplCodes, allCurriculumCpmkIds, cpmkIdToCourseIds, allCourseInfoMap, avgCpmkScores]);

  const isScoresLoading = !!selectedStudent && (
    scoreResults.some((q) => q.isFetching) ||
    (uniqueCpmkIds.length > 0 && cpmkDetailResults.some((q) => q.isFetching))
  );

  const handleSelect = (student: StudentInfo) => {
    setSelectedStudent(student);
    setDropdownOpen(false);
    setSearch('');
    setExpandedCourse(null);
    setExpandedCpl(null);
  };

  const clearSelection = () => {
    setSelectedStudent(null);
    setExpandedCourse(null);
    setExpandedCpl(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-8">

      {/* Page header */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Tracking Mahasiswa</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Lacak mata kuliah, CPMK, CPL, dan nilai per mahasiswa
          </p>
        </div>
        <button
          onClick={() => setShowThresholds((p) => !p)}
          className={`flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border transition-colors shrink-0 mt-1
            ${showThresholds
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-600 border-gray-200 hover:border-primary/40 hover:text-primary'}`}
        >
          <SlidersHorizontal size={12} />
          Threshold
          {showThresholds ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
      </div>

      {/* Threshold sliders */}
      {showThresholds && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Atur Threshold Kelulusan CPL</p>
              <button
                onClick={() => setThresholds(DEFAULT_THRESHOLDS)}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-primary transition-colors"
              >
                <RotateCcw size={11} /> Reset default
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(CATEGORY_LABEL_SHORT).map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${CATEGORY_COLOR[key] ?? 'bg-gray-100 text-gray-600'}`}>
                      {label}
                    </label>
                    <span className="text-sm font-bold text-gray-800">{thresholds[key]}%</span>
                  </div>
                  <input
                    type="range" min={0} max={100} step={1}
                    value={thresholds[key]}
                    onChange={(e) => setThresholds((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="w-full h-1.5 rounded-full accent-primary cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>0%</span><span>100%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Student selector ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pilih Mahasiswa</p>

        {listLoading && allClasses.length > 0 && (
          <div className="mb-3 flex items-center gap-2 text-xs text-gray-400">
            <div className="animate-spin w-3 h-3 border border-primary border-t-transparent rounded-full" />
            Memuat daftar mahasiswa… ({loadedCount}/{allClasses.length} kelas)
          </div>
        )}

        <div className="relative" ref={dropdownRef}>
          <div
            className={`flex items-center gap-2 w-full border rounded-xl px-3 py-2.5 bg-white transition-all cursor-text
              ${dropdownOpen ? 'border-primary/40 ring-2 ring-primary/10 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
            onClick={() => setDropdownOpen(true)}
          >
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder={selectedStudent
                ? `${selectedStudent.nim} · ${selectedStudent.name}`
                : 'Cari NIM atau nama mahasiswa…'}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setDropdownOpen(true); }}
              onFocus={() => setDropdownOpen(true)}
              className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
            />
            {selectedStudent && !dropdownOpen && (
              <button onClick={(e) => { e.stopPropagation(); clearSelection(); }} className="text-gray-300 hover:text-gray-500 transition-colors">
                <X size={14} />
              </button>
            )}
            <ChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {dropdownOpen && (
            <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
              <div className="max-h-72 overflow-y-auto">
                {classesLoading ? (
                  <div className="flex items-center justify-center gap-2 py-6">
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                    <p className="text-xs text-gray-400">Memuat data...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-6">
                    {listLoading ? 'Masih memuat data mahasiswa...' : 'Tidak ada mahasiswa ditemukan'}
                  </p>
                ) : filteredByAngkatan.map(([year, students]) => (
                  <div key={year}>
                    <div className="sticky top-0 px-4 py-1.5 bg-gray-50 border-b border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Angkatan {year}</p>
                    </div>
                    {students.map((student) => {
                      const isSel = selectedStudent?.id === student.id;
                      const classCount = studentMap.get(student.id)?.classes.length ?? 0;
                      return (
                        <button
                          key={student.id}
                          onClick={() => handleSelect(student)}
                          className={`w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors ${isSel ? 'bg-primary/5' : ''}`}
                        >
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User size={12} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate">{student.name}</p>
                            <p className="text-[11px] text-gray-400">{student.nim} · {classCount} kelas</p>
                          </div>
                          {isSel && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedStudent && !dropdownOpen && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary/5 text-primary rounded-full border border-primary/20 font-medium">
              <User size={11} />
              {selectedStudent.nim} · {selectedStudent.name} · Angkatan {selectedStudent.entryYear}
            </span>
          </div>
        )}
      </div>

      {/* ── Student detail ─────────────────────────────────────────────────────── */}
      {selectedStudent && (
        <div className="space-y-4">

          {/* Banner */}
          <div className="bg-gradient-to-r from-primary to-blue-700 text-white p-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <User size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold truncate">{selectedStudent.name}</h2>
                <p className="text-sm opacity-80">{selectedStudent.nim} · Angkatan {selectedStudent.entryYear}</p>
              </div>
              <div className="flex gap-6 shrink-0 text-center">
                <div>
                  <div className="text-2xl font-bold">{courseGroups.length}</div>
                  <div className="text-xs opacity-70">Mata Kuliah</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{uniqueCpmkIds.length}</div>
                  <div className="text-xs opacity-70">CPMK</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{metCplCount}<span className="text-base opacity-60">/{allCpls.length}</span></div>
                  <div className="text-xs opacity-70">CPL Terpenuhi</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── CPL Achievement ────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <Target size={17} className="text-primary shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-gray-800">Pencapaian CPL</h3>
                <p className="text-xs text-gray-400">{metCplCount} dari {allCpls.length} CPL terpenuhi</p>
              </div>
            </div>

            {isScoresLoading && uniqueCpmkIds.length === 0 ? (
              <div className="p-10 text-center">
                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-xs text-gray-400">Menghitung pencapaian CPL...</p>
              </div>
            ) : (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cplAchievement.map((cpl) => {
                  const cfg      = STATUS_CONFIG[cpl.status];
                  const Icon     = cfg.icon;
                  const isOpen   = expandedCpl === cpl.code;
                  const linked   = cplLinkedCpmks.get(cpl.code) ?? [];
                  const barColor = cpl.status === 'met' ? '#10b981' : cpl.status === 'partial' ? '#f59e0b' : '#f87171';

                  return (
                    <div key={cpl.id} className={`rounded-xl border ${cfg.bg} ${cfg.border} overflow-hidden`}>
                      {/* Card header — clickable */}
                      <button
                        className="w-full text-left p-4"
                        onClick={() => setExpandedCpl(isOpen ? null : cpl.code)}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Icon size={13} className={cfg.cls} />
                            <span className="text-xs font-bold text-gray-800">{cpl.code}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${CATEGORY_COLOR[cpl.category] ?? 'bg-gray-100 text-gray-600'}`}>
                              {CATEGORY_LABEL[cpl.category] ?? cpl.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-sm font-bold ${cfg.cls}`}>
                              {cpl.status !== 'no_data' ? `${cpl.avgPct}%` : '–'}
                            </span>
                            <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-snug mb-2">{cpl.name}</p>
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-semibold ${cfg.cls}`}>{cfg.label}</span>
                          <span className="text-[10px] text-gray-400">threshold ≥{cpl.threshold}%</span>
                        </div>
                        {cpl.status !== 'no_data' && (
                          <div className="mt-1.5 h-1 bg-white/60 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, cpl.avgPct)}%`, backgroundColor: barColor }} />
                          </div>
                        )}
                      </button>

                      {/* Expanded: CPMK breakdown */}
                      {isOpen && (
                        <div className="border-t border-white/50 bg-white/40 px-4 py-3 space-y-2">
                          {linked.length === 0 ? (
                            <p className="text-[11px] text-gray-400 italic">Tidak ada CPMK yang dinilai untuk CPL ini</p>
                          ) : (
                            <>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">CPMK Terkait</p>
                              {linked.map((cpmk) => {
                                if (cpmk.avgScore === null) {
                                  return (
                                    <div key={cpmk.cpmkId} className="flex items-center gap-2 opacity-50">
                                      <span className="text-[10px] font-bold font-mono text-purple-700 w-20 shrink-0">{cpmk.code}</span>
                                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full" />
                                      <span className="text-xs text-gray-400 w-8 text-right shrink-0">–</span>
                                      <span className="text-xs text-gray-300 w-4 shrink-0">–</span>
                                    </div>
                                  );
                                }
                                const passes = cpmk.avgScore >= cpl.threshold;
                                const c = scoreColor(cpmk.avgScore);
                                return (
                                  <div key={cpmk.cpmkId}>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold font-mono text-purple-700 w-20 shrink-0">{cpmk.code}</span>
                                      <div className="flex-1 h-1.5 bg-white/70 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, cpmk.avgScore)}%`, backgroundColor: c.bar }} />
                                      </div>
                                      <span className={`text-xs font-bold w-8 text-right shrink-0 ${c.text}`}>{cpmk.avgScore}</span>
                                      <span className={`text-xs font-bold w-4 shrink-0 ${passes ? 'text-emerald-600' : 'text-red-400'}`}>{passes ? '✓' : '✗'}</span>
                                    </div>
                                    {cpmk.totalCourses > 0 && (
                                      <p className="text-[10px] text-gray-400 font-mono mt-0.5 pl-[84px]">
                                        {cpmk.studentCourses}/{cpmk.totalCourses} mata kuliah
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                              {/* Final formula — sum of scored / total CPMKs (unscored count as 0) */}
                              {(() => {
                                const scored = linked.filter((c) => c.avgScore !== null);
                                const unscored = linked.length - scored.length;
                                return (
                                  <div className="pt-2 border-t border-white/50 text-[10px] font-mono text-gray-500 leading-relaxed space-y-0.5">
                                    <div>
                                      <span className="font-bold text-gray-600">Rata-rata: </span>
                                      ({scored.map((c) => c.avgScore).join(' + ')}{unscored > 0 ? ` + ${Array(unscored).fill(0).join(' + ')}` : ''}) / {linked.length} = <span className={`font-bold ${cpl.avgPct >= cpl.threshold ? 'text-emerald-600' : 'text-red-500'}`}>{cpl.avgPct}%</span>
                                      <span className="text-gray-400"> {cpl.avgPct >= cpl.threshold ? '≥' : '<'} {cpl.threshold}% → </span>
                                      <span className={`font-bold ${cfg.cls}`}>{cfg.label}</span>
                                    </div>
                                    {unscored > 0 && (
                                      <div className="text-amber-500">{unscored} CPMK belum dinilai dihitung sebagai 0</div>
                                    )}
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Mata Kuliah yang Diambil ──────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <BookOpen size={17} className="text-primary shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-gray-800">Mata Kuliah yang Diambil</h3>
                <p className="text-xs text-gray-400">{courseGroups.length} mata kuliah</p>
              </div>
            </div>

            {courseGroups.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-xs text-gray-400">
                  {isScoresLoading ? 'Memuat data mata kuliah...' : 'Belum ada mata kuliah'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {courseGroups.map(({ course, classes, cpmkIds, avgScore }) => {
                  const isExpanded = expandedCourse === course.id;

                  const courseCpmks = [...cpmkIds]
                    .map((id) => {
                      const info = cpmkInfoFromScores.get(id);
                      const courseDetail = cpmkCourseDetails.get(id)?.find((d) => d.courseId === course.id);
                      if (!info || !courseDetail) return null;
                      return { id, ...info, avgScore: Math.round(courseDetail.weightedScore), cplCodes: cpmkToCplCodes.get(id) ?? [] };
                    })
                    .filter((x): x is NonNullable<typeof x> => x !== null)
                    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

                  const sc = avgScore !== null ? scoreColor(avgScore) : null;

                  return (
                    <div key={course.id}>
                      <button
                        className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-gray-50/70 transition-colors"
                        onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                      >
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <BookOpen size={14} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-bold text-primary">{course.code}</span>
                            <span className="text-[11px] text-gray-400">{cpmkIds.size} CPMK</span>
                          </div>
                          <p className="text-sm text-gray-700 truncate">{course.name}</p>
                        </div>
                        <div className="text-right shrink-0 mr-1">
                          {avgScore !== null && sc ? (
                            <>
                              <p className={`text-xl font-bold ${sc.text}`}>{avgScore}</p>
                              <p className="text-[10px] text-gray-400">rata-rata</p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-300">–</p>
                          )}
                        </div>
                        <ChevronRight
                          size={16}
                          className={`text-gray-300 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-5 bg-gray-50/40 border-t border-gray-50">
                          {/* Class chips */}
                          <div className="flex flex-wrap gap-1.5 pt-3 mb-4">
                            {classes.map((cls) => (
                              <span key={cls.classId} className="text-[11px] px-2.5 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg font-medium">
                                {cls.classCode} · {cls.semesterName}
                              </span>
                            ))}
                          </div>

                          {/* CPMK rows */}
                          <div className="space-y-2">
                            {courseCpmks.map((cpmk) => {
                              const c = scoreColor(cpmk.avgScore);
                              return (
                                <div key={cpmk.id} className={`rounded-xl border px-3 py-2.5 flex items-center gap-3 ${c.bg}`}>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                      <span className="text-[11px] font-bold text-purple-700 font-mono">{cpmk.code}</span>
                                      {cpmk.cplCodes.map((code) => (
                                        <span key={code} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">{code}</span>
                                      ))}
                                    </div>
                                    <p className="text-xs text-gray-600 truncate">{cpmk.name}</p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="w-20 h-1.5 bg-white/70 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, cpmk.avgScore)}%`, backgroundColor: c.bar }} />
                                    </div>
                                    <span className={`text-sm font-bold w-8 text-right ${c.text}`}>{cpmk.avgScore}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Nilai Semua CPMK ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <GraduationCap size={17} className="text-primary shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-gray-800">Nilai Semua CPMK</h3>
                <p className="text-xs text-gray-400">{allCurriculumCpmkIds.length} CPMK dalam kurikulum · {uniqueCpmkIds.length} sudah dinilai · {cpmkTableRows.filter(r => r.score !== null).length} entri nilai</p>
              </div>
            </div>

            {cpmkTableRows.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-xs text-gray-400">
                  {isScoresLoading ? 'Memuat data CPMK...' : 'Belum ada data CPMK dalam kurikulum'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-gray-500 font-semibold whitespace-nowrap">Kode</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-semibold min-w-[200px]">Nama CPMK</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-semibold whitespace-nowrap">CPL Terkait</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-semibold whitespace-nowrap">Mata Kuliah</th>
                      <th className="text-center px-4 py-3 text-gray-500 font-semibold whitespace-nowrap min-w-[150px]">Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cpmkTableRows.map((row, i) => {
                      const c = row.score !== null ? scoreColor(row.score) : null;
                      return (
                        <tr key={row.key} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                          <td className="px-4 py-3">
                            <span className="text-[11px] font-bold text-purple-700 font-mono bg-purple-50 px-2 py-0.5 rounded-full">{row.code}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{row.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {row.cplCodes.length > 0
                                ? row.cplCodes.map((code) => (
                                  <span key={code} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap">{code}</span>
                                ))
                                : <span className="text-gray-300">–</span>
                              }
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {row.courses.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {row.courses.map((cr) => {
                                  const cs = cr.studentScore !== null ? scoreColor(cr.studentScore) : null;
                                  return cr.studentScore !== null && cs ? (
                                    <span key={cr.courseId} title={cr.name ? `${cr.name} · ${cr.studentScore}` : String(cr.studentScore)} className={`cursor-default text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap border ${cs.bg} ${cs.text}`}>
                                      {cr.code} · {cr.studentScore}
                                    </span>
                                  ) : (
                                    <span key={cr.courseId} title={cr.name || cr.code} className="cursor-default text-[10px] text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full whitespace-nowrap opacity-60">
                                      {cr.code}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-gray-300 text-[10px]">–</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {row.score !== null && c ? (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, row.score)}%`, backgroundColor: c.bar }} />
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md border shrink-0 ${c.bg} ${c.text}`}>{row.score}</span>
                              </div>
                            ) : (
                              <span className="text-gray-300 text-sm">–</span>
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

        </div>
      )}

      {/* Empty state */}
      {!selectedStudent && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-400">Pilih mahasiswa terlebih dahulu</p>
          <p className="text-xs text-gray-300 mt-1.5 max-w-xs mx-auto">
            Setelah memilih, sistem akan menampilkan mata kuliah, CPMK, CPL, dan nilai mahasiswa tersebut
          </p>
        </div>
      )}
    </div>
  );
}
