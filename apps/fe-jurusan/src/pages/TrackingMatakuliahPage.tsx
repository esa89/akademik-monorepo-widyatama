import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import {
  Search, BookOpen, Target, Layers, ChevronDown,
  GraduationCap, BookOpenCheck, ClipboardCheck, X,
} from 'lucide-react';
import {
  courseService, courseCpmkWeightService, subCpmkService,
  cplService, cpmkService,
} from '@/services/obe.service';
import { useApp } from '@/contexts/AppContext';
import type { Cpl, SubCpmk } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<string, string> = {
  SIKAP:               'Sikap',
  PENGETAHUAN:         'Pengetahuan',
  KETERAMPILAN_UMUM:   'KU',
  KETERAMPILAN_KHUSUS: 'KK',
};
const CATEGORY_CHIP: Record<string, string> = {
  SIKAP:               'bg-blue-100 text-blue-700 border-blue-200',
  PENGETAHUAN:         'bg-purple-100 text-purple-700 border-purple-200',
  KETERAMPILAN_UMUM:   'bg-teal-100 text-teal-700 border-teal-200',
  KETERAMPILAN_KHUSUS: 'bg-orange-100 text-orange-700 border-orange-200',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseDetail {
  id: string;
  code: string;
  name: string;
  sks: number;
  semester: number;
  isActive: boolean;
  curriculumId?: string;
  curriculum?: { id: string; code: string; name: string; year: number };
  description?: string | null;
}

interface CpmkGroup {
  id: string;
  code: string;
  name: string;
  components: { code: string; name: string; weight: number }[];
  subCpmks: SubCpmk[];
}

interface CplGroup {
  cpl: Cpl;
  cpmks: CpmkGroup[];
}

// ─── Sub-component: CPMK Card ─────────────────────────────────────────────────

function CpmkCard({ cpmk }: { cpmk: CpmkGroup }) {
  return (
    <div className="pl-4 border-l-2 border-purple-100 ml-3 py-1">
      {/* CPMK header */}
      <div className="flex items-start gap-2.5 mb-2">
        <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
          <BookOpen size={12} className="text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-xs font-bold text-purple-700">{cpmk.code}</span>
          </div>
          <p className="text-sm text-gray-700 leading-snug">{cpmk.name}</p>
        </div>
      </div>

      {/* Assessment components */}
      {cpmk.components.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3 pl-8">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide self-center mr-1">Komponen:</span>
          {cpmk.components
            .slice()
            .sort((a, b) => a.code.localeCompare(b.code))
            .map((comp) => (
              <span
                key={comp.code}
                title={comp.name}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-100 rounded-full font-medium"
              >
                <ClipboardCheck size={9} className="text-orange-400" />
                {comp.code}
                <span className="text-orange-400 font-normal">· {comp.weight}%</span>
              </span>
            ))}
        </div>
      )}

      {/* Sub-CPMKs */}
      <div className="pl-8">
        {cpmk.subCpmks.length > 0 ? (
          <>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Sub-CPMK</p>
            <div className="space-y-1.5">
              {cpmk.subCpmks.map((sub) => (
                <div key={sub.id} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-md bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Layers size={10} className="text-teal-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-teal-700 mr-1.5">{sub.code}</span>
                    <span className="text-[12px] text-gray-600">{sub.name}</span>
                    {sub.description && (
                      <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{sub.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[11px] text-gray-300 italic">Belum ada Sub-CPMK terdaftar</p>
        )}
      </div>
    </div>
  );
}

// ─── Sub-component: CPL Group Card ───────────────────────────────────────────

function CplGroupCard({
  group, expanded, onToggle,
}: {
  group: CplGroup;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { cpl, cpmks } = group;
  const catChip = CATEGORY_CHIP[cpl.category] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  const totalSub = cpmks.reduce((s, c) => s + c.subCpmks.length, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* CPL header row */}
      <button
        className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-gray-50/70 transition-colors group"
        onClick={onToggle}
      >
        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
          <Target size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-blue-700">{cpl.code}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${catChip}`}>
              {CATEGORY_LABEL[cpl.category] ?? cpl.category}
            </span>
            <span className="text-[11px] text-gray-400">
              {cpmks.length} CPMK · {totalSub} Sub-CPMK
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-snug line-clamp-2">{cpl.name}</p>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 shrink-0 mt-1.5 transition-transform duration-200 group-hover:text-gray-600
            ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* CPMK list (expanded) */}
      {expanded && (
        <div className="border-t border-gray-50 divide-y divide-gray-50">
          {cpmks.map((cpmk) => (
            <div key={cpmk.id} className="px-5 py-4">
              <CpmkCard cpmk={cpmk} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TrackingMatakuliahPage() {
  const { selectedCurriculum } = useApp();

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expandedCpls, setExpandedCpls] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCourseIdRef = useRef<string | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses-tracking'],
    queryFn: () => courseService.getAll({ limit: 100, isActive: true }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: cplListData } = useQuery({
    queryKey: ['cpl-list-full'],
    queryFn: () => cplService.getAll({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: weightsData, isFetching: weightsFetching } = useQuery({
    queryKey: ['course-weights-tracking', selectedCourseId],
    queryFn: () => courseCpmkWeightService.getAll({ courseId: selectedCourseId! }),
    enabled: !!selectedCourseId,
  });

  const { data: subCpmkData, isFetching: subFetching } = useQuery({
    queryKey: ['sub-cpmk-tracking', selectedCourseId],
    queryFn: () => subCpmkService.getAll({ courseId: selectedCourseId, limit: 100 }),
    enabled: !!selectedCourseId,
  });

  // ── Unique CPMK IDs from weights ──────────────────────────────────────────

  const uniqueCpmkIds = useMemo(() => {
    const weights = weightsData?.data ?? [];
    return [...new Set(weights.map((w) => w.cpmkId))];
  }, [weightsData]);

  // ── Fetch each CPMK detail for CPL links ─────────────────────────────────

  const cpmkDetailResults = useQueries({
    queries: uniqueCpmkIds.map((id) => ({
      queryKey: ['cpmk-detail-tracking', id],
      queryFn: () => cpmkService.getById(id),
      enabled: !!selectedCourseId,
      staleTime: 5 * 60 * 1000,
    })),
  });

  // ── Derived state ─────────────────────────────────────────────────────────

  const allCpls = useMemo(() => (cplListData?.data ?? []) as Cpl[], [cplListData]);
  const weights = useMemo(() => weightsData?.data ?? [], [weightsData]);
  const subCpmks = useMemo(() => subCpmkData?.data ?? [], [subCpmkData]);

  // cpmkId → CPL codes linked to it
  const cpmkToCplCodes = useMemo(() => {
    const map = new Map<string, string[]>();
    cpmkDetailResults.forEach((q, i) => {
      const id = uniqueCpmkIds[i];
      if (q.data?.data?.cpls) {
        map.set(id, (q.data.data.cpls as { code: string }[]).map((c) => c.code));
      }
    });
    return map;
  }, [cpmkDetailResults, uniqueCpmkIds]);

  // cpmkId → assessment components
  const cpmkToComponents = useMemo(() => {
    const map = new Map<string, { code: string; name: string; weight: number }[]>();
    for (const w of weights) {
      if (!map.has(w.cpmkId)) map.set(w.cpmkId, []);
      map.get(w.cpmkId)!.push({
        code: w.assessmentComponent.code,
        name: w.assessmentComponent.name,
        weight: w.weight,
      });
    }
    return map;
  }, [weights]);

  // cpmkId → sub-CPMKs
  const cpmkToSubCpmks = useMemo(() => {
    const map = new Map<string, SubCpmk[]>();
    for (const s of subCpmks) {
      if (!map.has(s.cpmkId)) map.set(s.cpmkId, []);
      map.get(s.cpmkId)!.push(s);
    }
    return map;
  }, [subCpmks]);

  // Build CPL → CPMK hierarchy
  const cplGroups = useMemo((): CplGroup[] => {
    if (uniqueCpmkIds.length === 0) return [];
    const coveredCplCodes = new Set<string>();
    for (const codes of cpmkToCplCodes.values()) {
      for (const code of codes) coveredCplCodes.add(code);
    }

    return allCpls
      .filter((cpl) => coveredCplCodes.has(cpl.code))
      .map((cpl) => {
        const cpmks: CpmkGroup[] = uniqueCpmkIds
          .filter((id) => (cpmkToCplCodes.get(id) ?? []).includes(cpl.code))
          .map((id) => {
            const wEntry = weights.find((w) => w.cpmkId === id);
            return {
              id,
              code: wEntry?.cpmk.code ?? '',
              name: wEntry?.cpmk.name ?? '',
              components: cpmkToComponents.get(id) ?? [],
              subCpmks: (cpmkToSubCpmks.get(id) ?? []).sort((a, b) => a.orderNumber - b.orderNumber),
            };
          })
          .sort((a, b) => a.code.localeCompare(b.code));

        return { cpl, cpmks };
      })
      .sort((a, b) => a.cpl.code.localeCompare(b.cpl.code));
  }, [allCpls, uniqueCpmkIds, cpmkToCplCodes, weights, cpmkToComponents, cpmkToSubCpmks]);

  // Auto-expand all CPL groups when a new course is selected
  useEffect(() => {
    if (selectedCourseId !== prevCourseIdRef.current && cplGroups.length > 0) {
      prevCourseIdRef.current = selectedCourseId;
      setExpandedCpls(new Set(cplGroups.map((g) => g.cpl.id)));
    }
  }, [selectedCourseId, cplGroups]);

  // ── Course list filtering ─────────────────────────────────────────────────

  const courses = useMemo(() => {
    const all = (coursesData?.data ?? []) as CourseDetail[];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    );
  }, [coursesData, search]);

  const coursesBySemester = useMemo(() => {
    const map = new Map<number, CourseDetail[]>();
    for (const c of courses) {
      const sem = c.semester ?? 0;
      if (!map.has(sem)) map.set(sem, []);
      map.get(sem)!.push(c);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [courses]);

  const selectedCourse = useMemo(
    () => (coursesData?.data as CourseDetail[] | undefined)?.find((c) => c.id === selectedCourseId) ?? null,
    [coursesData, selectedCourseId],
  );

  const isLoadingDetail = !!selectedCourseId && (
    weightsFetching || subFetching ||
    (uniqueCpmkIds.length > 0 && cpmkDetailResults.some((q) => q.isFetching))
  );

  const hasNoData = !!selectedCourseId && !isLoadingDetail && !weightsFetching && weights.length === 0;

  const toggleCpl = (id: string) => {
    setExpandedCpls((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSelectCourse = (course: CourseDetail) => {
    setSelectedCourseId(course.id);
    setDropdownOpen(false);
    setSearch('');
    setExpandedCpls(new Set());
    prevCourseIdRef.current = null;
  };

  const clearSelection = () => {
    setSelectedCourseId(null);
    setExpandedCpls(new Set());
    prevCourseIdRef.current = null;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-8">

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tracking per Mata Kuliah</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Lacak Sub-CPMK, CPMK, dan CPL yang dicakup oleh setiap mata kuliah
        </p>
      </div>

      {/* Course selector */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pilih Mata Kuliah</p>

        <div className="relative" ref={dropdownRef}>
          {/* Trigger / search input */}
          <div
            className={`flex items-center gap-2 w-full border rounded-xl px-3 py-2.5 bg-white transition-all cursor-text
              ${dropdownOpen ? 'border-primary/40 ring-2 ring-primary/10 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
            onClick={() => setDropdownOpen(true)}
          >
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder={selectedCourse ? selectedCourse.code + ' · ' + selectedCourse.name : 'Cari kode atau nama mata kuliah…'}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setDropdownOpen(true); }}
              onFocus={() => setDropdownOpen(true)}
              className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
            />
            {selectedCourse && !dropdownOpen && (
              <button
                onClick={(e) => { e.stopPropagation(); clearSelection(); }}
                className="text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X size={14} />
              </button>
            )}
            <ChevronDown
              size={14}
              className={`text-gray-400 shrink-0 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </div>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
              <div className="max-h-72 overflow-y-auto">
                {coursesLoading ? (
                  <div className="flex items-center justify-center gap-2 py-6">
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                    <p className="text-xs text-gray-400">Memuat daftar mata kuliah...</p>
                  </div>
                ) : courses.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-6">Tidak ada mata kuliah ditemukan</p>
                ) : coursesBySemester.map(([semester, semCourses]) => (
                  <div key={semester}>
                    <div className="sticky top-0 px-4 py-1.5 bg-gray-50 border-b border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Semester {semester}</p>
                    </div>
                    {semCourses.map((course) => {
                      const isSel = selectedCourseId === course.id;
                      return (
                        <button
                          key={course.id}
                          onClick={() => handleSelectCourse(course)}
                          className={`w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors
                            ${isSel ? 'bg-primary/5' : ''}`}
                        >
                          <span className="text-xs font-bold text-primary w-20 shrink-0">{course.code}</span>
                          <span className="text-sm text-gray-700 truncate flex-1">{course.name}</span>
                          <span className="text-[11px] text-gray-400 shrink-0">{course.sks} SKS</span>
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

        {/* Selected course chip */}
        {selectedCourse && !dropdownOpen && (
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary/5 text-primary rounded-full border border-primary/20 font-medium">
              <BookOpen size={11} />
              {selectedCourse.code} · {selectedCourse.name}
            </span>
          </div>
        )}
      </div>

      {/* ── Selected course detail ── */}
      {selectedCourse && (
        <div className="space-y-4">

          {/* Course info banner */}
          <div className="bg-gradient-to-r from-primary to-blue-700 text-white p-5 rounded-2xl shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 opacity-80">
                  <GraduationCap size={14} />
                  <span className="text-xs font-medium">{selectedCourse.code}</span>
                  {selectedCourse.curriculum && (
                    <>
                      <span className="opacity-40">·</span>
                      <span className="text-xs">{selectedCourse.curriculum.code}</span>
                    </>
                  )}
                </div>
                <h2 className="text-lg font-bold leading-tight truncate">{selectedCourse.name}</h2>
                {selectedCourse.description && (
                  <p className="text-sm opacity-70 mt-1 line-clamp-2">{selectedCourse.description}</p>
                )}
              </div>
              <div className="flex gap-5 shrink-0">
                <div className="text-center">
                  <div className="text-2xl font-bold">{selectedCourse.semester}</div>
                  <div className="text-xs opacity-70">Semester</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{selectedCourse.sks}</div>
                  <div className="text-xs opacity-70">SKS</div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {isLoadingDetail && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-gray-400">Memuat data OBE mata kuliah...</p>
            </div>
          )}

          {/* No OBE data */}
          {hasNoData && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <BookOpenCheck size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500">Belum ada data OBE untuk mata kuliah ini</p>
              <p className="text-xs text-gray-400 mt-1">
                Data bobot CPMK belum dikonfigurasi — atur di menu Bobot Penilaian CPMK
              </p>
            </div>
          )}

          {/* Summary stats */}
          {!isLoadingDetail && cplGroups.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'CPL Dicakup',
                  value: cplGroups.length,
                  icon: <Target size={18} className="text-blue-600" />,
                  bg: 'bg-blue-50',
                  sub: 'dari total CPL program studi',
                },
                {
                  label: 'CPMK',
                  value: uniqueCpmkIds.length,
                  icon: <BookOpen size={18} className="text-purple-600" />,
                  bg: 'bg-purple-50',
                  sub: 'capaian per mata kuliah',
                },
                {
                  label: 'Sub-CPMK',
                  value: subCpmks.length,
                  icon: <Layers size={18} className="text-teal-600" />,
                  bg: 'bg-teal-50',
                  sub: 'sub-capaian terdaftar',
                },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                  <div className={`p-2.5 ${s.bg} rounded-xl shrink-0`}>{s.icon}</div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs font-semibold text-gray-600">{s.label}</p>
                    <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CPL → CPMK → Sub-CPMK hierarchy */}
          {!isLoadingDetail && cplGroups.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Hierarki OBE</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExpandedCpls(new Set(cplGroups.map((g) => g.cpl.id)))}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Buka semua
                  </button>
                  <span className="text-gray-300">·</span>
                  <button
                    onClick={() => setExpandedCpls(new Set())}
                    className="text-[11px] text-gray-400 hover:text-gray-600 hover:underline"
                  >
                    Tutup semua
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-[11px] text-gray-500 px-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Target size={10} className="text-white" />
                  </span>
                  CPL
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-lg bg-purple-100 flex items-center justify-center">
                    <BookOpen size={10} className="text-purple-600" />
                  </span>
                  CPMK
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-teal-50 border border-teal-100 flex items-center justify-center">
                    <Layers size={10} className="text-teal-500" />
                  </span>
                  Sub-CPMK
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center">
                    <ClipboardCheck size={9} className="text-orange-400" />
                  </span>
                  Komponen Penilaian
                </span>
              </div>

              {cplGroups.map((group) => (
                <CplGroupCard
                  key={group.cpl.id}
                  group={group}
                  expanded={expandedCpls.has(group.cpl.id)}
                  onToggle={() => toggleCpl(group.cpl.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state: no course selected */}
      {!selectedCourse && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={32} className="text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-400">Pilih mata kuliah terlebih dahulu</p>
          <p className="text-xs text-gray-300 mt-1.5 max-w-xs mx-auto">
            Setelah memilih, sistem akan menampilkan CPL, CPMK, dan Sub-CPMK yang dicakup oleh mata kuliah tersebut
          </p>
        </div>
      )}
    </div>
  );
}
