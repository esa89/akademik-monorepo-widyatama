import { useState, useMemo, useRef, useEffect, type ReactNode } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend,
  LineChart, Line,
} from 'recharts';
import {
  Users, GraduationCap, AlertTriangle, CheckCircle2,
  TrendingUp, Target, BookOpen, Layers, ClipboardCheck,
  ChevronDown, ChevronRight, User, Search, X,
} from 'lucide-react';
import { useUser } from '@widyatama/sso-react';
import {
  ACADEMIC_SEMESTERS,
  STUDENTS,
  CPL_LIST,
  CPL_CPMK_MAP,
  CPL_COURSE_MAP,
  CPMK_LIST,
  COURSES,
  GRADES,
  getAvailableCourses,
  computeStudentCplResults,
  computeCplStats,
  type CplAggStat,
  type StudentCplResult,
} from '@/data/cpl-dummy';

// ─── Static dummy OBE counts ──────────────────────────────────────────────────
// CPMK ≈ jumlah MK sem 1–3 (23) × 4 rata-rata; Sub ≈ CPMK × 3; Assessment ≈ Sub × 2
const OBE_STATS = { cpl: 12, cpmk: 122, subCpmk: 575, assessment: 1035 };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pctColor(pct: number) {
  if (pct >= 75) return { bar: '#10b981', text: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (pct >= 50) return { bar: '#f59e0b', text: 'text-yellow-600', bg: 'bg-yellow-50' };
  return { bar: '#f87171', text: 'text-red-500', bg: 'bg-red-50' };
}

const CATEGORY_COLOR: Record<string, { chip: string; radar: string }> = {
  SIKAP:        { chip: 'bg-blue-100 text-blue-700',   radar: '#6366f1' },
  PENGETAHUAN:  { chip: 'bg-purple-100 text-purple-700', radar: '#8b5cf6' },
  KETERAMPILAN: { chip: 'bg-teal-100 text-teal-700',   radar: '#14b8a6' },
};

// ─── GPA helpers ─────────────────────────────────────────────────────────────
function gradeToGpa(score: number): number {
  if (score >= 80) return 4.0;
  if (score >= 75) return 3.5;
  if (score >= 70) return 3.0;
  if (score >= 65) return 2.5;
  if (score >= 60) return 2.0;
  if (score >= 55) return 1.5;
  if (score >= 50) return 1.0;
  return 0.0;
}

const GRADE_BUCKETS = [
  { label: 'E',  min: 0,  max: 49,  isFail: true  },
  { label: 'D',  min: 50, max: 54,  isFail: true  },
  { label: 'CD', min: 55, max: 59,  isFail: true  },
  { label: 'C',  min: 60, max: 64,  isFail: true  },
  { label: 'BC', min: 65, max: 69,  isFail: false },
  { label: 'B',  min: 70, max: 74,  isFail: false },
  { label: 'AB', min: 75, max: 79,  isFail: false },
  { label: 'A',  min: 80, max: 100, isFail: false },
] as const;

// ─── Top List Card ────────────────────────────────────────────────────────────
function TopCard({
  title, icon, colValue, rows,
}: {
  title: string;
  icon: ReactNode;
  colValue: string;
  rows: { name: string; nim: string; angkatan: number; value: string | number; valueCls: string }[];
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        </div>
        <span className="text-xs text-primary font-medium flex items-center gap-0.5 cursor-pointer hover:underline">
          Selengkapnya <ChevronRight size={11} />
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] px-5 py-2 bg-gray-50/60 border-b border-gray-50">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Mahasiswa</p>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-16 text-center">Angk.</p>
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-24 text-right">{colValue}</p>
      </div>
      {rows.map((row, i) => (
        <div key={row.nim}
          className="grid grid-cols-[1fr_auto_auto] items-center px-5 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0
              ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-200 text-gray-500' :
                i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{row.name}</p>
              <p className="text-[10px] text-gray-400">{row.nim}</p>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 w-16 text-center">{row.angkatan}</p>
          <p className={`text-sm font-bold w-24 text-right ${row.valueCls}`}>{row.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Grade Distribution Heatmap ───────────────────────────────────────────────
function GradeHeatmap({ semId }: { semId: string }) {
  const data = useMemo(() => {
    const activeSem = ACADEMIC_SEMESTERS.find((s) => s.id === semId)!;
    return COURSES.filter((c) => {
      return activeSem.angkatan2024Sems.includes(c.semesterNum) ||
             activeSem.angkatan2025Sems.includes(c.semesterNum);
    }).map((course) => {
      const counts = GRADE_BUCKETS.map((b) => {
        let n = 0;
        for (const s of STUDENTS) {
          const semNums = s.angkatan === 2024 ? activeSem.angkatan2024Sems : activeSem.angkatan2025Sems;
          if (!semNums.includes(course.semesterNum)) continue;
          const score = GRADES[`${s.nim}-${course.code}`] ?? 0;
          if (score >= b.min && score <= b.max) n++;
        }
        return n;
      });
      const total = counts.reduce((a, c) => a + c, 0);
      const passed = counts.slice(4).reduce((a, c) => a + c, 0); // BC (≥65) ke atas
      return { course, counts, total, passRate: total > 0 ? Math.round((passed / total) * 100) : 0 };
    });
  }, [semId]);

  const maxCount = Math.max(...data.flatMap((d) => d.counts), 1);
  const worstCourse = [...data].filter((d) => d.total > 0).sort((a, b) => a.passRate - b.passRate)[0];
  const validData = data.filter((d) => d.total > 0);
  const avgPassRate = validData.length
    ? Math.round(validData.reduce((s, d) => s + d.passRate, 0) / validData.length)
    : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-800">Distribusi Nilai Mata Kuliah</h2>
          <p className="text-xs text-gray-400">Sebaran huruf mutu per MK · merah = tidak lulus · biru = lulus</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 shrink-0">
          <span>Sedikit</span>
          {[0.1, 0.3, 0.55, 0.75, 0.92].map((v, i) => (
            <div key={i} className="w-5 h-4 rounded" style={{ background: `rgba(37,99,235,${v})` }} />
          ))}
          <span>Banyak</span>
        </div>
      </div>

      {/* Insight alerts */}
      <div className="px-5 py-3 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {worstCourse && (
          <div className="flex items-center gap-2.5 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2.5">
            <AlertTriangle size={13} className="text-yellow-500 shrink-0" />
            <p className="text-xs text-yellow-700">
              <span className="font-semibold">MK kelulusan terendah:</span>{' '}
              {worstCourse.course.name} ({worstCourse.passRate}% lulus)
            </p>
          </div>
        )}
        <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
          <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
          <p className="text-xs text-emerald-700">
            <span className="font-semibold">Rata-rata kelulusan {avgPassRate}%</span>{' '}
            dari seluruh mata kuliah aktif semester ini
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="p-4 overflow-x-auto">
        {/* Column headers */}
        <div className="flex items-end mb-2" style={{ minWidth: 620 }}>
          <div className="w-52 shrink-0" />
          {GRADE_BUCKETS.map((b) => (
            <div key={b.label} className="flex-1 text-center" style={{ minWidth: 46 }}>
              <p className={`text-[11px] font-bold ${b.isFail ? 'text-red-500' : 'text-blue-600'}`}>{b.label}</p>
              <p className="text-[9px] text-gray-400 leading-tight">{b.min}–{b.max}</p>
            </div>
          ))}
          <div className="w-14 text-right shrink-0 pr-1">
            <p className="text-[9px] text-gray-400 font-medium">Lulus</p>
          </div>
        </div>

        {/* Rows */}
        {data.map(({ course, counts, passRate }) => {
          const semCls = course.semesterNum === 1 ? 'text-blue-500'
                        : course.semesterNum === 2 ? 'text-teal-500' : 'text-orange-500';
          return (
            <div key={course.code} className="flex items-center mb-1.5" style={{ minWidth: 620 }}>
              <div className="w-52 shrink-0 pr-3">
                <p className="text-xs text-gray-700 font-medium truncate leading-tight">{course.name}</p>
                <p className={`text-[10px] font-medium ${semCls}`}>{course.code} · S{course.semesterNum}</p>
              </div>
              {counts.map((count, j) => {
                const norm = count === 0 ? 0 : Math.max(0.08, (count / maxCount) * 0.92);
                const isFail = GRADE_BUCKETS[j].isFail;
                return (
                  <div key={j} className="flex-1 px-0.5" style={{ minWidth: 46 }}>
                    <div
                      title={`${course.name} · ${GRADE_BUCKETS[j].label}: ${count} mhs`}
                      className="h-9 rounded-lg flex items-center justify-center text-[10px] font-semibold cursor-default transition-all hover:scale-105 hover:shadow-md"
                      style={{
                        background: count === 0
                          ? '#f8fafc'
                          : isFail
                          ? `rgba(239,68,68,${norm})`
                          : `rgba(37,99,235,${norm})`,
                        color: count === 0 ? '#e2e8f0' : norm > 0.5 ? '#fff' : '#374151',
                      }}
                    >
                      {count > 0 ? count : ''}
                    </div>
                  </div>
                );
              })}
              <div className="w-14 text-right pl-2 shrink-0">
                <span className={`text-xs font-bold ${
                  passRate >= 75 ? 'text-emerald-600' : passRate >= 60 ? 'text-yellow-500' : 'text-red-500'
                }`}>{passRate}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Multi-select combobox dengan chip ber-× ─────────────────────────────────
function MultiSelectChip<T extends string | number>({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  single = false,
}: {
  options: { value: T; label: string }[];
  value: T[];
  onChange: (v: T[]) => void;
  placeholder?: string;
  single?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (v: T) => {
    if (single) { onChange([v]); setOpen(false); }
    else onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    setQuery('');
  };

  const remove = (v: T, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((x) => x !== v));
  };

  const selectedOpts = value.map((v) => options.find((o) => o.value === v)).filter(Boolean) as typeof options;
  const filtered = query ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : options;

  return (
    <div ref={ref} className="relative">
      {/* Trigger — input-like container */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => e.key === 'Enter' && setOpen((v) => !v)}
        className="flex flex-wrap items-center gap-1.5 min-w-[160px] px-2 py-1.5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
      >
        {selectedOpts.length > 0 ? selectedOpts.map((opt) => (
          <span key={String(opt.value)}
            className="flex items-center gap-0.5 px-2 py-0.5 bg-primary text-white rounded-lg text-[11px] font-medium leading-tight">
            {opt.label}
            {!single && (
              <button type="button" onClick={(e) => remove(opt.value, e)}
                className="opacity-70 hover:opacity-100 ml-0.5">
                <X size={10} />
              </button>
            )}
          </span>
        )) : (
          <span className="text-xs text-gray-400 px-0.5">{placeholder}</span>
        )}
        <ChevronDown
          size={11}
          className={`ml-auto text-gray-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-[100] bg-white border border-gray-200 rounded-xl shadow-xl min-w-[180px] overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                autoFocus
                placeholder="Cari..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
              />
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto py-1">
            {filtered.length > 0 ? filtered.map((opt) => {
              const isSelected = value.includes(opt.value);
              return (
                <button key={String(opt.value)} type="button" onClick={() => toggle(opt.value)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-gray-50 transition-colors
                    ${isSelected ? 'text-primary font-semibold bg-blue-50/40' : 'text-gray-700'}`}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <span className="ml-2 w-3.5 h-3.5 rounded-full bg-primary text-white text-[9px] flex items-center justify-center font-bold shrink-0">✓</span>
                  )}
                </button>
              );
            }) : (
              <p className="text-xs text-gray-400 italic px-3 py-2 text-center">Tidak ditemukan.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Custom Tooltip for BarChart ──────────────────────────────────────────────
function CplTooltip({ active, payload }: { active?: boolean; payload?: { payload: CplAggStat }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 max-w-xs text-xs">
      <p className="font-bold text-gray-800 mb-1">{d.code}</p>
      <p className="text-gray-500 mb-2 leading-tight">{d.description}</p>
      <p className={`font-bold ${pctColor(d.pct).text}`}>Rata-rata capaian: {d.pct}%</p>
      <p className="text-gray-400 mt-0.5">{d.met}/{d.total} mhs terpenuhi (≥60%)</p>
    </div>
  );
}

// ─── Expandable CPL Row ───────────────────────────────────────────────────────
function CplRow({
  stat, passingStudents, failingStudents, noDataStudents, expanded, onToggle,
}: {
  stat: CplAggStat;
  passingStudents: StudentCplResult[];
  failingStudents: StudentCplResult[];
  noDataStudents: StudentCplResult[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const c = pctColor(stat.pct);
  const cpl = CPL_LIST.find((x) => x.code === stat.code)!;
  const relatedCourses = (CPL_COURSE_MAP[cpl.code] ?? [])
    .map((code) => COURSES.find((c) => c.code === code))
    .filter(Boolean) as (typeof COURSES)[number][];

  return (
    <div className="border-b border-gray-50 last:border-0">
      <button
        className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors group"
        onClick={onToggle}
      >
        {/* Top row: code + category + expand */}
        <div className="flex items-start gap-3 mb-2">
          <span className="shrink-0 text-xs font-bold text-primary mt-0.5">{cpl.code}</span>
          <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-0.5 ${CATEGORY_COLOR[cpl.category].chip}`}>
            {cpl.category}
          </span>
          <span className="flex-1 text-sm text-gray-700 leading-snug">{cpl.description}</span>
          <span className="shrink-0 text-gray-400 group-hover:text-gray-600 mt-0.5">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </div>
        {/* Progress bar + stats */}
        <div className="flex items-center gap-3 pl-16">
          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${stat.total === 0 ? 0 : stat.pct}%`, backgroundColor: c.bar }}
            />
          </div>
          <span className={`text-sm font-bold w-10 text-right ${c.text}`}>
            {stat.total === 0 ? '–' : `${stat.pct}%`}
          </span>
          <span className="text-xs text-gray-400 w-28 text-right">
            {stat.total === 0 ? 'Belum ada data' : `${stat.met}/${stat.total} mhs terpenuhi`}
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="mx-5 mb-4 space-y-3">

          {/* ── Mata Kuliah Terkait ─────────────────────────────────── */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <BookOpen size={11} /> Mata Kuliah Terkait {cpl.code}
            </p>
            {relatedCourses.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {relatedCourses.map((course) => (
                  <span
                    key={course.code}
                    title={course.name}
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-medium cursor-default
                      ${course.semesterNum === 1 ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        course.semesterNum === 2 ? 'bg-teal-50 text-teal-700 border-teal-100' :
                        'bg-orange-50 text-orange-700 border-orange-100'}`}
                  >
                    {course.code} · {course.name}
                    <span className="opacity-40 ml-1">S{course.semesterNum}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Belum ada mata kuliah di semester 1–3.</p>
            )}
          </div>

          {/* ── Student Breakdown ───────────────────────────────────── */}
          {stat.total === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs text-gray-400 italic">Belum ada data mahasiswa untuk semester ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

              {/* Lulus */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                <p className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Lulus — {passingStudents.length} mahasiswa
                </p>
                {passingStudents.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {passingStudents.map((r) => (
                      <span key={r.student.nim} className="text-[10px] bg-white border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {r.student.name}
                        <span className="text-emerald-400 ml-1">({r.student.nim})</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-emerald-500 italic">Tidak ada mahasiswa yang lulus.</p>
                )}
              </div>

              {/* Belum Lulus */}
              <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-red-500" />
                  Belum Lulus — {failingStudents.length} mahasiswa
                </p>
                {failingStudents.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {failingStudents.map((r) => (
                      <span key={r.student.nim} className="text-[10px] bg-white border border-red-200 text-red-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {r.student.name}
                        <span className="text-red-400 ml-1">({r.student.nim})</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-red-400 italic">Semua mahasiswa sudah lulus.</p>
                )}
              </div>
            </div>
          )}

          {/* No data note */}
          {noDataStudents.length > 0 && (
            <p className="text-[10px] text-gray-400 italic px-1">
              {noDataStudents.length} mahasiswa belum dapat diukur untuk {cpl.code} — belum ada MK terkait di semester yang telah ditempuh.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Data Capaian Mahasiswa CPL ──────────────────────────────────────────────
const PAGE_SIZE_STUDENT = 10;

function StudentPerspectiveSection({ results }: { results: StudentCplResult[] }) {
  const [query, setQuery]             = useState('');
  const [angkatan, setAngkatan]       = useState<2024 | 2025 | 'all'>('all');
  const [page, setPage]               = useState(0);
  const [expandedNim, setExpandedNim] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = results;
    if (angkatan !== 'all') list = list.filter((r) => r.student.angkatan === angkatan);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter(
      (r) => r.student.name.toLowerCase().includes(q) || r.student.nim.includes(q),
    );
    return list;
  }, [results, angkatan, query]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE_STUDENT);
  const paginated  = filtered.slice(page * PAGE_SIZE_STUDENT, (page + 1) * PAGE_SIZE_STUDENT);

  const resetNav = () => { setPage(0); setExpandedNim(null); };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex items-center gap-3">
        <User size={18} className="text-primary shrink-0" />
        <div className="flex-1">
          <h2 className="text-base font-bold text-gray-800">Data Capaian Mahasiswa CPL</h2>
          <p className="text-xs text-gray-400">
            {filtered.length} mahasiswa ditampilkan · klik baris untuk detail CPL
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60 flex flex-wrap items-center gap-3">
        {/* Angkatan tabs */}
        <div className="flex gap-1 bg-gray-200/60 p-1 rounded-xl shrink-0">
          {(['all', 2024, 2025] as const).map((a) => (
            <button
              key={a}
              onClick={() => { setAngkatan(a); resetNav(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${angkatan === a ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {a === 'all' ? 'Semua' : `Angk. ${a}`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama atau NIM..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); resetNav(); }}
            className="w-full pl-8 pr-4 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 bg-white"
          />
        </div>
      </div>

      {/* List */}
      <div>
        {paginated.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Mahasiswa tidak ditemukan.</div>
        ) : (
          paginated.map((result) => {
            const metPct = result.totalWithData > 0
              ? Math.round((result.metCount / CPL_LIST.length) * 100)
              : null;
            const color = metPct !== null ? pctColor(metPct) : null;
            const initials = result.student.name.split(' ').slice(0, 2).map((w) => w[0]).join('');
            const isExpanded = expandedNim === result.student.nim;

            return (
              <div key={result.student.nim} className="border-b border-gray-50 last:border-0">
                {/* Row */}
                <button
                  className="w-full text-left px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                  onClick={() => setExpandedNim(isExpanded ? null : result.student.nim)}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 uppercase">
                      {initials}
                    </div>
                    {/* Name + NIM */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800 truncate">{result.student.name}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium shrink-0">
                          {result.student.angkatan}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{result.student.nim}</p>
                    </div>
                    {/* CPL progress */}
                    <div className="flex items-center gap-2 shrink-0">
                      {metPct !== null ? (
                        <>
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${metPct}%`, backgroundColor: color!.bar }}
                            />
                          </div>
                          <span className={`text-xs font-bold w-16 text-right ${color!.text}`}>
                            {result.metCount}/{CPL_LIST.length} CPL
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-300">Belum ada data</span>
                      )}
                    </div>
                    <span className="text-gray-400 group-hover:text-gray-600 shrink-0">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  </div>
                </button>

                {/* Expanded: CPL status dikelompokkan per status */}
                {isExpanded && (
                  <div className="mx-5 mb-4 space-y-3">
                    {(
                      [
                        {
                          key: 'met',
                          label: 'Terpenuhi',
                          wrapCls: 'bg-emerald-50 border-emerald-200',
                          labelCls: 'text-emerald-700',
                          cardCls: 'bg-white border-emerald-100',
                          dotCls: 'bg-emerald-100 text-emerald-600',
                          dotIcon: '✓',
                        },
                        {
                          key: 'not_met',
                          label: 'Belum Terpenuhi',
                          wrapCls: 'bg-red-50 border-red-200',
                          labelCls: 'text-red-600',
                          cardCls: 'bg-white border-red-100',
                          dotCls: 'bg-red-100 text-red-500',
                          dotIcon: '✗',
                        },
                        {
                          key: 'no_data',
                          label: 'Belum Dapat Diukur',
                          wrapCls: 'bg-gray-50 border-gray-200',
                          labelCls: 'text-gray-500',
                          cardCls: 'bg-white border-gray-100',
                          dotCls: 'bg-gray-100 text-gray-400',
                          dotIcon: '–',
                        },
                      ] as const
                    ).map(({ key, label, wrapCls, labelCls, cardCls, dotCls, dotIcon }) => {
                      const cpls = CPL_LIST.filter((cpl) => result.cplMap[cpl.code] === key);
                      if (cpls.length === 0) return null;

                      return (
                        <div key={key} className={`rounded-xl border p-3 ${wrapCls}`}>
                          {/* Group header */}
                          <p className={`text-xs font-semibold mb-2.5 flex items-center gap-1.5 ${labelCls}`}>
                            <span className={`flex w-4 h-4 rounded-full items-center justify-center text-[9px] font-bold ${dotCls}`}>
                              {dotIcon}
                            </span>
                            {label}
                            <span className="ml-auto font-bold">{cpls.length} CPL</span>
                          </p>

                          {/* CPL cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {cpls.map((cpl) => {
                              const relatedMk = (CPL_COURSE_MAP[cpl.code] ?? [])
                                .map((code) => COURSES.find((c) => c.code === code))
                                .filter(Boolean) as (typeof COURSES)[number][];

                              return (
                                <div key={cpl.code} className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${cardCls}`}>
                                  <span className={`flex w-5 h-5 rounded-full items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${dotCls}`}>
                                    {dotIcon}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[11px] font-bold text-gray-700">{cpl.code}</span>
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[cpl.category].chip}`}>
                                        {cpl.category}
                                      </span>
                                      {key !== 'no_data' && (
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-auto ${pctColor(result.cplPct[cpl.code]).bg} ${pctColor(result.cplPct[cpl.code]).text}`}>
                                          {result.cplPct[cpl.code]}%
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{cpl.shortName}</p>

                                    {/* MK terkait */}
                                    {relatedMk.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {relatedMk.map((c) => (
                                          <span key={c.code} title={c.name}
                                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium
                                              ${c.semesterNum === 1 ? 'bg-blue-100 text-blue-600' :
                                                c.semesterNum === 2 ? 'bg-teal-100 text-teal-600' :
                                                'bg-orange-100 text-orange-600'}`}
                                          >
                                            {c.code}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {/* Khusus no_data: tampilkan MK yg harus diambil */}
                                    {key === 'no_data' && relatedMk.length === 0 && (
                                      <p className="text-[9px] text-gray-400 italic mt-0.5">
                                        Belum ada MK di kurikulum sem 1–3
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/60">
          <p className="text-xs text-gray-400">
            {page * PAGE_SIZE_STUDENT + 1}–{Math.min((page + 1) * PAGE_SIZE_STUDENT, filtered.length)} dari {filtered.length} mahasiswa
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => { setPage((p) => p - 1); setExpandedNim(null); }}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-100 transition-colors font-medium"
            >
              ‹ Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i).map((i) => (
              <button
                key={i}
                onClick={() => { setPage(i); setExpandedNim(null); }}
                className={`w-7 h-7 text-xs rounded-lg border font-medium transition-colors
                  ${i === page ? 'bg-primary text-white border-primary' : 'border-gray-200 hover:bg-gray-100 text-gray-600'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={page >= totalPages - 1}
              onClick={() => { setPage((p) => p + 1); setExpandedNim(null); }}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-100 transition-colors font-medium"
            >
              Next ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pemetaan CPL → CPMK → MK Component ─────────────────────────────────────
function PemetaanSection() {
  const [expandedCpl, setExpandedCpl] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center gap-3">
        <Layers size={18} className="text-primary shrink-0" />
        <div className="flex-1">
          <h2 className="text-base font-bold text-gray-800">Pemetaan CPL → CPMK → MK</h2>
          <p className="text-xs text-gray-400">Traceability Matrix OBE · {CPL_LIST.length} CPL · {CPMK_LIST.length} CPMK</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-200 inline-block" /> Sem 1</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-teal-200 inline-block" /> Sem 2</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-200 inline-block" /> Sem 3</span>
        </div>
      </div>

      <div>
        {CPL_LIST.map((cpl) => {
          const cpmkCodes = CPL_CPMK_MAP[cpl.code] ?? [];
          const cpmks = cpmkCodes.map((code) => CPMK_LIST.find((c) => c.code === code)).filter(Boolean) as typeof CPMK_LIST;
          const mkCount = (CPL_COURSE_MAP[cpl.code] ?? []).length;
          const isExpanded = expandedCpl === cpl.code;

          return (
            <div key={cpl.code} className="border-b border-gray-50 last:border-0">
              <button
                className="w-full text-left px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                onClick={() => setExpandedCpl(isExpanded ? null : cpl.code)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-primary w-12 shrink-0">{cpl.code}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${CATEGORY_COLOR[cpl.category].chip}`}>
                    {cpl.category}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 truncate">{cpl.shortName}</span>
                  <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-medium">
                      {cpmkCodes.length} CPMK
                    </span>
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                      {mkCount} MK
                    </span>
                  </div>
                  <span className="text-gray-400 group-hover:text-gray-600 shrink-0">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="mx-5 mb-4 space-y-2">
                  {cpmks.length === 0 ? (
                    <p className="text-xs text-gray-400 italic px-1 py-2">Belum ada CPMK untuk CPL ini.</p>
                  ) : (
                    cpmks.map((cpmk) => {
                      const course = cpmk.mkCode ? COURSES.find((c) => c.code === cpmk.mkCode) : undefined;
                      return (
                        <div key={cpmk.code} className="flex items-start gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                          <span className="text-[10px] font-bold text-violet-700 shrink-0 mt-0.5 bg-violet-50 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                            {cpmk.code}
                          </span>
                          {course ? (
                            <span
                              title={course.name}
                              className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 mt-0.5 whitespace-nowrap cursor-default
                                ${course.semesterNum === 1 ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                  course.semesterNum === 2 ? 'bg-teal-50 text-teal-700 border-teal-100' :
                                  'bg-orange-50 text-orange-700 border-orange-100'}`}
                            >
                              {course.code} <span className="opacity-50">S{course.semesterNum}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 mt-0.5 bg-gray-100 text-gray-400 border-gray-200 italic">
                              Belum dipetakan
                            </span>
                          )}
                          <p className="text-xs text-gray-600 leading-relaxed">{cpmk.description}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useUser();

  const [selectedSemId, setSelectedSemId] = useState(ACADEMIC_SEMESTERS[2].id);
  const [selectedAngkatan, setSelectedAngkatan] = useState<(2024 | 2025)[]>([]);
  const [expandedCpl, setExpandedCpl] = useState<string | null>(null);
  const [heatmapPage, setHeatmapPage] = useState(0);
  const PAGE_SIZE = 15;

  const filteredStudents = useMemo(
    () => selectedAngkatan.length === 0
      ? STUDENTS
      : STUDENTS.filter((s) => selectedAngkatan.includes(s.angkatan)),
    [selectedAngkatan],
  );

  const studentResults = useMemo(
    () => computeStudentCplResults(filteredStudents, selectedSemId),
    [filteredStudents, selectedSemId],
  );

  // Semua mahasiswa — untuk section "Data Capaian Mahasiswa CPL" yang punya filter sendiri
  const allStudentResults = useMemo(
    () => computeStudentCplResults(STUDENTS, selectedSemId),
    [selectedSemId],
  );

  const cplStats = useMemo(() => computeCplStats(studentResults), [studentResults]);

  // IPK & academic stats untuk semua mahasiswa (ignore angkatan filter di sini)
  const studentAcademicData = useMemo(() =>
    STUDENTS.map((student) => {
      const available = getAvailableCourses(student.angkatan, selectedSemId);
      if (!available.length) return null;
      const gpas = available.map((code) => gradeToGpa(GRADES[`${student.nim}-${code}`] ?? 0));
      const ipk  = gpas.reduce((a, b) => a + b, 0) / gpas.length;
      const passedCourses = available.filter((code) => (GRADES[`${student.nim}-${code}`] ?? 0) >= 65).length;
      return { student, ipk: Math.round(ipk * 100) / 100, passedCourses, totalCourses: available.length };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.ipk - a.ipk),
    [selectedSemId],
  );

  // Computed IPK rata-rata sesuai filter angkatan
  const avgIpk = useMemo(() => {
    const f = studentAcademicData.filter(
      (d) => selectedAngkatan.length === 0 || selectedAngkatan.includes(d.student.angkatan),
    );
    return f.length ? (f.reduce((s, d) => s + d.ipk, 0) / f.length).toFixed(2) : '–';
  }, [studentAcademicData, selectedAngkatan]);

  // Distribusi IPK per predikat
  const ipkBuckets = useMemo(() => {
    const f = studentAcademicData.filter(
      (d) => selectedAngkatan.length === 0 || selectedAngkatan.includes(d.student.angkatan),
    );
    const total = f.length || 1;
    const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;
    const top    = f.filter((d) => d.ipk >= 3.5).length;
    const good   = f.filter((d) => d.ipk >= 2.75 && d.ipk < 3.5).length;
    const pass   = f.filter((d) => d.ipk >= 2.0  && d.ipk < 2.75).length;
    const risk   = f.filter((d) => d.ipk < 2.0).length;
    return { top, good, pass, risk, pct, total };
  }, [studentAcademicData, selectedAngkatan]);

  // Ranking data untuk TopCards
  const topCplMet    = useMemo(() =>
    [...allStudentResults].filter((r) => r.totalWithData > 0).sort((a, b) => b.metCount - a.metCount).slice(0, 6),
    [allStudentResults],
  );
  const bottomCplMet = useMemo(() =>
    [...allStudentResults].filter((r) => r.totalWithData > 0).sort((a, b) => a.metCount - b.metCount).slice(0, 6),
    [allStudentResults],
  );
  const topIpk    = useMemo(() => studentAcademicData.slice(0, 6), [studentAcademicData]);
  const bottomIpk = useMemo(() => [...studentAcademicData].reverse().slice(0, 6), [studentAcademicData]);

  // Summary stats
  const totalStudents = filteredStudents.length;
  const studentsWithAnyData = studentResults.filter((r) => r.totalWithData > 0).length;
  const studentsAllMet = studentResults.filter((r) => r.totalWithData > 0 && r.metCount === r.totalWithData).length;
  const studentsAtRisk = studentResults.filter((r) => r.totalWithData > 0 && r.metCount < r.totalWithData * 0.5).length;
  const avgCplPct = useMemo(() => {
    const valid = cplStats.filter((s) => s.total > 0);
    return valid.length ? Math.round(valid.reduce((s, c) => s + c.pct, 0) / valid.length) : 0;
  }, [cplStats]);
  const lowestCpl = useMemo(() => [...cplStats].filter((s) => s.total > 0).sort((a, b) => a.pct - b.pct)[0], [cplStats]);

  // Bar chart data
  const barData = cplStats.map((s) => ({
    ...s,
    label: s.code,
    fill: pctColor(s.pct).bar,
  }));

  // Radar chart data — average pct per category
  const radarData = useMemo(() => {
    const groups: Record<string, number[]> = { SIKAP: [], PENGETAHUAN: [], KETERAMPILAN: [] };
    for (const s of cplStats) {
      if (s.total > 0) {
        const cat = CPL_LIST.find((c) => c.code === s.code)!.category;
        groups[cat].push(s.pct);
      }
    }
    return Object.entries(groups).map(([cat, vals]) => ({
      category: cat,
      pct: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0,
    }));
  }, [cplStats]);

  // Trend line data (across semesters for filtered angkatan)
  const trendData = useMemo(() =>
    ACADEMIC_SEMESTERS.map((sem) => {
      const res = computeStudentCplResults(filteredStudents, sem.id);
      const stats = computeCplStats(res);
      const valid = stats.filter((s) => s.total > 0);
      const avg = valid.length ? Math.round(valid.reduce((s, c) => s + c.pct, 0) / valid.length) : 0;
      const allMet = res.filter((r) => r.totalWithData > 0 && r.metCount === r.totalWithData).length;
      return { label: sem.shortLabel, pct: avg, allMet };
    }),
    [filteredStudents],
  );

  const heatmapStudents = studentResults.slice(heatmapPage * PAGE_SIZE, (heatmapPage + 1) * PAGE_SIZE);
  const totalHeatmapPages = Math.ceil(studentResults.length / PAGE_SIZE);

  return (
    <div className="space-y-6 pb-4">

      {/* ── Program Header ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-primary to-blue-700 text-white p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap size={20} className="opacity-80" />
              <span className="text-sm font-medium opacity-80">Program Studi</span>
            </div>
            <h1 className="text-xl font-bold leading-tight">Informatika</h1>
            <p className="text-sm opacity-75 mt-0.5">Universitas Widyatama</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-70">Selamat datang,</p>
            <p className="text-base font-semibold">{user?.name || 'Admin Jurusan'}</p>
            <p className="text-xs opacity-60 mt-0.5">Dashboard OBE SYSTAMA</p>
          </div>
        </div>
      </div>

      {/* ── Row 1: Student Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

        {/* Total Mahasiswa */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl shrink-0">
            <Users size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 leading-tight">Total Mahasiswa</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{STUDENTS.length}</p>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">
              {STUDENTS.filter((s) => s.angkatan === 2024).length} angk. 2024 ·{' '}
              {STUDENTS.filter((s) => s.angkatan === 2025).length} angk. 2025
            </p>
          </div>
        </div>

        {/* Pemetaan IPK — 4 tier */}
        {([
          {
            label: 'IPK ≥ 3.50',
            sub: 'Cumlaude',
            value: ipkBuckets.top,
            dot: 'bg-amber-400',
            bar: 'bg-amber-400',
            text: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: 'IPK 2.75 – 3.49',
            sub: 'Sangat Memuaskan',
            value: ipkBuckets.good,
            dot: 'bg-emerald-500',
            bar: 'bg-emerald-500',
            text: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'IPK 2.00 – 2.74',
            sub: 'Memuaskan',
            value: ipkBuckets.pass,
            dot: 'bg-blue-400',
            bar: 'bg-blue-400',
            text: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'IPK < 2.00',
            sub: 'Perlu Perhatian',
            value: ipkBuckets.risk,
            dot: 'bg-red-400',
            bar: 'bg-red-400',
            text: 'text-red-500',
            bg: 'bg-red-50',
          },
        ] as const).map((tier) => (
          <div key={tier.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between gap-3">
            {/* Header */}
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${tier.dot}`} />
              <div>
                <p className="text-xs font-semibold text-gray-700 leading-tight">{tier.label}</p>
                <p className={`text-[10px] font-medium ${tier.text}`}>{tier.sub}</p>
              </div>
            </div>
            {/* Value + pct */}
            <div>
              <div className="flex items-end justify-between mb-1.5">
                <p className="text-3xl font-bold text-gray-900 leading-none">{tier.value}</p>
                <p className={`text-sm font-semibold ${tier.text}`}>
                  {ipkBuckets.pct(tier.value)}%
                </p>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${tier.bar}`}
                  style={{ width: `${ipkBuckets.pct(tier.value)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 2: OBE Stats ────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Komponen OBE</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total CPL', value: OBE_STATS.cpl, icon: <Target size={18} className="text-blue-600" />, bg: 'bg-blue-50', sub: 'Capaian Pembelajaran Lulusan' },
            { label: 'Total CPMK', value: OBE_STATS.cpmk, icon: <BookOpen size={18} className="text-violet-600" />, bg: 'bg-violet-50', sub: 'Capaian Per Mata Kuliah' },
            { label: 'Total Sub CPMK', value: OBE_STATS.subCpmk, icon: <Layers size={18} className="text-teal-600" />, bg: 'bg-teal-50', sub: 'Sub-capaian dari CPMK' },
            { label: 'Total Assessment', value: OBE_STATS.assessment, icon: <ClipboardCheck size={18} className="text-orange-500" />, bg: 'bg-orange-50', sub: 'Instrumen penilaian OBE' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-3">
              <div className={`p-2.5 ${s.bg} rounded-xl shrink-0`}>{s.icon}</div>
              <div>
                <p className="text-xs text-gray-500 leading-tight">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{s.value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top Lists ──────────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Ranking Mahasiswa</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TopCard
            title="Top CPL Terpenuhi"
            icon={<CheckCircle2 size={15} className="text-emerald-600" />}
            colValue="CPL Terpenuhi"
            rows={topCplMet.map((r) => ({
              name: r.student.name,
              nim:  r.student.nim,
              angkatan: r.student.angkatan,
              value: `${r.metCount} / ${CPL_LIST.length}`,
              valueCls: 'text-emerald-600',
            }))}
          />
          <TopCard
            title="IPK Terbaik"
            icon={<TrendingUp size={15} className="text-blue-600" />}
            colValue="IPK"
            rows={topIpk.map((r) => ({
              name: r.student.name,
              nim:  r.student.nim,
              angkatan: r.student.angkatan,
              value: r.ipk.toFixed(2),
              valueCls: 'text-blue-600',
            }))}
          />
          <TopCard
            title="CPL Paling Sedikit Terpenuhi"
            icon={<AlertTriangle size={15} className="text-red-500" />}
            colValue="CPL Terpenuhi"
            rows={bottomCplMet.map((r) => ({
              name: r.student.name,
              nim:  r.student.nim,
              angkatan: r.student.angkatan,
              value: `${r.metCount} / ${CPL_LIST.length}`,
              valueCls: 'text-red-500',
            }))}
          />
          <TopCard
            title="IPK Terkecil"
            icon={<AlertTriangle size={15} className="text-orange-500" />}
            colValue="IPK"
            rows={bottomIpk.map((r) => ({
              name: r.student.name,
              nim:  r.student.nim,
              angkatan: r.student.angkatan,
              value: r.ipk.toFixed(2),
              valueCls: 'text-orange-500',
            }))}
          />
        </div>
      </div>

      {/* ══ CPL ACHIEVEMENT SECTION ══════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Filter Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Target size={18} className="text-primary shrink-0" />
              <div>
                <h2 className="text-base font-bold text-gray-800">Pencapaian CPL Mahasiswa</h2>
                <p className="text-xs text-gray-400">Data simulasi · Filter kumulatif per semester</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400 font-medium">Semester</span>
                <MultiSelectChip
                  options={ACADEMIC_SEMESTERS.map((s) => ({ value: s.id, label: s.shortLabel }))}
                  value={[selectedSemId]}
                  onChange={(v) => { if (v.length > 0) setSelectedSemId(v[v.length - 1]); }}
                  single
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400 font-medium">Angkatan</span>
                <MultiSelectChip
                  options={[
                    { value: 2024 as const, label: 'Angk. 2024' },
                    { value: 2025 as const, label: 'Angk. 2025' },
                  ]}
                  value={selectedAngkatan}
                  onChange={(v) => { setSelectedAngkatan(v); setHeatmapPage(0); }}
                  placeholder="Semua Angkatan"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100">
          {[
            { label: 'Mahasiswa (filter)', value: totalStudents, sub: `IPK rata-rata ${avgIpk}`, icon: <Users size={15} className="text-blue-600" />, bg: 'bg-blue-50' },
            { label: 'Memenuhi Semua CPL', value: studentsAllMet, sub: `${studentsWithAnyData > 0 ? Math.round((studentsAllMet / studentsWithAnyData) * 100) : 0}% dari yang ada data`, icon: <CheckCircle2 size={15} className="text-emerald-600" />, bg: 'bg-emerald-50' },
            { label: 'Rata-rata Pencapaian', value: `${avgCplPct}%`, sub: 'rata-rata semua CPL', icon: <TrendingUp size={15} className="text-purple-600" />, bg: 'bg-purple-50' },
            { label: 'Mahasiswa Berisiko', value: studentsAtRisk, sub: '< 50% CPL terpenuhi', icon: <AlertTriangle size={15} className="text-red-500" />, bg: 'bg-red-50' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} bg-opacity-60 p-4 flex items-start gap-3`}>
              <div className="p-2 bg-white rounded-lg shadow-sm mt-0.5 shrink-0">{s.icon}</div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">

          {/* Bar Chart — CPL Achievement % */}
          <div className="lg:col-span-2 p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Persentase Pencapaian per CPL</p>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 40, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} width={46} />
                <Tooltip content={<CplTooltip />} />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Right column: Radar + Trend */}
          <div className="flex flex-col divide-y divide-gray-100">
            {/* Radar — per kategori */}
            <div className="p-5 flex-1">
              <p className="text-sm font-semibold text-gray-700 mb-2">Rata-rata per Kategori</p>
              <ResponsiveContainer width="100%" height={170}>
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                  <Radar name="Pencapaian" dataKey="pct" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Pencapaian']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Line — trend across semesters */}
            <div className="p-5 flex-1">
              <p className="text-sm font-semibold text-gray-700 mb-2">Tren Pencapaian</p>
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={trendData} margin={{ left: 0, right: 10, top: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => `${v}%`} width={32} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Rata-rata CPL']} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="pct" name="Rata-rata CPL %" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="allMet" name="Mhs Semua CPL" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── CPL Rows dengan deskripsi lengkap ─────────────────────────── */}
        <div className="border-t border-gray-100">
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Detail Pencapaian CPL</p>
            <div className="flex items-center gap-3 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> ≥75%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> 50–74%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> &lt;50%</span>
            </div>
          </div>
          {cplStats.map((stat) => (
            <CplRow
              key={stat.code}
              stat={stat}
              passingStudents={studentResults.filter((r) => r.cplMap[stat.code] === 'met')}
              failingStudents={studentResults.filter((r) => r.cplMap[stat.code] === 'not_met')}
              noDataStudents={studentResults.filter((r) => r.cplMap[stat.code] === 'no_data')}
              expanded={expandedCpl === stat.code}
              onToggle={() => setExpandedCpl(expandedCpl === stat.code ? null : stat.code)}
            />
          ))}
        </div>
      </div>

      {/* ── Data Capaian Mahasiswa CPL ──────────────────────────────────────── */}
      <StudentPerspectiveSection results={allStudentResults} />

      {/* ── Pemetaan CPL → CPMK → MK ───────────────────────────────────────── */}
      <PemetaanSection />

      {/* ── Heatmap ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <div>
              <h2 className="text-base font-bold text-gray-800">Peta CPL per Mahasiswa</h2>
              <p className="text-xs text-gray-400">
                {studentResults.length} mhs ·
                <span className="text-emerald-500"> ✓ memenuhi</span> ·
                <span className="text-red-400"> ✗ belum</span> ·
                <span className="text-gray-300"> – belum ada data</span>
              </p>
            </div>
          </div>
          {totalHeatmapPages > 1 && (
            <div className="flex items-center gap-2">
              <button disabled={heatmapPage === 0} onClick={() => setHeatmapPage((p) => p - 1)}
                className="px-2 py-1 text-xs rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50">‹</button>
              <span className="text-xs text-gray-500">{heatmapPage + 1}/{totalHeatmapPages}</span>
              <button disabled={heatmapPage >= totalHeatmapPages - 1} onClick={() => setHeatmapPage((p) => p + 1)}
                className="px-2 py-1 text-xs rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50">›</button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-gray-500 font-semibold min-w-[180px]">Mahasiswa</th>
                <th className="text-center px-2 py-3 text-gray-400 font-medium w-16">Angk.</th>
                <th className="text-center px-2 py-3 text-gray-600 font-semibold w-24">Capaian</th>
                <th className="px-3 py-3 text-emerald-600 font-semibold min-w-[160px]">
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-[9px] font-bold">✓</span>
                    Terpenuhi
                  </span>
                </th>
                <th className="px-3 py-3 text-red-500 font-semibold min-w-[160px]">
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-[9px] font-bold">✗</span>
                    Belum Terpenuhi
                  </span>
                </th>
                <th className="px-3 py-3 text-gray-400 font-semibold min-w-[120px]">
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[9px]">–</span>
                    Belum Diambil
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {heatmapStudents.map((r) => {
                const metPct = r.totalWithData > 0
                  ? Math.round((r.metCount / CPL_LIST.length) * 100)
                  : null;
                const c = metPct !== null ? pctColor(metPct) : null;
                const metCpls    = CPL_LIST.filter((cpl) => r.cplMap[cpl.code] === 'met');
                const notMetCpls = CPL_LIST.filter((cpl) => r.cplMap[cpl.code] === 'not_met');
                const noDataCpls = CPL_LIST.filter((cpl) => r.cplMap[cpl.code] === 'no_data');
                return (
                  <tr key={r.student.nim} className="hover:bg-gray-50/60 transition-colors border-b border-gray-50 last:border-0">
                    {/* Nama & NIM */}
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-gray-800 text-[13px]">{r.student.name}</div>
                      <div className="text-gray-400 text-[11px]">{r.student.nim}</div>
                    </td>
                    {/* Angkatan */}
                    <td className="px-2 py-2 text-center text-gray-400 text-[11px]">{r.student.angkatan}</td>
                    {/* Capaian badge */}
                    <td className="px-2 py-2 text-center">
                      {metPct !== null ? (
                        <span className={`font-bold text-xs px-1.5 py-0.5 rounded-full ${c!.bg} ${c!.text}`}>
                          {r.metCount}/{CPL_LIST.length}
                        </span>
                      ) : (
                        <span className="text-gray-300">–</span>
                      )}
                    </td>
                    {/* ✓ Terpenuhi */}
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {metCpls.length === 0 ? (
                          <span className="text-[10px] text-gray-300 italic">–</span>
                        ) : metCpls.map((cpl) => (
                          <span key={cpl.code} title={`${cpl.shortName} · ${r.cplPct[cpl.code]}%`}
                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium cursor-default whitespace-nowrap">
                            {cpl.code.replace('CPL', 'C')}
                            <span className="opacity-60 ml-0.5">{r.cplPct[cpl.code]}%</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    {/* ✗ Belum Terpenuhi */}
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {notMetCpls.length === 0 ? (
                          <span className="text-[10px] text-gray-300 italic">–</span>
                        ) : notMetCpls.map((cpl) => (
                          <span key={cpl.code} title={`${cpl.shortName} · ${r.cplPct[cpl.code]}%`}
                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 font-medium cursor-default whitespace-nowrap">
                            {cpl.code.replace('CPL', 'C')}
                            <span className="opacity-60 ml-0.5">{r.cplPct[cpl.code]}%</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    {/* – Belum Diambil */}
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {noDataCpls.length === 0 ? (
                          <span className="text-[10px] text-gray-300 italic">–</span>
                        ) : noDataCpls.map((cpl) => (
                          <span key={cpl.code} title={cpl.shortName}
                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 border border-gray-200 font-medium cursor-default whitespace-nowrap">
                            {cpl.code.replace('CPL', 'C')}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Distribusi Nilai Mata Kuliah ──────────────────────────────────────── */}
      <GradeHeatmap semId={selectedSemId} />

    </div>
  );
}
