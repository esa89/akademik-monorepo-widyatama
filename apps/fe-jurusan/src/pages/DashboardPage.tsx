import { useState, useMemo, useRef, useEffect, type ReactNode } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis,
} from 'recharts';
import {
  Users, GraduationCap, AlertTriangle, CheckCircle2,
  TrendingUp, Target, BookOpen, Layers, ClipboardCheck,
  ChevronDown, ChevronRight, User, Search, X, SlidersHorizontal, RotateCcw,
  MinusCircle, HelpCircle,
} from 'lucide-react';
import { useUser } from '@widyatama/sso-react';
import { useQuery, useQueries } from '@tanstack/react-query';
import {
  cplService, cpmkService, subCpmkService, assessmentComponentService,
  academicClassService, cpmkCplMappingService, cpmkCourseMappingService,
  studentCpmkScoreService, courseService, courseCpmkWeightService,
} from '@/services/obe.service';
import type { CourseCpmkWeight } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { effectiveCourseCount } from '@/constants/scoring';

// ─── Types ────────────────────────────────────────────────────────────────────
type RealCpl    = { id: string; code: string; name: string; category: string };
type RealCpmk   = { id: string; code: string; name: string };
type RealStudent = { id: string; nim: string; name: string; entryYear: number };

type RealStudentResult = {
  student: RealStudent;
  angkatan: number;
  cplMap:    Record<string, 'met' | 'partial' | 'not_met' | 'no_data'>;
  cplAvgPct: Record<string, number>;
  cpmkScores: Record<string, number>; // cpmkId → curriculum-adjusted avg score
  cpmkCourseScores: Record<string, Record<string, number>>; // cpmkId → courseId → per-course score
  metCount:  number;
  totalWithData: number;
};

type RealCplStat = RealCpl & { pct: number; met: number; total: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pctColor(pct: number) {
  if (pct >= 75) return { bar: '#10b981', text: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (pct >= 50) return { bar: '#f59e0b', text: 'text-yellow-600', bg: 'bg-yellow-50' };
  return { bar: '#f87171', text: 'text-red-500', bg: 'bg-red-50' };
}

const CATEGORY_COLOR: Record<string, { chip: string; radar: string }> = {
  SIKAP:               { chip: 'bg-blue-100 text-blue-700',    radar: '#6366f1' },
  PENGETAHUAN:         { chip: 'bg-purple-100 text-purple-700', radar: '#8b5cf6' },
  KETERAMPILAN_UMUM:   { chip: 'bg-teal-100 text-teal-700',    radar: '#14b8a6' },
  KETERAMPILAN_KHUSUS: { chip: 'bg-orange-100 text-orange-700', radar: '#f59e0b' },
};

const CATEGORY_LABEL: Record<string, string> = {
  SIKAP:               'Sikap',
  PENGETAHUAN:         'Pengetahuan',
  KETERAMPILAN_UMUM:   'Keterampilan Umum',
  KETERAMPILAN_KHUSUS: 'Keterampilan Khusus',
};

const DEFAULT_THRESHOLDS: Record<string, number> = {
  SIKAP: 80,
  PENGETAHUAN: 70,
  KETERAMPILAN_UMUM: 75,
  KETERAMPILAN_KHUSUS: 75,
};


type CplStatus = 'met' | 'partial' | 'not_met' | 'no_data';

const STATUS_CONFIG: Record<CplStatus, { label: string; icon: typeof CheckCircle2; cls: string; bg: string }> = {
  met:     { label: 'Terpenuhi',        icon: CheckCircle2, cls: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  partial: { label: 'Sebagian Dinilai', icon: AlertTriangle, cls: 'text-amber-500',  bg: 'bg-amber-50 border-amber-200'    },
  not_met: { label: 'Belum Terpenuhi',  icon: MinusCircle,  cls: 'text-red-500',     bg: 'bg-red-50 border-red-200'        },
  no_data: { label: 'Belum Ada Nilai',  icon: HelpCircle,   cls: 'text-gray-400',    bg: 'bg-gray-50 border-gray-200'      },
};

function ExplanationStep({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">{step}</div>
      <div className="flex-1 pb-6 border-b border-gray-100 last:border-0 last:pb-0">
        <p className="text-sm font-bold text-gray-800 mb-1">{title}</p>
        <div className="text-xs text-gray-500 leading-relaxed space-y-1">{children}</div>
      </div>
    </div>
  );
}

// ─── TopCard ─────────────────────────────────────────────────────────────────
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
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] px-5 py-2 bg-gray-50/60 border-b border-gray-50">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Mahasiswa</p>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-16 text-center">Angk.</p>
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-24 text-right">{colValue}</p>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400 italic text-center py-6">Belum ada data</p>
      ) : rows.map((row, i) => (
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

// ─── Multi-select combobox ────────────────────────────────────────────────────
function MultiSelectChip<T extends string | number>({
  options, value, onChange, placeholder = 'Pilih...', single = false,
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
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(''); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (v: T) => {
    if (single) { onChange([v]); setOpen(false); }
    else onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    setQuery('');
  };
  const remove = (v: T, e: React.MouseEvent) => { e.stopPropagation(); onChange(value.filter((x) => x !== v)); };
  const selectedOpts = value.map((v) => options.find((o) => o.value === v)).filter(Boolean) as typeof options;
  const filtered = query ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : options;

  return (
    <div ref={ref} className="relative">
      <div role="button" tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => e.key === 'Enter' && setOpen((v) => !v)}
        className="flex flex-wrap items-center gap-1.5 min-w-[160px] px-2 py-1.5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all">
        {selectedOpts.length > 0 ? selectedOpts.map((opt) => (
          <span key={String(opt.value)}
            className="flex items-center gap-0.5 px-2 py-0.5 bg-primary text-white rounded-lg text-[11px] font-medium leading-tight">
            {opt.label}
            {!single && <button type="button" onClick={(e) => remove(opt.value, e)} className="opacity-70 hover:opacity-100 ml-0.5"><X size={10} /></button>}
          </span>
        )) : <span className="text-xs text-gray-400 px-0.5">{placeholder}</span>}
        <ChevronDown size={11} className={`ml-auto text-gray-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-[100] bg-white border border-gray-200 rounded-xl shadow-xl min-w-[180px] overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="text" autoFocus placeholder="Cari..." value={query} onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto py-1">
            {filtered.length > 0 ? filtered.map((opt) => {
              const isSel = value.includes(opt.value);
              return (
                <button key={String(opt.value)} type="button" onClick={() => toggle(opt.value)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-gray-50 ${isSel ? 'text-primary font-semibold bg-blue-50/40' : 'text-gray-700'}`}>
                  <span>{opt.label}</span>
                  {isSel && <span className="ml-2 w-3.5 h-3.5 rounded-full bg-primary text-white text-[9px] flex items-center justify-center font-bold shrink-0">✓</span>}
                </button>
              );
            }) : <p className="text-xs text-gray-400 italic px-3 py-2 text-center">Tidak ditemukan.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CPL Bar Tooltip ──────────────────────────────────────────────────────────
function CplTooltip({ active, payload }: { active?: boolean; payload?: { payload: RealCplStat & { threshold: number } }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 max-w-xs text-xs">
      <p className="font-bold text-gray-800 mb-1">{d.code}</p>
      <p className="text-gray-500 mb-2 leading-tight line-clamp-3">{d.name}</p>
      <p className={`font-bold ${pctColor(d.pct).text}`}>Rata-rata capaian: {d.pct}%</p>
      <p className="text-gray-400 mt-0.5">{d.met}/{d.total} mhs terpenuhi (≥{d.threshold}%)</p>
    </div>
  );
}

// ─── CplRow ───────────────────────────────────────────────────────────────────
function CplRow({
  cpl, pct, met, total,
  passingStudents, partialStudents, failingStudents, noDataStudents,
  expanded, onToggle,
}: {
  cpl: RealCpl;
  pct: number; met: number; total: number;
  passingStudents:  RealStudentResult[];
  partialStudents:  RealStudentResult[];
  failingStudents:  RealStudentResult[];
  noDataStudents:   RealStudentResult[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const c = pctColor(pct);
  const catCls = CATEGORY_COLOR[cpl.category]?.chip ?? 'bg-gray-100 text-gray-600';

  return (
    <div className="border-b border-gray-50 last:border-0">
      <button className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors group" onClick={onToggle}>
        <div className="flex items-start gap-3 mb-2">
          <span className="shrink-0 text-xs font-bold text-primary mt-0.5">{cpl.code}</span>
          <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-0.5 ${catCls}`}>
            {cpl.category?.replace(/_/g, ' ')}
          </span>
          <span className="flex-1 text-sm text-gray-700 leading-snug">{cpl.name}</span>
          <span className="shrink-0 text-gray-400 group-hover:text-gray-600 mt-0.5">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </div>
        <div className="flex items-center gap-3 pl-16">
          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${total === 0 ? 0 : pct}%`, backgroundColor: c.bar }} />
          </div>
          <span className={`text-sm font-bold w-10 text-right ${c.text}`}>{total === 0 ? '–' : `${pct}%`}</span>
          <span className="text-xs text-gray-400 w-28 text-right">
            {total === 0 ? 'Belum ada data' : `${met}/${total} mhs terpenuhi`}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="mx-5 mb-4 space-y-2">
          {total === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs text-gray-400 italic">Belum ada data penilaian untuk CPL ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                <p className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600" /> Terpenuhi — {passingStudents.length} mhs
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {passingStudents.map((r) => (
                    <span key={r.student.nim} className="text-[10px] bg-white border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {r.student.name} <span className="text-emerald-400">({r.cplAvgPct[cpl.code]}%)</span>
                    </span>
                  ))}
                  {passingStudents.length === 0 && <span className="text-[10px] text-emerald-400 italic">–</span>}
                </div>
              </div>
              {partialStudents.length > 0 && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-amber-500" /> Sebagian Dinilai — {partialStudents.length} mhs
                  </p>
                  <p className="text-[10px] text-amber-600 mb-1.5 italic">CPMK yang dinilai sudah lulus, namun masih ada CPMK belum dinilai</p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {partialStudents.map((r) => (
                      <span key={r.student.nim} className="text-[10px] bg-white border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {r.student.name} <span className="text-amber-400">({r.cplAvgPct[cpl.code]}%)</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-red-500" /> Belum Terpenuhi — {failingStudents.length} mhs
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {failingStudents.map((r) => (
                    <span key={r.student.nim} className="text-[10px] bg-white border border-red-200 text-red-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {r.student.name} <span className="text-red-400">({r.cplAvgPct[cpl.code]}%)</span>
                    </span>
                  ))}
                  {failingStudents.length === 0 && <span className="text-[10px] text-red-400 italic">–</span>}
                </div>
              </div>
            </div>
          )}
          {noDataStudents.length > 0 && (
            <p className="text-[10px] text-gray-400 italic px-1">
              {noDataStudents.length} mahasiswa belum ada nilai sama sekali untuk {cpl.code}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Student Perspective Section ──────────────────────────────────────────────
const PAGE_SIZE_STUDENT = 10;

function StudentPerspectiveSection({
  results, cpls, cpmkList, cplToCpmkIds, cpmkIdToCourseIds, allCourseInfoMap,
}: {
  results: RealStudentResult[];
  cpls: RealCpl[];
  cpmkList: RealCpmk[];
  cplToCpmkIds: Map<string, string[]>;
  cpmkIdToCourseIds: Map<string, string[]>;
  allCourseInfoMap: Map<string, { code: string; name: string }>;
}) {
  const [query, setQuery]             = useState('');
  const [page, setPage]               = useState(0);
  const [expandedNim, setExpandedNim] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return results;
    return results.filter((r) => r.student.name.toLowerCase().includes(q) || r.student.nim.includes(q));
  }, [results, query]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE_STUDENT);
  const paginated  = filtered.slice(page * PAGE_SIZE_STUDENT, (page + 1) * PAGE_SIZE_STUDENT);
  const resetNav   = () => { setPage(0); setExpandedNim(null); };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center gap-3">
        <User size={18} className="text-primary shrink-0" />
        <div className="flex-1">
          <h2 className="text-base font-bold text-gray-800">Data Capaian Mahasiswa CPL</h2>
          <p className="text-xs text-gray-400">{filtered.length} mahasiswa · klik baris untuk detail CPL & CPMK</p>
        </div>
      </div>

      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60">
        <div className="relative max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" placeholder="Cari nama atau NIM..."
            value={query} onChange={(e) => { setQuery(e.target.value); resetNav(); }}
            className="w-full pl-8 pr-4 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white" />
        </div>
      </div>

      <div>
        {paginated.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Mahasiswa tidak ditemukan.</div>
        ) : paginated.map((result) => {
          const metPct = result.totalWithData > 0
            ? Math.round((result.metCount / cpls.length) * 100) : null;
          const color = metPct !== null ? pctColor(metPct) : null;
          const initials = result.student.name.split(' ').slice(0, 2).map((w) => w[0]).join('');
          const isExpanded = expandedNim === result.student.nim;

          return (
            <div key={result.student.nim} className="border-b border-gray-50 last:border-0">
              <button className="w-full text-left px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                onClick={() => setExpandedNim(isExpanded ? null : result.student.nim)}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 uppercase">{initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800 truncate">{result.student.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium shrink-0">{result.angkatan}</span>
                    </div>
                    <p className="text-xs text-gray-400">{result.student.nim}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {metPct !== null ? (
                      <>
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                          <div className="h-full rounded-full" style={{ width: `${metPct}%`, backgroundColor: color!.bar }} />
                        </div>
                        <span className={`text-xs font-bold w-16 text-right ${color!.text}`}>{result.metCount}/{cpls.length} CPL</span>
                      </>
                    ) : <span className="text-xs text-gray-300">Belum ada data</span>}
                  </div>
                  <span className="text-gray-400 group-hover:text-gray-600 shrink-0">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="mx-5 mb-4 space-y-2">
                  {([
                    { key: 'met',     label: 'Terpenuhi',            wrapCls: 'bg-emerald-50 border-emerald-200', labelCls: 'text-emerald-700', dotCls: 'bg-emerald-100 text-emerald-600', dotIcon: '✓' },
                    { key: 'partial', label: 'Sebagian Dinilai',     wrapCls: 'bg-amber-50 border-amber-200',     labelCls: 'text-amber-700',   dotCls: 'bg-amber-100 text-amber-600',    dotIcon: '◐' },
                    { key: 'not_met', label: 'Belum Terpenuhi',      wrapCls: 'bg-red-50 border-red-200',         labelCls: 'text-red-600',     dotCls: 'bg-red-100 text-red-500',        dotIcon: '✗' },
                    { key: 'no_data', label: 'Belum Dapat Diukur',   wrapCls: 'bg-gray-50 border-gray-200',       labelCls: 'text-gray-500',    dotCls: 'bg-gray-100 text-gray-400',      dotIcon: '–' },
                  ] as const).map(({ key, label, wrapCls, labelCls, dotCls, dotIcon }) => {
                    const groupCpls = cpls.filter((cpl) => result.cplMap[cpl.code] === key);
                    if (groupCpls.length === 0) return null;
                    return (
                      <div key={key} className={`rounded-xl border p-3 ${wrapCls}`}>
                        <p className={`text-xs font-semibold mb-2 flex items-center gap-1.5 ${labelCls}`}>
                          <span className={`flex w-4 h-4 rounded-full items-center justify-center text-[9px] font-bold ${dotCls}`}>{dotIcon}</span>
                          {label}
                          <span className="ml-auto font-bold">{groupCpls.length} CPL</span>
                        </p>
                        <div className="space-y-2">
                          {groupCpls.map((cpl) => {
                            const linkedCpmkIds = cplToCpmkIds.get(cpl.id) ?? [];
                            const linkedCpmks = linkedCpmkIds
                              .map((id) => cpmkList.find((c) => c.id === id))
                              .filter(Boolean) as RealCpmk[];
                            return (
                              <div key={cpl.code} className="rounded-lg border bg-white border-gray-100 p-2.5">
                                {/* CPL header */}
                                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                  <span className={`flex w-4 h-4 rounded-full items-center justify-center text-[9px] font-bold shrink-0 ${dotCls}`}>{dotIcon}</span>
                                  <span className="text-[11px] font-bold text-gray-800">{cpl.code}</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[cpl.category]?.chip ?? 'bg-gray-100 text-gray-600'}`}>
                                    {cpl.category?.replace(/_/g, ' ')}
                                  </span>
                                  {key !== 'no_data' && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-auto ${pctColor(result.cplAvgPct[cpl.code] ?? 0).bg} ${pctColor(result.cplAvgPct[cpl.code] ?? 0).text}`}>
                                      {result.cplAvgPct[cpl.code] ?? 0}%
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-500 leading-tight mb-2 pl-5 line-clamp-2">{cpl.name}</p>

                                {/* CPMK breakdown */}
                                {linkedCpmks.length > 0 && (
                                  <div className="pl-5 space-y-1.5">
                                    {linkedCpmks.map((cpmk) => {
                                      const score = result.cpmkScores[cpmk.id];
                                      const hasScore = score !== undefined;
                                      const sc = hasScore ? pctColor(Math.round(score)) : null;
                                      const courseIds = cpmkIdToCourseIds.get(cpmk.id) ?? [];
                                      return (
                                        <div key={cpmk.id} className="bg-gray-50 rounded-lg px-2 py-1.5 text-[10px]">
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-violet-600 shrink-0 font-mono">{cpmk.code}</span>
                                            <span className="flex-1 text-gray-500 truncate">{cpmk.name}</span>
                                            {hasScore ? (
                                              <span className={`font-bold shrink-0 ${sc!.text}`}>{Math.round(score)}%</span>
                                            ) : (
                                              <span className="text-gray-300 shrink-0">–</span>
                                            )}
                                          </div>
                                          {courseIds.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                              {courseIds.map((cid) => {
                                                const info = allCourseInfoMap.get(cid);
                                                const code = info?.code ?? cid.slice(0, 8);
                                                const name = info?.name ?? '';
                                                const cs = result.cpmkCourseScores[cpmk.id]?.[cid];
                                                const hasCs = cs !== undefined;
                                                const cc = hasCs ? pctColor(Math.round(cs)) : null;
                                                return hasCs ? (
                                                  <span key={cid} title={name ? `${name} · ${Math.round(cs)}` : String(Math.round(cs))} className={`cursor-default text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap border ${cc!.bg} ${cc!.text}`}>
                                                    {code} · {Math.round(cs)}
                                                  </span>
                                                ) : (
                                                  <span key={cid} title={name || code} className="cursor-default text-[9px] text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded-full whitespace-nowrap opacity-60">
                                                    {code}
                                                  </span>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
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
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/60">
          <p className="text-xs text-gray-400">
            {page * PAGE_SIZE_STUDENT + 1}–{Math.min((page + 1) * PAGE_SIZE_STUDENT, filtered.length)} dari {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button disabled={page === 0} onClick={() => { setPage((p) => p - 1); setExpandedNim(null); }}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-100 transition-colors font-medium">‹ Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i).map((i) => (
              <button key={i} onClick={() => { setPage(i); setExpandedNim(null); }}
                className={`w-7 h-7 text-xs rounded-lg border font-medium transition-colors ${i === page ? 'bg-primary text-white border-primary' : 'border-gray-200 hover:bg-gray-100 text-gray-600'}`}>{i + 1}</button>
            ))}
            <button disabled={page >= totalPages - 1} onClick={() => { setPage((p) => p + 1); setExpandedNim(null); }}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-100 transition-colors font-medium">Next ›</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useUser();
  const { selectedCurriculum } = useApp();
  const curriculumId = selectedCurriculum?.id;

  const [selectedAngkatan, setSelectedAngkatan]     = useState<number[]>([2024, 2025]);
  const [expandedCpl, setExpandedCpl]               = useState<string | null>(null);
  const [heatmapPage, setHeatmapPage]               = useState(0);
  const [thresholds, setThresholds]                 = useState<Record<string, number>>(DEFAULT_THRESHOLDS);
  const [showThresholds, setShowThresholds]         = useState(true);
  const [matrixSemester, setMatrixSemester]         = useState<number | null>(null);
  const [trackingExpanded, setTrackingExpanded]     = useState<string | null>(null);
  const [trackingSemester, setTrackingSemester]     = useState<number | null>(null);
  const PAGE_SIZE = 15;

  // ── API queries ───────────────────────────────────────────────────────────
  const { data: cpmkData }    = useQuery({ queryKey: ['count-cpmk'],    queryFn: () => cpmkService.getAll({ limit: 1 }) });
  const { data: subData }     = useQuery({ queryKey: ['count-subcpmk'], queryFn: () => subCpmkService.getAll({ limit: 1 }) });
  const { data: compData }    = useQuery({ queryKey: ['count-comp'],    queryFn: () => assessmentComponentService.getAll({ limit: 1 }) });
  const { data: classesData } = useQuery({ queryKey: ['count-classes'], queryFn: () => academicClassService.getAll({ limit: 100 }) });
  const { data: allCoursesData } = useQuery({ queryKey: ['courses-all'], queryFn: () => courseService.getAll({ limit: 100 }) });

  // Full CPL list with category field (CplCpmkMatrixCpl type lacks category)
  // Note: /api/cpl does not support curriculumId filter — fetch all and rely on cpmkCplMatrix for curriculum scoping
  const { data: cplListData } = useQuery({
    queryKey: ['cpl-list-full'],
    queryFn: () => cplService.getAll({ limit: 100 }),
  });

  const { data: cpmkCplMatrix } = useQuery({
    queryKey: ['cpmk-cpl-matrix-dashboard', curriculumId],
    queryFn:  () => cpmkCplMappingService.getMatrix({ curriculumId: curriculumId! }),
    enabled:  !!curriculumId,
  });

  const { data: cpmkMkMatrixData } = useQuery({
    queryKey: ['cpmk-mk-matrix-dashboard', curriculumId, selectedCurriculum?.year],
    queryFn: () => cpmkCourseMappingService.getMatrix({ curriculumId: curriculumId!, curriculumYear: selectedCurriculum?.year }),
    enabled: !!curriculumId,
    staleTime: 10 * 60 * 1000,
  });

  const realClasses   = classesData?.data ?? [];
  const realStudents  = realClasses.reduce((s, c) => s + (c.totalStudents ?? 0), 0);
  const activeClasses = realClasses.filter((c) => c.isActive).length;

  const classDetailResults = useQueries({
    queries: realClasses.map((cls) => ({
      queryKey: ['class-detail-dash', cls.id],
      queryFn:  () => academicClassService.getById(cls.id),
    })),
  });

  const classScoreResults = useQueries({
    queries: realClasses.map((cls) => ({
      queryKey: ['class-scores-dash', cls.id],
      queryFn:  () => studentCpmkScoreService.getByClass(cls.id),
    })),
  });

  // ── Derived CPL/CPMK data ─────────────────────────────────────────────────
  // Use full CPL list (has category) rather than matrix CPLs (no category)
  const realCpls    = useMemo(() =>
    ([...(cplListData?.data ?? [])] as RealCpl[]).sort((a, b) =>
      a.code.localeCompare(b.code, undefined, { numeric: true })
    ), [cplListData]);
  const realCpmks   = useMemo(() => cpmkCplMatrix?.data?.cpmks    ?? [], [cpmkCplMatrix]);
  const rawMappings = useMemo(() => cpmkCplMatrix?.data?.mappings ?? [], [cpmkCplMatrix]);

  const cplToCpmkIds = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const cpl of realCpls) {
      map.set(cpl.id, rawMappings.filter((m) => m.cplId === cpl.id).map((m) => m.cpmkId));
    }
    return map;
  }, [realCpls, rawMappings]);

  // cpmkId → courseIds[] from curriculum CPMK-course matrix
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

  const allCurriculumCourseIds = useMemo(() => {
    const ids = new Set<string>();
    for (const courseIds of cpmkIdToCourseIds.values()) courseIds.forEach((id) => ids.add(id));
    return [...ids];
  }, [cpmkIdToCourseIds]);

  const courseByIdResults = useQueries({
    queries: allCurriculumCourseIds.map((courseId) => ({
      queryKey: ['course-by-id-dash', courseId],
      queryFn: () => courseService.getById(courseId),
      staleTime: 30 * 60 * 1000,
    })),
  });

  // Moved before allStudentResults to avoid TDZ — allCourseInfoMap is needed inside that memo
  const uniqueCourses = useMemo(() => {
    const semesterOf = new Map<string, number>(
      (allCoursesData?.data ?? []).map((c) => [c.id, c.semester]),
    );
    const seen = new Set<string>();
    const courses: { id: string; code: string; name: string; semester: number }[] = [];
    for (const cls of realClasses) {
      if (!seen.has(cls.course.id)) {
        seen.add(cls.course.id);
        courses.push({ ...cls.course, semester: semesterOf.get(cls.course.id) ?? 0 });
      }
    }
    return courses.sort((a, b) => a.semester - b.semester || a.code.localeCompare(b.code));
  }, [realClasses, allCoursesData]);

  const allCourseInfoMap = useMemo(() => {
    const m = new Map<string, { code: string; name: string }>();
    courseByIdResults.forEach((q, i) => {
      const courseId = allCurriculumCourseIds[i];
      const course = q.data?.data;
      if (course) m.set(courseId, { code: course.code, name: course.name });
    });
    uniqueCourses.forEach((c) => { if (!m.has(c.id)) m.set(c.id, { code: c.code, name: c.name }); });
    return m;
  }, [courseByIdResults, allCurriculumCourseIds, uniqueCourses]);

  // Bobot penilaian per course (untuk weighted CPMK score — agar sesuai TrackingMahasiswaPage)
  const dashCourseWeightResults = useQueries({
    queries: allCurriculumCourseIds.map((courseId) => ({
      queryKey: ['course-weights-dash', courseId],
      queryFn: () => courseCpmkWeightService.getAll({ courseId }),
      staleTime: 30 * 60 * 1000,
    })),
  });

  // courseId → cpmkId → assessmentComponentId → weight
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

  // ── Compute per-student CPL achievement ──────────────────────────────────
  const allStudentResults = useMemo((): RealStudentResult[] => {
    if (realCpls.length === 0) return [];

    const studentMap = new Map<string, RealStudent>();
    for (const res of classDetailResults) {
      for (const s of res.data?.data?.students ?? []) {
        studentMap.set(s.student.id, s.student);
      }
    }
    if (studentMap.size === 0) return [];

    // studentId → cpmkId → courseId → assessmentComponentId → score
    // Use s.courseId (OBE course ID) to stay consistent with cpmkIdToCourseIds and weight map
    const scoresByStudent = new Map<string, Map<string, Map<string, Map<string, number>>>>();
    for (const res of classScoreResults) {
      for (const s of res.data?.data ?? []) {
        if (!scoresByStudent.has(s.studentId)) scoresByStudent.set(s.studentId, new Map());
        const sm = scoresByStudent.get(s.studentId)!;
        if (!sm.has(s.cpmkId)) sm.set(s.cpmkId, new Map());
        const cm = sm.get(s.cpmkId)!;
        if (!cm.has(s.courseId)) cm.set(s.courseId, new Map());
        cm.get(s.courseId)!.set(s.assessmentComponentId, s.score);
      }
    }

    return [...studentMap.values()].map((student) => {
      const cpmkScoreMap = scoresByStudent.get(student.id) ?? new Map<string, Map<string, Map<string, number>>>();
      const cpmkAvg = new Map<string, number>();
      const cpmkCourseScores: Record<string, Record<string, number>> = {};
      for (const [cpmkId, courseMap] of cpmkScoreMap) {
        const currCourseIds   = cpmkIdToCourseIds.get(cpmkId);
        const totalCurrCourses = currCourseIds
          ? effectiveCourseCount(currCourseIds, allCourseInfoMap)
          : courseMap.size;
        let sum = 0;
        cpmkCourseScores[cpmkId] = {};
        for (const [courseId, compMap] of courseMap) {
          // Apply component weights — same logic as TrackingMahasiswaPage cpmkCourseDetails
          const compWeights = dashCourseWeightMap.get(courseId)?.get(cpmkId);
          let weightedScore: number;
          if (compWeights && compWeights.size > 0) {
            let wSum = 0, wTotal = 0;
            for (const [compId, score] of compMap) {
              const w = compWeights.get(compId);
              if (w !== undefined) { wSum += score * w; wTotal += w; }
            }
            weightedScore = wTotal > 0
              ? wSum / wTotal
              : [...compMap.values()].reduce((a, b) => a + b, 0) / compMap.size;
          } else {
            const scores = [...compMap.values()];
            weightedScore = scores.reduce((a, b) => a + b, 0) / scores.length;
          }
          sum += weightedScore;
          cpmkCourseScores[cpmkId][courseId] = weightedScore;
        }
        cpmkAvg.set(cpmkId, sum / totalCurrCourses);
      }

      const cplMap:    Record<string, 'met' | 'partial' | 'not_met' | 'no_data'> = {};
      const cplAvgPct: Record<string, number> = {};
      let metCount = 0, totalWithData = 0;

      for (const cpl of realCpls) {
        const linked  = cplToCpmkIds.get(cpl.id) ?? [];
        const scored  = linked.filter((id) => cpmkAvg.has(id));

        if (scored.length === 0) {
          cplMap[cpl.code]    = 'no_data';
          cplAvgPct[cpl.code] = 0;
        } else {
          totalWithData++;
          // Divide by scored CPMKs only — penalising unscored courses already happens
          // at the CPMK level (sum / effectiveCourseCount), so we don't double-penalise
          // at the CPL level by including unscored CPMKs as 0.
          const avg = scored.reduce((s, id) => s + cpmkAvg.get(id)!, 0) / scored.length;
          cplAvgPct[cpl.code] = Math.round(avg);
          const threshold = thresholds[cpl.category] ?? 60;
          if (avg < threshold) {
            cplMap[cpl.code] = 'not_met';
          } else {
            // 'partial': threshold met but not all CPMKs have been scored yet
            cplMap[cpl.code] = scored.length < linked.length ? 'partial' : 'met';
            metCount++; // count both 'met' and 'partial' toward student's metCount
          }
        }
      }

      return { student, angkatan: student.entryYear ?? 0, cplMap, cplAvgPct, cpmkScores: Object.fromEntries(cpmkAvg), cpmkCourseScores, metCount, totalWithData };
    }).sort((a, b) => b.metCount - a.metCount);
  }, [realCpls, cplToCpmkIds, classDetailResults, classScoreResults, cpmkIdToCourseIds, allCourseInfoMap, dashCourseWeightMap, thresholds]);

  // ── Filter by angkatan (applied globally to all sections) ───────────────
  const filteredResults = useMemo(() =>
    selectedAngkatan.length === 0
      ? allStudentResults
      : allStudentResults.filter((r) => selectedAngkatan.includes(r.angkatan)),
  [allStudentResults, selectedAngkatan]);

  // ── CPL aggregate stats (uses filteredResults so angkatan filter affects charts) ──
  const cplStats = useMemo((): RealCplStat[] =>
    realCpls.map((cpl) => {
      const withData = filteredResults.filter((r) => r.cplMap[cpl.code] !== 'no_data');
      const met      = withData.filter((r) => r.cplMap[cpl.code] === 'met' || r.cplMap[cpl.code] === 'partial').length;
      const total    = withData.length;
      return { ...cpl, pct: total > 0 ? Math.round((met / total) * 100) : 0, met, total };
    }),
  [realCpls, filteredResults]);

  const angkatanOptions = [
    { value: 2024, label: 'Angk. 2024' },
    { value: 2025, label: 'Angk. 2025' },
  ];

  // ── Matrix data ────────────────────────────────────────────────────────────
  // courseId → all student IDs enrolled in any class of that course
  const courseStudentMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    classDetailResults.forEach((res, i) => {
      const courseId = realClasses[i]?.course?.id;
      if (!courseId) return;
      if (!map.has(courseId)) map.set(courseId, new Set());
      for (const { student } of res.data?.data?.students ?? []) {
        map.get(courseId)!.add(student.id);
      }
    });
    return map;
  }, [classDetailResults, realClasses]);

  // studentId → RealStudentResult for O(1) lookup (uses filteredResults so respects angkatan filter)
  const studentResultMap = useMemo(() => {
    const map = new Map<string, RealStudentResult>();
    for (const r of filteredResults) map.set(r.student.id, r);
    return map;
  }, [filteredResults]);

  // Available semesters from fetched course data (for the dropdown)
  const availableMatrixSemesters = useMemo(() => {
    const sems = new Set(uniqueCourses.map((c) => c.semester).filter((s) => s > 0));
    return [...sems].sort((a, b) => a - b);
  }, [uniqueCourses]);

  // Courses shown in the matrix (filtered by selected semester)
  const matrixCourses = useMemo(() =>
    matrixSemester === null
      ? uniqueCourses
      : uniqueCourses.filter((c) => c.semester === matrixSemester),
  [uniqueCourses, matrixSemester]);

  // How many filtered students are enrolled per course (denominator for each column)
  const filteredCourseCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const [courseId, studentIds] of courseStudentMap) {
      let n = 0;
      for (const sid of studentIds) if (studentResultMap.has(sid)) n++;
      map.set(courseId, n);
    }
    return map;
  }, [courseStudentMap, studentResultMap]);

  // (cplId, courseId) → count of filtered students in that course with cplMap[cpl.code] === 'met'
  const cplMkMatrix = useMemo(() => {
    const matrix = new Map<string, Map<string, number>>();
    for (const cpl of realCpls) {
      const row = new Map<string, number>();
      for (const course of uniqueCourses) {
        let count = 0;
        for (const sid of courseStudentMap.get(course.id) ?? new Set<string>()) {
          const r = studentResultMap.get(sid);
          if (r && r.cplMap[cpl.code] === 'met') count++;
        }
        row.set(course.id, count);
      }
      matrix.set(cpl.id, row);
    }
    return matrix;
  }, [realCpls, uniqueCourses, courseStudentMap, studentResultMap]);

  // courseId → Set<cpmkId> that have been scored in any class of that course
  const courseScoredCpmkIds = useMemo(() => {
    const map = new Map<string, Set<string>>();
    classScoreResults.forEach((res, i) => {
      const courseId = realClasses[i]?.course?.id;
      if (!courseId) return;
      if (!map.has(courseId)) map.set(courseId, new Set());
      for (const s of res.data?.data ?? []) map.get(courseId)!.add(s.cpmkId);
    });
    return map;
  }, [classScoreResults, realClasses]);

  // cpmkId → CPL codes it contributes to (for display)
  const cpmkToCplCodes = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const cpl of realCpls) {
      for (const cpmkId of (cplToCpmkIds.get(cpl.id) ?? [])) {
        if (!map.has(cpmkId)) map.set(cpmkId, []);
        map.get(cpmkId)!.push(cpl.code);
      }
    }
    return map;
  }, [realCpls, cplToCpmkIds]);

  // cpmkId → min threshold across its linked CPLs
  const cpmkThresholdMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const cpl of realCpls) {
      const t = thresholds[cpl.category] ?? 60;
      for (const cpmkId of (cplToCpmkIds.get(cpl.id) ?? [])) {
        map.set(cpmkId, Math.min(map.get(cpmkId) ?? 100, t));
      }
    }
    return map;
  }, [realCpls, cplToCpmkIds, thresholds]);

  // courseId → Map<cpmkId, { above: number; scored: number }>
  // Counts ONLY filtered students, per course per CPMK
  const courseCpmkPassStats = useMemo(() => {
    // courseId → cpmkId → studentId → scores[]
    const raw = new Map<string, Map<string, Map<string, number[]>>>();
    classScoreResults.forEach((res, i) => {
      const courseId = realClasses[i]?.course?.id;
      if (!courseId) return;
      for (const s of res.data?.data ?? []) {
        if (!studentResultMap.has(s.studentId)) continue; // only filtered students
        if (!raw.has(courseId)) raw.set(courseId, new Map());
        if (!raw.get(courseId)!.has(s.cpmkId)) raw.get(courseId)!.set(s.cpmkId, new Map());
        const sm = raw.get(courseId)!.get(s.cpmkId)!;
        if (!sm.has(s.studentId)) sm.set(s.studentId, []);
        sm.get(s.studentId)!.push(s.score);
      }
    });

    const result = new Map<string, Map<string, { above: number; scored: number }>>();
    for (const [courseId, cpmkMap] of raw) {
      result.set(courseId, new Map());
      for (const [cpmkId, studentMap] of cpmkMap) {
        const threshold = cpmkThresholdMap.get(cpmkId) ?? 60;
        let above = 0, scored = 0;
        for (const scores of studentMap.values()) {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          scored++;
          if (avg >= threshold) above++;
        }
        result.get(courseId)!.set(cpmkId, { above, scored });
      }
    }
    return result;
  }, [classScoreResults, realClasses, studentResultMap, cpmkThresholdMap]);

  // ── Unique active students (angkatan 2024 & 2025 only, counted from class details) ──
  const activeStudentCount = useMemo(() => {
    const ids = new Set<string>();
    for (const res of classDetailResults) {
      for (const { student } of res.data?.data?.students ?? []) {
        if (student.entryYear === 2024 || student.entryYear === 2025) ids.add(student.id);
      }
    }
    return ids.size;
  }, [classDetailResults]);

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalFiltered   = filteredResults.length;
  const studentsAllMet  = filteredResults.filter((r) => r.totalWithData > 0 && r.metCount === realCpls.length).length;
  const studentsAtRisk  = filteredResults.filter((r) => r.totalWithData > 0 && r.metCount < realCpls.length * 0.5).length;
  const avgCplPct = useMemo(() => {
    const valid = cplStats.filter((s) => s.total > 0);
    return valid.length ? Math.round(valid.reduce((s, c) => s + c.pct, 0) / valid.length) : 0;
  }, [cplStats]);

  // ── Chart data ────────────────────────────────────────────────────────────
  const barData = cplStats.map((s) => ({ ...s, label: s.code, fill: pctColor(s.pct).bar, threshold: thresholds[s.category] ?? 60 }));

  const radarData = useMemo(() => {
    const groups: Record<string, number[]> = {};
    for (const s of cplStats) {
      if (s.total === 0) continue;
      const cat = s.category?.startsWith('KETERAMPILAN') ? 'KETERAMPILAN' : (s.category ?? 'LAINNYA');
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s.pct);
    }
    return Object.entries(groups).map(([cat, vals]) => ({
      category: cat.replace(/_/g, ' '),
      pct: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }));
  }, [cplStats]);

  // ── TopCard data ──────────────────────────────────────────────────────────
  const realTopCplMet    = allStudentResults.filter((r) => r.metCount > 0).slice(0, 6);
  const realBottomCplMet = [...allStudentResults].sort((a, b) => a.metCount - b.metCount).filter((r) => r.totalWithData > 0).slice(0, 6);
  const rankingLoaded    = allStudentResults.length > 0;

  // ── Heatmap pagination ────────────────────────────────────────────────────
  const heatmapStudents    = filteredResults.slice(heatmapPage * PAGE_SIZE, (heatmapPage + 1) * PAGE_SIZE);
  const totalHeatmapPages  = Math.ceil(filteredResults.length / PAGE_SIZE);

  // ── OBE stat card values ──────────────────────────────────────────────────
  const realObeStats = {
    cpl:        cplListData?.meta?.total ?? '…',
    cpmk:       cpmkData?.meta?.total   ?? '…',
    subCpmk:    subData?.meta?.total    ?? '…',
    assessment: compData?.meta?.total   ?? '…',
  };

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

      {/* ── Stat cards (real data) ──────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Data Nyata</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl shrink-0"><Users size={18} className="text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500 leading-tight">Total Mahasiswa</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{activeStudentCount > 0 ? activeStudentCount : '…'}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">Angkatan 2024 & 2025 · unik</p>
            </div>
          </div>
          {[
            { label: 'Total CPL',       value: realObeStats.cpl,        icon: <Target size={18} className="text-indigo-600" />,   bg: 'bg-indigo-50',  sub: 'Capaian Pembelajaran Lulusan' },
            { label: 'Total CPMK',      value: realObeStats.cpmk,       icon: <BookOpen size={18} className="text-violet-600" />,  bg: 'bg-violet-50',  sub: 'Capaian Per Mata Kuliah' },
            { label: 'Total Sub CPMK',  value: realObeStats.subCpmk,    icon: <Layers size={18} className="text-teal-600" />,      bg: 'bg-teal-50',    sub: 'Sub-capaian dari CPMK' },
            { label: 'Komp. Penilaian', value: realObeStats.assessment,  icon: <ClipboardCheck size={18} className="text-orange-500" />, bg: 'bg-orange-50', sub: 'Instrumen penilaian OBE' },
            { label: 'Kelas Aktif',     value: activeClasses,            icon: <GraduationCap size={18} className="text-emerald-600" />, bg: 'bg-emerald-50', sub: `dari ${realClasses.length} total kelas` },
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

      {/* ── Ranking CPL ────────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Ranking CPL Mahasiswa
          {!rankingLoaded && <span className="font-normal normal-case text-gray-300 ml-1">— memuat…</span>}
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TopCard title="Top CPL Terpenuhi" icon={<CheckCircle2 size={15} className="text-emerald-600" />} colValue="CPL Terpenuhi"
            rows={realTopCplMet.map((r) => ({ name: r.student.name, nim: r.student.nim, angkatan: r.angkatan, value: `${r.metCount} / ${r.totalWithData > 0 ? realCpls.length : '?'}`, valueCls: 'text-emerald-600' }))} />
          <TopCard title="CPL Paling Sedikit Terpenuhi" icon={<AlertTriangle size={15} className="text-red-500" />} colValue="CPL Terpenuhi"
            rows={realBottomCplMet.map((r) => ({ name: r.student.name, nim: r.student.nim, angkatan: r.angkatan, value: `${r.metCount} / ${realCpls.length}`, valueCls: 'text-red-500' }))} />
        </div>
      </div>

      {/* ── Cara Kerja Sistem Penilaian ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-5">Cara Kerja Sistem Penilaian</h2>
        <div className="space-y-0">
          <ExplanationStep step={1} title="Hitung Nilai CPMK per Mata Kuliah">
            <p>Setiap mahasiswa dinilai per CPMK melalui komponen penilaian di tiap kelas. Nilai per mata kuliah dihitung dari rata-rata semua komponen penilaian CPMK tersebut dalam kelas itu.</p>
          </ExplanationStep>
          <ExplanationStep step={2} title="Rata-rata CPMK dibagi total mata kuliah di kurikulum">
            <p>
              Nilai CPMK mahasiswa = <strong>jumlah nilai di tiap mata kuliah yang diambil</strong> ÷ <strong>total mata kuliah di kurikulum yang menganut CPMK tersebut</strong>.
            </p>
            <p className="mt-1">
              Contoh: CPMK ada di 6 mata kuliah, mahasiswa baru mengambil 2 → skor = (nilai MK-1 + nilai MK-2) ÷ 6. Mata kuliah yang belum diambil dihitung 0.
            </p>
          </ExplanationStep>
          <ExplanationStep step={3} title="Rata-rata CPL dibagi total CPMK yang terhubung">
            <p>
              Nilai CPL mahasiswa = <strong>jumlah nilai semua CPMK yang terhubung ke CPL</strong> ÷ <strong>total CPMK yang terhubung</strong>.
            </p>
            <p className="mt-1">CPMK yang belum dinilai dihitung 0, bukan dilewati. Lalu dibandingkan dengan threshold per kategori:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
                <span key={key} className={`text-[10px] px-2 py-1 rounded-full font-semibold ${CATEGORY_COLOR[key]?.chip ?? 'bg-gray-100 text-gray-600'}`}>
                  {label}: ≥{thresholds[key]}%
                </span>
              ))}
            </div>
          </ExplanationStep>
          <ExplanationStep step={4} title="Tentukan Status CPL">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {(Object.entries(STATUS_CONFIG) as [CplStatus, typeof STATUS_CONFIG[CplStatus]][]).map(([key, cfg]) => (
                <div key={key} className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${cfg.bg}`}>
                  <cfg.icon size={14} className={`${cfg.cls} shrink-0 mt-0.5`} />
                  <div>
                    <p className={`text-[11px] font-bold ${cfg.cls}`}>{cfg.label}</p>
                    <p className="text-[10px] text-gray-500 leading-snug">
                      {key === 'met'     && 'Semua CPMK sudah dinilai dan nilai CPL ≥ threshold'}
                      {key === 'partial' && 'Nilai CPL (dari CPMK yang dinilai) ≥ threshold, tapi masih ada CPMK belum dinilai'}
                      {key === 'not_met' && 'Nilai CPL < threshold (termasuk efek 0 dari CPMK yang belum dinilai)'}
                      {key === 'no_data' && 'Belum ada satupun CPMK yang dinilai'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ExplanationStep>
        </div>
      </div>

      {/* ══ CPL ACHIEVEMENT ══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Header + filter */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Target size={18} className="text-primary shrink-0" />
              <div>
                <h2 className="text-base font-bold text-gray-800">Pencapaian CPL Mahasiswa</h2>
                <p className="text-xs text-gray-400">
                  Threshold: Sikap {thresholds.SIKAP}% · Pengetahuan {thresholds.PENGETAHUAN}% · KU {thresholds.KETERAMPILAN_UMUM}% · KK {thresholds.KETERAMPILAN_KHUSUS}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {angkatanOptions.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-400 font-medium">Angkatan</span>
                  <MultiSelectChip options={angkatanOptions} value={selectedAngkatan}
                    onChange={(v) => { setSelectedAngkatan(v); setHeatmapPage(0); }} placeholder="Semua Angkatan" />
                </div>
              )}
              <button
                onClick={() => setShowThresholds((p) => !p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${showThresholds ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}
              >
                <SlidersHorizontal size={13} />
                Threshold
              </button>
            </div>
          </div>

          {/* Threshold settings panel */}
          {showThresholds && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
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
                {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${CATEGORY_COLOR[key]?.chip ?? 'bg-gray-100 text-gray-600'}`}>
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
          )}
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100">
          {[
            { label: 'Mahasiswa',         value: totalFiltered,  sub: `${allStudentResults.filter((r) => r.totalWithData > 0).length} ada data CPL`, icon: <Users size={15} className="text-blue-600" />,        bg: 'bg-blue-50' },
            { label: 'Memenuhi Semua CPL', value: studentsAllMet, sub: `${totalFiltered > 0 ? Math.round((studentsAllMet / totalFiltered) * 100) : 0}% dari total`, icon: <CheckCircle2 size={15} className="text-emerald-600" />, bg: 'bg-emerald-50' },
            { label: 'Rata-rata Pencapaian', value: `${avgCplPct}%`, sub: 'rata-rata semua CPL', icon: <TrendingUp size={15} className="text-purple-600" />, bg: 'bg-purple-50' },
            { label: 'Mahasiswa Berisiko',  value: studentsAtRisk, sub: '< 50% CPL terpenuhi', icon: <AlertTriangle size={15} className="text-red-500" />,       bg: 'bg-red-50' },
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          <div className="lg:col-span-2 p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Persentase Pencapaian per CPL</p>
            {barData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Belum ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(barData.length * 28, 200)}>
                <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 40, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} width={46} />
                  <Tooltip content={<CplTooltip />} />
                  <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={18}>
                    {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="p-5 flex flex-col justify-center">
            <p className="text-sm font-semibold text-gray-700 mb-2">Rata-rata per Kategori</p>
            {radarData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-300 text-sm">Belum ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <Radar name="Pencapaian" dataKey="pct" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Pencapaian']} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Detail CPL rows */}
        <div className="border-t border-gray-100">
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Detail Pencapaian CPL</p>
            <div className="flex items-center gap-3 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> ≥75%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> 50–74%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> &lt;50%</span>
            </div>
          </div>
          {cplStats.length === 0 ? (
            <div className="p-8 text-center text-gray-300 text-sm">Pilih kurikulum dan tunggu data dimuat…</div>
          ) : cplStats.map((stat) => (
            <CplRow
              key={stat.id}
              cpl={stat}
              pct={stat.pct} met={stat.met} total={stat.total}
              passingStudents={filteredResults.filter((r) => r.cplMap[stat.code] === 'met')}
              partialStudents={filteredResults.filter((r) => r.cplMap[stat.code] === 'partial')}
              failingStudents={filteredResults.filter((r) => r.cplMap[stat.code] === 'not_met')}
              noDataStudents={filteredResults.filter((r) => r.cplMap[stat.code] === 'no_data')}
              expanded={expandedCpl === stat.id}
              onToggle={() => setExpandedCpl(expandedCpl === stat.id ? null : stat.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Student perspective ─────────────────────────────────────────────── */}
      <StudentPerspectiveSection
        results={filteredResults}
        cpls={realCpls}
        cpmkList={realCpmks}
        cplToCpmkIds={cplToCpmkIds}
        cpmkIdToCourseIds={cpmkIdToCourseIds}
        allCourseInfoMap={allCourseInfoMap}
      />

      {/* ── Tracking Capaian CPMK per Mata Kuliah ─────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen size={18} className="text-primary shrink-0" />
            <div>
              <h2 className="text-base font-bold text-gray-800">Tracking Capaian CPMK per Mata Kuliah</h2>
              <p className="text-xs text-gray-400">Jumlah mahasiswa yang lulus tiap CPMK dalam satu MK, dikaitkan ke CPL</p>
            </div>
          </div>
          <select
            value={trackingSemester ?? ''}
            onChange={(e) => {
              const v = e.target.value === '' ? null : Number(e.target.value);
              setTrackingSemester(v);
              setTrackingExpanded(null);
            }}
            className="shrink-0 text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Semua Semester</option>
            {availableMatrixSemesters.map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>

        <div>
          {uniqueCourses
            .filter((c) => trackingSemester === null || c.semester === trackingSemester)
            .map((course) => {
            const stats = courseCpmkPassStats.get(course.id);
            const totalEnrolled = filteredCourseCount.get(course.id) ?? 0;
            const isExpanded = trackingExpanded === course.id;

            if (!stats || stats.size === 0) return null;

            const cpmkEntries = [...stats.entries()]
              .map(([cpmkId, s]) => ({ cpmkId, ...s, cpmk: realCpmks.find((c) => c.id === cpmkId) }))
              .filter((e) => e.cpmk)
              .sort((a, b) => (a.cpmk!.code).localeCompare(b.cpmk!.code, undefined, { numeric: true }));

            const avgPass = cpmkEntries.length > 0
              ? Math.round(cpmkEntries.reduce((s, e) => s + (e.scored > 0 ? e.above / e.scored : 0), 0) / cpmkEntries.length * 100)
              : 0;

            return (
              <div key={course.id} className="border-b border-gray-50 last:border-0">
                <button
                  className="w-full text-left px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                  onClick={() => setTrackingExpanded(isExpanded ? null : course.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-primary font-mono w-24 shrink-0">{course.code}</span>
                    <span className="flex-1 text-sm text-gray-700 truncate">{course.name}</span>
                    <span className="text-[11px] text-gray-400 shrink-0">{totalEnrolled} mhs · {cpmkEntries.length} CPMK</span>
                    <span className={`text-xs font-bold shrink-0 w-12 text-right ${pctColor(avgPass).text}`}>{avgPass}%</span>
                    <span className="text-gray-400 group-hover:text-gray-600 shrink-0">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mx-5 mb-4 space-y-1.5">
                    {/* Header */}
                    <div className="grid grid-cols-[auto_1fr_auto_200px] gap-3 px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      <span className="w-20">CPMK</span>
                      <span>Deskripsi</span>
                      <span className="text-right w-20">CPL Terkait</span>
                      <span className="text-right">Lulus / Dinilai</span>
                    </div>
                    {cpmkEntries.map(({ cpmkId, cpmk, above, scored }) => {
                      const threshold = cpmkThresholdMap.get(cpmkId) ?? 60;
                      const pct = scored > 0 ? Math.round((above / scored) * 100) : 0;
                      const colors = pctColor(pct);
                      const relatedCpls = cpmkToCplCodes.get(cpmkId) ?? [];
                      return (
                        <div key={cpmkId}
                          className="grid grid-cols-[auto_1fr_auto_200px] gap-3 items-center bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                          <span className="text-[11px] font-bold text-violet-700 font-mono w-20 shrink-0">{cpmk!.code}</span>
                          <span className="text-xs text-gray-600 truncate">{cpmk!.name}</span>
                          <div className="flex flex-wrap gap-1 justify-end w-20 shrink-0">
                            {relatedCpls.map((code) => (
                              <span key={code} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap">
                                {code}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: colors.bar }} />
                            </div>
                            <span className={`text-xs font-bold shrink-0 w-28 text-right ${colors.text}`}>
                              {above}/{scored} <span className="font-normal text-gray-400">({pct}% ≥{threshold}%)</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Peta CPL per Mahasiswa (heatmap) ──────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Users size={18} className="text-primary" />
          <div>
            <h2 className="text-base font-bold text-gray-800">Peta CPL per Mahasiswa</h2>
            <p className="text-xs text-gray-400">
              {filteredResults.length} mhs ·
              <span className="text-emerald-500"> ✓ terpenuhi</span> ·
              <span className="text-red-400"> ✗ belum</span> ·
              <span className="text-gray-300"> – belum ada nilai</span>
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-gray-500 font-semibold min-w-[180px]">Mahasiswa</th>
                <th className="text-center px-2 py-3 text-gray-400 font-medium w-16">Angk.</th>
                <th className="text-center px-2 py-3 text-gray-600 font-semibold w-24">Capaian</th>
                {realCpls.map((cpl) => (
                  <th key={cpl.id} className="text-center px-1 py-3 text-gray-500 font-medium w-12" title={cpl.name}>
                    {cpl.code.replace('CPL', 'C')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapStudents.length === 0 ? (
                <tr><td colSpan={3 + realCpls.length} className="text-center py-8 text-gray-300">Belum ada data</td></tr>
              ) : heatmapStudents.map((r) => {
                const metPct = r.totalWithData > 0 ? Math.round((r.metCount / r.totalWithData) * 100) : null;
                const c = metPct !== null ? pctColor(metPct) : null;
                return (
                  <tr key={r.student.nim} className="hover:bg-gray-50/60 transition-colors border-b border-gray-50 last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-gray-800 text-[13px]">{r.student.name}</div>
                      <div className="text-gray-400 text-[11px]">{r.student.nim}</div>
                    </td>
                    <td className="px-2 py-2 text-center text-gray-400 text-[11px]">{r.angkatan}</td>
                    <td className="px-2 py-2 text-center">
                      {metPct !== null ? (
                        <span className={`font-bold text-xs px-1.5 py-0.5 rounded-full ${c!.bg} ${c!.text}`}>
                          {r.metCount}/{r.totalWithData}
                        </span>
                      ) : <span className="text-gray-300">–</span>}
                    </td>
                    {realCpls.map((cpl) => {
                      const status = r.cplMap[cpl.code];
                      return (
                        <td key={cpl.id} className="px-1 py-2 text-center">
                          {status === 'met'
                            ? <span title={`${r.cplAvgPct[cpl.code]}%`} className="text-emerald-500 font-bold text-sm">✓</span>
                            : status === 'not_met'
                            ? <span title={`${r.cplAvgPct[cpl.code]}%`} className="text-red-400 text-sm">✗</span>
                            : <span className="text-gray-200 text-sm">–</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalHeatmapPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/60">
            <p className="text-xs text-gray-400">
              {heatmapPage * PAGE_SIZE + 1}–{Math.min((heatmapPage + 1) * PAGE_SIZE, filteredResults.length)} dari {filteredResults.length}
            </p>
            <div className="flex items-center gap-1">
              <button disabled={heatmapPage === 0} onClick={() => setHeatmapPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-100 transition-colors font-medium">‹ Prev</button>
              {Array.from({ length: totalHeatmapPages }, (_, i) => i).map((i) => (
                <button key={i} onClick={() => setHeatmapPage(i)}
                  className={`w-7 h-7 text-xs rounded-lg border font-medium transition-colors ${i === heatmapPage ? 'bg-primary text-white border-primary' : 'border-gray-200 hover:bg-gray-100 text-gray-600'}`}>{i + 1}</button>
              ))}
              <button disabled={heatmapPage >= totalHeatmapPages - 1} onClick={() => setHeatmapPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-100 transition-colors font-medium">Next ›</button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
