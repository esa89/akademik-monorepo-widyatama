import { useState, useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import {
  Download, Loader2, Users, BookOpen, GitMerge, Target,
  BarChart3, CheckCircle2, X, ChevronDown, RotateCcw,
} from 'lucide-react';
import {
  academicClassService, studentCpmkScoreService, cplService,
  cpmkCplMappingService, cpmkCourseMappingService, courseCpmkWeightService, courseService,
} from '@/services/obe.service';
import { useApp } from '@/contexts/AppContext';
import { effectiveCourseCount } from '@/constants/scoring';
import type { CourseCpmkWeight, Cpl } from '@/types';

// ─── Constants (sama dengan Dashboard) ───────────────────────────────────────

const DEFAULT_THRESHOLDS: Record<string, number> = {
  SIKAP: 80, PENGETAHUAN: 70, KETERAMPILAN_UMUM: 75, KETERAMPILAN_KHUSUS: 75,
};

const CATEGORY_LABEL: Record<string, string> = {
  SIKAP: 'Sikap', PENGETAHUAN: 'Pengetahuan',
  KETERAMPILAN_UMUM: 'Keterampilan Umum', KETERAMPILAN_KHUSUS: 'Keterampilan Khusus',
};

const CATEGORY_CHIP: Record<string, string> = {
  SIKAP: 'bg-blue-100 text-blue-700',
  PENGETAHUAN: 'bg-purple-100 text-purple-700',
  KETERAMPILAN_UMUM: 'bg-teal-100 text-teal-700',
  KETERAMPILAN_KHUSUS: 'bg-orange-100 text-orange-700',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ExportType = 'cpmk-scores' | 'cpl-achievement' | 'cpmk-by-mk' | 'curriculum-map';

type Row = (string | number)[];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcWeighted(compMap: Map<string, number>, compWeights?: Map<string, number>): number {
  if (!compWeights || compWeights.size === 0) {
    const vals = [...compMap.values()];
    return vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
  }
  let wSum = 0, wTotal = 0;
  for (const [compId, score] of compMap) {
    const w = compWeights.get(compId);
    if (w !== undefined) { wSum += score * w; wTotal += w; }
  }
  return wTotal > 0 ? wSum / wTotal : [...compMap.values()].reduce((a, b) => a + b, 0) / (compMap.size || 1);
}

// ─── Export type card ─────────────────────────────────────────────────────────

const EXPORT_TYPES: {
  key: ExportType; label: string; desc: string;
  icon: React.ReactNode; color: string; needsStudents: boolean;
}[] = [
  {
    key: 'cpmk-scores', label: 'Skor CPMK per Mahasiswa',
    desc: 'Skor tiap mahasiswa untuk setiap CPMK di setiap mata kuliah — lengkap dengan kode CPL, NIM, dan angkatan',
    icon: <Users size={22} />, color: 'text-blue-600 bg-blue-50 border-blue-200',
    needsStudents: true,
  },
  {
    key: 'cpl-achievement', label: 'Pencapaian CPL per Mahasiswa',
    desc: 'Matriks capaian tiap mahasiswa untuk semua CPL — satu kolom per CPL, satu baris per mahasiswa',
    icon: <Target size={22} />, color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    needsStudents: true,
  },
  {
    key: 'cpmk-by-mk', label: 'Ketercapaian CPMK per Mata Kuliah',
    desc: 'Statistik per (Mata Kuliah × CPMK): jumlah mahasiswa dinilai, rata-rata skor, dan persentase lulus',
    icon: <BarChart3 size={22} />, color: 'text-teal-600 bg-teal-50 border-teal-200',
    needsStudents: true,
  },
  {
    key: 'curriculum-map', label: 'Mapping Kurikulum CPL–CPMK–MK',
    desc: 'Peta keterkaitan CPL, CPMK, dan Mata Kuliah dalam kurikulum — data statis tanpa skor mahasiswa',
    icon: <GitMerge size={22} />, color: 'text-violet-600 bg-violet-50 border-violet-200',
    needsStudents: false,
  },
];

const EXPORT_META: Record<ExportType, { sheetName: string; filename: string }> = {
  'cpmk-scores':    { sheetName: 'Skor CPMK Mahasiswa',  filename: 'rekap_skor_cpmk' },
  'cpl-achievement':{ sheetName: 'Pencapaian CPL',        filename: 'pencapaian_cpl' },
  'cpmk-by-mk':    { sheetName: 'CPMK per Matakuliah',   filename: 'ketercapaian_cpmk_mk' },
  'curriculum-map': { sheetName: 'Mapping Kurikulum',     filename: 'mapping_kurikulum' },
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExportingPage() {
  const { selectedCurriculum } = useApp();
  const curriculumId = selectedCurriculum?.id;

  // ── UI state ────────────────────────────────────────────────────────────────
  const [exportType, setExportType] = useState<ExportType>('cpmk-scores');
  const [filterAngkatan, setFilterAngkatan] = useState<number[]>([]);
  const [filterCpmkId, setFilterCpmkId]     = useState('');
  const [filterSemester, setFilterSemester] = useState<number | null>(null);
  const [thresholds, setThresholds]         = useState<Record<string, number>>(DEFAULT_THRESHOLDS);

  // ── Static curriculum data ─────────────────────────────────────────────────
  const { data: cplData } = useQuery({
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

  // ── All classes (paginated) ─────────────────────────────────────────────────
  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['all-classes-export'],
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
  const allClasses = useMemo(() => classesData?.data ?? [], [classesData]);

  // ── Class details + scores (shared cache keys with Dashboard) ─────────────
  const classDetailResults = useQueries({
    queries: allClasses.map((cls) => ({
      queryKey: ['class-detail-dash', cls.id],
      queryFn:  () => academicClassService.getById(cls.id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const classScoreResults = useQueries({
    queries: allClasses.map((cls) => ({
      queryKey: ['class-scores-dash', cls.id],
      queryFn:  () => studentCpmkScoreService.getByClass(cls.id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  // ── Curriculum courses → weights + names (shared cache with Dashboard) ────
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
    for (const ids2 of cpmkIdToCourseIds.values()) ids2.forEach((id) => ids.add(id));
    return [...ids];
  }, [cpmkIdToCourseIds]);

  const courseByIdResults = useQueries({
    queries: allCurriculumCourseIds.map((courseId) => ({
      queryKey: ['course-by-id-dash', courseId],
      queryFn:  () => courseService.getById(courseId),
      staleTime: 30 * 60 * 1000,
    })),
  });

  const dashCourseWeightResults = useQueries({
    queries: allCurriculumCourseIds.map((courseId) => ({
      queryKey: ['course-weights-dash', courseId],
      queryFn:  () => courseCpmkWeightService.getAll({ courseId }),
      staleTime: 30 * 60 * 1000,
    })),
  });

  // ── Derived maps ───────────────────────────────────────────────────────────
  const allCpls = useMemo(() => ([...(cplData?.data ?? [])] as Cpl[]).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })), [cplData]);

  const allCourseInfoMap = useMemo(() => {
    const m = new Map<string, { code: string; name: string; semester?: number }>();
    courseByIdResults.forEach((q, i) => {
      const courseId = allCurriculumCourseIds[i];
      const course = q.data?.data;
      if (course) m.set(courseId, { code: course.code, name: course.name, semester: course.semester });
    });
    allClasses.forEach((cls) => { if (!m.has(cls.course.id)) m.set(cls.course.id, { code: cls.course.code, name: cls.course.name }); });
    return m;
  }, [courseByIdResults, allCurriculumCourseIds, allClasses]);

  const dashCourseWeightMap = useMemo(() => {
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

  const cplToCpmkIds = useMemo(() => {
    const map = new Map<string, string[]>();
    (cplCpmkMatrix?.data?.mappings ?? []).forEach(({ cplId, cpmkId }) => {
      if (!map.has(cplId)) map.set(cplId, []);
      map.get(cplId)!.push(cpmkId);
    });
    return map;
  }, [cplCpmkMatrix]);

  const cpmkToCplCodes = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const cpl of allCpls) {
      for (const cpmkId of cplToCpmkIds.get(cpl.id) ?? []) {
        if (!map.has(cpmkId)) map.set(cpmkId, []);
        map.get(cpmkId)!.push(cpl.code);
      }
    }
    return map;
  }, [allCpls, cplToCpmkIds]);

  // cpmkId → threshold (min threshold dari semua CPL yang terhubung, mengikuti Dashboard)
  const cpmkThresholdMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const cpl of allCpls) {
      const t = thresholds[cpl.category] ?? 75;
      for (const cpmkId of cplToCpmkIds.get(cpl.id) ?? []) {
        map.set(cpmkId, Math.min(map.get(cpmkId) ?? 100, t));
      }
    }
    return map;
  }, [allCpls, cplToCpmkIds, thresholds]);

  // CPMK info derived from score records (covers all scored CPMKs)
  const cpmkInfoMap = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    for (const res of classScoreResults) {
      for (const s of res.data?.data ?? []) {
        if (!map.has(s.cpmkId)) map.set(s.cpmkId, { code: s.cpmk.code, name: s.cpmk.name });
      }
    }
    // Also include CPMKs from matrix (e.g. unscored ones needed for curriculum-map export)
    for (const c of cplCpmkMatrix?.data?.cpmks ?? []) {
      if (!map.has(c.id)) map.set(c.id, { code: c.code, name: c.name });
    }
    return map;
  }, [classScoreResults, cplCpmkMatrix]);

  // Student lookup
  const studentMap = useMemo(() => {
    const map = new Map<string, { id: string; nim: string; name: string; entryYear: number }>();
    for (const q of classDetailResults) {
      for (const { student } of q.data?.data?.students ?? []) map.set(student.id, student);
    }
    return map;
  }, [classDetailResults]);

  // Scores indexed by student → cpmk → course → component
  const scoresByStudent = useMemo(() => {
    const map = new Map<string, Map<string, Map<string, Map<string, number>>>>();
    for (const res of classScoreResults) {
      for (const s of res.data?.data ?? []) {
        if (!map.has(s.studentId)) map.set(s.studentId, new Map());
        const sm = map.get(s.studentId)!;
        if (!sm.has(s.cpmkId)) sm.set(s.cpmkId, new Map());
        const cm = sm.get(s.cpmkId)!;
        if (!cm.has(s.courseId)) cm.set(s.courseId, new Map());
        cm.get(s.courseId)!.set(s.assessmentComponentId, s.score);
      }
    }
    return map;
  }, [classScoreResults]);

  // ── Loading state ───────────────────────────────────────────────────────────
  const classesLoaded  = !classesLoading && allClasses.length > 0;
  const totalQueries   = classesLoaded ? classDetailResults.length + classScoreResults.length : 0;
  const loadedQueries  = classDetailResults.filter((q) => q.isSuccess).length + classScoreResults.filter((q) => q.isSuccess).length;
  const studentDataReady = classesLoaded && totalQueries > 0 && loadedQueries >= totalQueries;
  const staticDataReady  = !!(allCpls.length > 0 && cplCpmkMatrix && cpmkMkMatrix);
  const isExportReady    = EXPORT_TYPES.find((t) => t.key === exportType)?.needsStudents ? studentDataReady : staticDataReady;
  const loadPct          = totalQueries > 0 ? Math.round((loadedQueries / totalQueries) * 100) : 0;

  // ── Filter options ─────────────────────────────────────────────────────────
  const angkatanOptions = useMemo(() => {
    const years = new Set<number>();
    for (const s of studentMap.values()) if (s.entryYear) years.add(s.entryYear);
    return [...years].sort((a, b) => a - b);
  }, [studentMap]);

  const cpmkOptions = useMemo(() => {
    const list: { id: string; code: string; name: string }[] = [];
    for (const [id, info] of cpmkInfoMap) list.push({ id, ...info });
    return list.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }, [cpmkInfoMap]);

  const semesterOptions = useMemo(() => {
    const sems = new Set<number>();
    for (const info of allCourseInfoMap.values()) if (info.semester) sems.add(info.semester);
    return [...sems].sort((a, b) => a - b);
  }, [allCourseInfoMap]);

  // ── Export headers & column widths ─────────────────────────────────────────
  const exportHeaders = useMemo((): string[] => {
    switch (exportType) {
      case 'cpmk-scores':     return ['Kode CPL', 'Kode CPMK', 'Nama CPMK', 'Kode MK', 'Nama MK', 'NIM', 'Nama Mahasiswa', 'Angkatan', 'Skor CPMK'];
      case 'cpl-achievement': return ['NIM', 'Nama Mahasiswa', 'Angkatan', ...allCpls.map((c) => c.code), '% CPL Terpenuhi', 'Status'];
      case 'cpmk-by-mk':     return ['Kode MK', 'Nama MK', 'Semester', 'Kode CPMK', 'Nama CPMK', 'Kode CPL', 'Jml Mhs Dinilai', 'Rata-rata Skor', '% Mhs Lulus Threshold'];
      case 'curriculum-map':  return ['Kode CPL', 'Nama CPL', 'Kategori CPL', 'Kode CPMK', 'Nama CPMK', 'Kode MK', 'Nama MK'];
    }
  }, [exportType, allCpls]);

  const exportColWidths = useMemo((): number[] => {
    switch (exportType) {
      case 'cpmk-scores':     return [22, 14, 35, 14, 40, 14, 32, 10, 12];
      case 'cpl-achievement': return [14, 32, 10, ...allCpls.map(() => 10), 18, 20];
      case 'cpmk-by-mk':     return [14, 40, 10, 14, 40, 22, 16, 16, 14];
      case 'curriculum-map':  return [14, 50, 22, 14, 50, 14, 50];
    }
  }, [exportType, allCpls]);

  // ── Export row builders ────────────────────────────────────────────────────
  const exportRows = useMemo((): Row[] => {
    if (!isExportReady) return [];
    const inAngkatan = (year: number) => filterAngkatan.length === 0 || filterAngkatan.includes(year);

    // ── Export 1: Skor CPMK per Mahasiswa ─────────────────────────────────
    if (exportType === 'cpmk-scores') {
      const rows: Row[] = [];
      for (const [studentId, cpmkMap] of scoresByStudent) {
        const student = studentMap.get(studentId);
        if (!student || !inAngkatan(student.entryYear)) continue;
        for (const [cpmkId, courseMap] of cpmkMap) {
          if (filterCpmkId && cpmkId !== filterCpmkId) continue;
          const cpmk    = cpmkInfoMap.get(cpmkId);
          const cplCodes = cpmkToCplCodes.get(cpmkId)?.join(', ') ?? '-';
          for (const [courseId, compMap] of courseMap) {
            const course = allCourseInfoMap.get(courseId);
            const score  = calcWeighted(compMap, dashCourseWeightMap.get(courseId)?.get(cpmkId));
            rows.push([
              cplCodes,
              cpmk?.code ?? '',
              cpmk?.name ?? '',
              course?.code ?? courseId.slice(0, 8),
              course?.name ?? '-',
              student.nim,
              student.name,
              student.entryYear,
              Math.round(score),
            ]);
          }
        }
      }
      rows.sort((a, b) =>
        String(a[1]).localeCompare(String(b[1]), undefined, { numeric: true }) ||
        String(a[3]).localeCompare(String(b[3])) ||
        String(a[5]).localeCompare(String(b[5]))
      );
      return rows;
    }

    // ── Export 2: Pencapaian CPL per Mahasiswa ─────────────────────────────
    if (exportType === 'cpl-achievement') {
      const rows: Row[] = [];
      for (const [studentId, cpmkMap] of scoresByStudent) {
        const student = studentMap.get(studentId);
        if (!student || !inAngkatan(student.entryYear)) continue;

        const cpmkAvg = new Map<string, number>();
        for (const [cpmkId, courseMap] of cpmkMap) {
          const currIds = cpmkIdToCourseIds.get(cpmkId);
          const denom   = currIds ? effectiveCourseCount(currIds, allCourseInfoMap) : courseMap.size;
          let sum = 0;
          for (const [courseId, compMap] of courseMap) {
            sum += calcWeighted(compMap, dashCourseWeightMap.get(courseId)?.get(cpmkId));
          }
          cpmkAvg.set(cpmkId, sum / (denom || 1));
        }

        let metCount = 0;
        let cplsWithData = 0;
        const cplScores: number[] = [];
        for (const cpl of allCpls) {
          const linked = cplToCpmkIds.get(cpl.id) ?? [];
          const scored = linked.filter((id) => cpmkAvg.has(id));
          if (scored.length === 0) { cplScores.push(0); continue; }
          cplsWithData++;
          const avg = scored.reduce((s, id) => s + cpmkAvg.get(id)!, 0) / linked.length;
          const rounded = Math.round(avg);
          cplScores.push(rounded);
          if (rounded >= (thresholds[cpl.category] ?? 75)) metCount++;
        }
        const pctStr = allCpls.length > 0
          ? `${Math.round((metCount / allCpls.length) * 100)}%`
          : '0%';
        // 4 status yang jelas:
        // "Belum Ada Data"   → tidak ada satupun CPL yang dinilai
        // "Belum Terpenuhi"  → ada data tapi 0 CPL mencapai threshold
        // "Sebagian"         → sebagian CPL mencapai threshold
        // "Semua Terpenuhi"  → semua CPL mencapai threshold
        const status = cplsWithData === 0
          ? 'Belum Ada Data'
          : metCount === allCpls.length
            ? 'Semua Terpenuhi'
            : metCount === 0
              ? 'Belum Terpenuhi'
              : 'Sebagian';
        rows.push([student.nim, student.name, student.entryYear, ...cplScores, pctStr, status]);
      }
      rows.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
      return rows;
    }

    // ── Export 3: Ketercapaian CPMK per Mata Kuliah ─────────────────────────
    if (exportType === 'cpmk-by-mk') {
      // courseId → cpmkId → studentId → weighted score
      const raw = new Map<string, Map<string, Map<string, number>>>();
      for (const [studentId, cpmkMap] of scoresByStudent) {
        const student = studentMap.get(studentId);
        if (!student || !inAngkatan(student.entryYear)) continue;
        for (const [cpmkId, courseMap] of cpmkMap) {
          for (const [courseId, compMap] of courseMap) {
            if (!raw.has(courseId)) raw.set(courseId, new Map());
            if (!raw.get(courseId)!.has(cpmkId)) raw.get(courseId)!.set(cpmkId, new Map());
            const ws = calcWeighted(compMap, dashCourseWeightMap.get(courseId)?.get(cpmkId));
            raw.get(courseId)!.get(cpmkId)!.set(studentId, ws);
          }
        }
      }
      const rows: Row[] = [];
      for (const [courseId, cpmkMap] of raw) {
        const course = allCourseInfoMap.get(courseId);
        if (filterSemester !== null && course?.semester !== filterSemester) continue;
        for (const [cpmkId, stuMap] of cpmkMap) {
          const cpmk   = cpmkInfoMap.get(cpmkId);
          const scores = [...stuMap.values()];
          const avg    = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
          const passing = scores.filter((s) => s >= (cpmkThresholdMap.get(cpmkId) ?? 75)).length;
          const pct    = scores.length > 0 ? Math.round((passing / scores.length) * 100) : 0;
          rows.push([
            course?.code ?? courseId.slice(0, 8),
            course?.name ?? '-',
            course?.semester ?? '-',
            cpmk?.code ?? '',
            cpmk?.name ?? '',
            cpmkToCplCodes.get(cpmkId)?.join(', ') ?? '-',
            scores.length,
            Math.round(avg),
            `${pct}%`,
          ]);
        }
      }
      rows.sort((a, b) =>
        String(a[0]).localeCompare(String(b[0])) ||
        String(a[3]).localeCompare(String(b[3]), undefined, { numeric: true })
      );
      return rows;
    }

    // ── Export 4: Mapping Kurikulum CPL–CPMK–MK ───────────────────────────
    if (exportType === 'curriculum-map') {
      const rows: Row[] = [];
      for (const cpl of allCpls) {
        const linkedCpmkIds = cplToCpmkIds.get(cpl.id) ?? [];
        if (linkedCpmkIds.length === 0) {
          rows.push([cpl.code, cpl.name, cpl.category?.replace(/_/g, ' ') ?? '', '-', '-', '-', '-']);
          continue;
        }
        for (const cpmkId of linkedCpmkIds) {
          const cpmk           = cpmkInfoMap.get(cpmkId);
          const linkedCourseIds = cpmkIdToCourseIds.get(cpmkId) ?? [];
          if (linkedCourseIds.length === 0) {
            rows.push([cpl.code, cpl.name, cpl.category?.replace(/_/g, ' ') ?? '', cpmk?.code ?? '', cpmk?.name ?? '', '-', '-']);
          } else {
            for (const courseId of linkedCourseIds) {
              const course = allCourseInfoMap.get(courseId);
              rows.push([
                cpl.code, cpl.name, cpl.category?.replace(/_/g, ' ') ?? '',
                cpmk?.code ?? '', cpmk?.name ?? '',
                course?.code ?? courseId.slice(0, 8),
                course?.name ?? '-',
              ]);
            }
          }
        }
      }
      return rows;
    }

    return [];
  }, [
    exportType, isExportReady, filterAngkatan, filterCpmkId, filterSemester, thresholds,
    scoresByStudent, studentMap, cpmkInfoMap, allCourseInfoMap, dashCourseWeightMap,
    allCpls, cplToCpmkIds, cpmkToCplCodes, cpmkIdToCourseIds, cpmkThresholdMap,
  ]);

  // ── XLSX export ────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (exportRows.length === 0) return;
    const meta = EXPORT_META[exportType];
    const ws   = XLSX.utils.aoa_to_sheet([exportHeaders, ...exportRows]);
    ws['!cols'] = exportColWidths.map((wch) => ({ wch }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, meta.sheetName);
    XLSX.writeFile(wb, `${meta.filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const selectedExportType = EXPORT_TYPES.find((t) => t.key === exportType)!;
  const previewRows        = exportRows.slice(0, 15);

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-blue-700 text-white p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <Download size={20} className="opacity-80" />
          <h1 className="text-xl font-bold">Export Data OBE</h1>
        </div>
        <p className="text-sm opacity-75">Unduh rekap data pencapaian OBE dalam format Excel (.xlsx)</p>
      </div>

      {/* Export type selector */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pilih Jenis Export</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {EXPORT_TYPES.map((t) => {
            const isActive = exportType === t.key;
            return (
              <button
                key={t.key}
                onClick={() => { setExportType(t.key); setFilterCpmkId(''); setFilterAngkatan([]); setFilterSemester(null); }}
                className={`text-left p-4 rounded-2xl border-2 transition-all ${isActive
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-gray-100 bg-white hover:border-primary/30 hover:shadow-sm'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 border ${t.color}`}>
                  {t.icon}
                </div>
                <p className={`text-sm font-bold mb-1 ${isActive ? 'text-primary' : 'text-gray-800'}`}>{t.label}</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Config panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${selectedExportType.color}`}>
            {selectedExportType.icon}
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">{selectedExportType.label}</h2>
            <p className="text-xs text-gray-400">{selectedExportType.desc}</p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Angkatan filter — all except curriculum-map */}
          {exportType !== 'curriculum-map' && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Filter Angkatan</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterAngkatan([])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${filterAngkatan.length === 0 ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}
                >
                  Semua Angkatan
                </button>
                {angkatanOptions.map((y) => (
                  <button
                    key={y}
                    onClick={() =>
                      setFilterAngkatan((prev) =>
                        prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y]
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${filterAngkatan.includes(y) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}
                  >
                    {y}
                    {filterAngkatan.includes(y) && (
                      <X size={10} className="inline ml-1 mb-0.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CPMK filter — only for cpmk-scores */}
          {exportType === 'cpmk-scores' && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Filter CPMK</p>
              <div className="relative max-w-xs">
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select
                  value={filterCpmkId}
                  onChange={(e) => setFilterCpmkId(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                >
                  <option value="">Semua CPMK</option>
                  {cpmkOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Semester filter — only for cpmk-by-mk */}
          {exportType === 'cpmk-by-mk' && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Filter Semester Mata Kuliah</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterSemester(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${filterSemester === null ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}
                >
                  Semua Semester
                </button>
                {semesterOptions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterSemester(filterSemester === s ? null : s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${filterSemester === s ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}
                  >
                    Sem. {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Threshold panel per-kategori — sama persis dengan Dashboard */}
          {(exportType === 'cpl-achievement' || exportType === 'cpmk-by-mk') && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Threshold Kelulusan CPL</p>
                <button
                  onClick={() => setThresholds(DEFAULT_THRESHOLDS)}
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
                      onChange={(e) => setThresholds((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="w-full h-1.5 rounded-full accent-primary cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>0%</span><span>100%</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-3">
                {exportType === 'cpl-achievement' && 'Digunakan untuk kolom "Status" — apakah CPL terpenuhi atau belum per mahasiswa'}
                {exportType === 'cpmk-by-mk' && 'Threshold per kategori CPL digunakan untuk menghitung % mahasiswa lulus per CPMK'}
              </p>
            </div>
          )}

          {/* Loading progress */}
          {selectedExportType.needsStudents && (
            <div className="pt-1">
              {!studentDataReady ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Loader2 size={12} className="animate-spin text-primary" />
                      {classesLoading
                        ? 'Memuat daftar kelas…'
                        : `Memuat data kelas ${loadedQueries} / ${totalQueries}…`}
                    </span>
                    <span className="font-semibold text-primary">{loadPct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${loadPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">Data kelas yang sudah dimuat di halaman lain akan langsung digunakan dari cache.</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 size={16} />
                  <span className="font-semibold">Data siap</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-500">{exportRows.length.toLocaleString('id-ID')} baris akan diekspor</span>
                </div>
              )}
            </div>
          )}

          {exportType === 'curriculum-map' && staticDataReady && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 size={16} />
              <span className="font-semibold">Data kurikulum siap</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500">{exportRows.length.toLocaleString('id-ID')} baris</span>
            </div>
          )}

          {/* Export button */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={handleExport}
              disabled={!isExportReady || exportRows.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Download size={16} />
              Export {EXPORT_META[exportType].filename.replace(/_/g, ' ')}.xlsx
            </button>
            {isExportReady && exportRows.length > 0 && (
              <p className="text-xs text-gray-400">
                {exportRows.length.toLocaleString('id-ID')} baris · {exportHeaders.length} kolom
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Preview table */}
      {isExportReady && previewRows.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-800">Preview Data</p>
            <p className="text-xs text-gray-400">
              Menampilkan {previewRows.length} dari {exportRows.length.toLocaleString('id-ID')} baris
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {exportHeaders.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, ri) => (
                  <tr key={ri} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    {row.map((cell, ci) => {
                      const isScore = exportType === 'cpmk-scores' && ci === 8;
                      const isScoreMk = exportType === 'cpmk-by-mk' && ci === 7;
                      const num = (isScore || isScoreMk) ? Number(cell) : null;
                      const scoreColor = num !== null
                        ? num >= 75 ? 'text-emerald-600 font-bold' : num >= 50 ? 'text-amber-600 font-bold' : 'text-red-500 font-bold'
                        : '';
                      return (
                        <td key={ci} className={`px-3 py-2 text-gray-700 whitespace-nowrap max-w-[200px] truncate ${scoreColor}`}>
                          {String(cell)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {exportRows.length > 15 && (
            <div className="px-5 py-2.5 text-center text-xs text-gray-400 border-t border-gray-50 bg-gray-50/40">
              … dan {(exportRows.length - 15).toLocaleString('id-ID')} baris lainnya dalam file Excel
            </div>
          )}
        </div>
      )}

      {isExportReady && exportRows.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <BookOpen size={32} className="text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400 font-medium">Tidak ada data dengan filter yang dipilih</p>
          <p className="text-xs text-gray-300 mt-1">Coba ubah atau hapus filter angkatan / CPMK</p>
        </div>
      )}

    </div>
  );
}
