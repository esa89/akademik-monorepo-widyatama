import { useState, useMemo, useRef, useEffect, type ReactNode } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
  Users, GraduationCap, AlertTriangle, CheckCircle2,
  TrendingUp, Target, BookOpen, Layers, ClipboardCheck,
  ChevronDown, ChevronRight, User, Search, X,
} from 'lucide-react';
import { useUser } from '@widyatama/sso-react';
import { useQuery, useQueries } from '@tanstack/react-query';
import {
  cplService, cpmkService, subCpmkService, assessmentComponentService,
  academicClassService, cpmkCplMappingService, studentCpmkScoreService,
} from '@/services/obe.service';
import { useApp } from '@/contexts/AppContext';

// ─── Types ────────────────────────────────────────────────────────────────────
type RealCpl    = { id: string; code: string; name: string; category: string };
type RealCpmk   = { id: string; code: string; name: string };
type RealStudent = { id: string; nim: string; name: string };

type RealStudentResult = {
  student: RealStudent;
  angkatan: number;
  cplMap:    Record<string, 'met' | 'not_met' | 'no_data'>;
  cplAvgPct: Record<string, number>;
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

function nimToAngkatan(nim: string) {
  return parseInt(`20${nim.substring(0, 2)}`);
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
function CplTooltip({ active, payload }: { active?: boolean; payload?: { payload: RealCplStat }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 max-w-xs text-xs">
      <p className="font-bold text-gray-800 mb-1">{d.code}</p>
      <p className="text-gray-500 mb-2 leading-tight line-clamp-3">{d.name}</p>
      <p className={`font-bold ${pctColor(d.pct).text}`}>Rata-rata capaian: {d.pct}%</p>
      <p className="text-gray-400 mt-0.5">{d.met}/{d.total} mhs terpenuhi (≥60)</p>
    </div>
  );
}

// ─── CplRow ───────────────────────────────────────────────────────────────────
function CplRow({
  cpl, pct, met, total,
  passingStudents, failingStudents, noDataStudents,
  expanded, onToggle,
}: {
  cpl: RealCpl;
  pct: number; met: number; total: number;
  passingStudents: RealStudentResult[];
  failingStudents: RealStudentResult[];
  noDataStudents:  RealStudentResult[];
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                <p className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600" /> Terpenuhi — {passingStudents.length} mahasiswa
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {passingStudents.map((r) => (
                    <span key={r.student.nim} className="text-[10px] bg-white border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {r.student.name} <span className="text-emerald-400">({r.cplAvgPct[cpl.code]}%)</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-red-500" /> Belum Terpenuhi — {failingStudents.length} mahasiswa
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {failingStudents.map((r) => (
                    <span key={r.student.nim} className="text-[10px] bg-white border border-red-200 text-red-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {r.student.name} <span className="text-red-400">({r.cplAvgPct[cpl.code]}%)</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {noDataStudents.length > 0 && (
            <p className="text-[10px] text-gray-400 italic px-1">
              {noDataStudents.length} mahasiswa belum ada nilai untuk {cpl.code}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Student Perspective Section ──────────────────────────────────────────────
const PAGE_SIZE_STUDENT = 10;

function StudentPerspectiveSection({ results, cpls }: { results: RealStudentResult[]; cpls: RealCpl[] }) {
  const [query, setQuery]         = useState('');
  const [angkatan, setAngkatan]   = useState<number[]>([]);
  const [page, setPage]           = useState(0);
  const [expandedNim, setExpandedNim] = useState<string | null>(null);

  const angkatanOptions = useMemo(() => {
    const set = new Set(results.map((r) => r.angkatan));
    return [...set].sort().map((a) => ({ value: a, label: `Angk. ${a}` }));
  }, [results]);

  const filtered = useMemo(() => {
    let list = results;
    if (angkatan.length > 0) list = list.filter((r) => angkatan.includes(r.angkatan));
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((r) => r.student.name.toLowerCase().includes(q) || r.student.nim.includes(q));
    return list;
  }, [results, angkatan, query]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE_STUDENT);
  const paginated  = filtered.slice(page * PAGE_SIZE_STUDENT, (page + 1) * PAGE_SIZE_STUDENT);
  const resetNav   = () => { setPage(0); setExpandedNim(null); };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center gap-3">
        <User size={18} className="text-primary shrink-0" />
        <div className="flex-1">
          <h2 className="text-base font-bold text-gray-800">Data Capaian Mahasiswa CPL</h2>
          <p className="text-xs text-gray-400">{filtered.length} mahasiswa · klik baris untuk detail CPL</p>
        </div>
      </div>

      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60 flex flex-wrap items-center gap-3">
        <MultiSelectChip
          options={angkatanOptions}
          value={angkatan}
          onChange={(v) => { setAngkatan(v); resetNav(); }}
          placeholder="Semua Angkatan"
        />
        <div className="relative flex-1 min-w-[160px] max-w-xs">
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
                <div className="mx-5 mb-4 space-y-3">
                  {([
                    { key: 'met',      label: 'Terpenuhi',           wrapCls: 'bg-emerald-50 border-emerald-200', labelCls: 'text-emerald-700', cardCls: 'bg-white border-emerald-100', dotCls: 'bg-emerald-100 text-emerald-600', dotIcon: '✓' },
                    { key: 'not_met',  label: 'Belum Terpenuhi',     wrapCls: 'bg-red-50 border-red-200',         labelCls: 'text-red-600',     cardCls: 'bg-white border-red-100',     dotCls: 'bg-red-100 text-red-500',      dotIcon: '✗' },
                    { key: 'no_data',  label: 'Belum Dapat Diukur',  wrapCls: 'bg-gray-50 border-gray-200',       labelCls: 'text-gray-500',    cardCls: 'bg-white border-gray-100',    dotCls: 'bg-gray-100 text-gray-400',    dotIcon: '–' },
                  ] as const).map(({ key, label, wrapCls, labelCls, cardCls, dotCls, dotIcon }) => {
                    const groupCpls = cpls.filter((cpl) => result.cplMap[cpl.code] === key);
                    if (groupCpls.length === 0) return null;
                    return (
                      <div key={key} className={`rounded-xl border p-3 ${wrapCls}`}>
                        <p className={`text-xs font-semibold mb-2.5 flex items-center gap-1.5 ${labelCls}`}>
                          <span className={`flex w-4 h-4 rounded-full items-center justify-center text-[9px] font-bold ${dotCls}`}>{dotIcon}</span>
                          {label}
                          <span className="ml-auto font-bold">{groupCpls.length} CPL</span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {groupCpls.map((cpl) => (
                            <div key={cpl.code} className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${cardCls}`}>
                              <span className={`flex w-5 h-5 rounded-full items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${dotCls}`}>{dotIcon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[11px] font-bold text-gray-700">{cpl.code}</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[cpl.category]?.chip ?? 'bg-gray-100 text-gray-600'}`}>
                                    {cpl.category?.replace(/_/g, ' ')}
                                  </span>
                                  {key !== 'no_data' && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-auto ${pctColor(result.cplAvgPct[cpl.code] ?? 0).bg} ${pctColor(result.cplAvgPct[cpl.code] ?? 0).text}`}>
                                      {result.cplAvgPct[cpl.code] ?? 0}%
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-500 leading-tight mt-0.5 line-clamp-2">{cpl.name}</p>
                              </div>
                            </div>
                          ))}
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

// ─── Pemetaan CPL → CPMK ─────────────────────────────────────────────────────
function PemetaanSection({ cpls, cpmks, cplToCpmkIds }: {
  cpls: RealCpl[];
  cpmks: RealCpmk[];
  cplToCpmkIds: Map<string, string[]>;
}) {
  const [expandedCpl, setExpandedCpl] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center gap-3">
        <Layers size={18} className="text-primary shrink-0" />
        <div className="flex-1">
          <h2 className="text-base font-bold text-gray-800">Pemetaan CPL → CPMK</h2>
          <p className="text-xs text-gray-400">{cpls.length} CPL · {cpmks.length} CPMK</p>
        </div>
      </div>
      <div>
        {cpls.map((cpl) => {
          const linkedIds  = cplToCpmkIds.get(cpl.id) ?? [];
          const linkedCpmks = linkedIds.map((id) => cpmks.find((c) => c.id === id)).filter(Boolean) as RealCpmk[];
          const isExpanded = expandedCpl === cpl.id;

          return (
            <div key={cpl.id} className="border-b border-gray-50 last:border-0">
              <button className="w-full text-left px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                onClick={() => setExpandedCpl(isExpanded ? null : cpl.id)}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-primary w-12 shrink-0">{cpl.code}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${CATEGORY_COLOR[cpl.category]?.chip ?? 'bg-gray-100 text-gray-600'}`}>
                    {cpl.category?.replace(/_/g, ' ')}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 truncate">{cpl.name}</span>
                  <span className="hidden sm:block text-[10px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full font-medium shrink-0">
                    {linkedCpmks.length} CPMK
                  </span>
                  <span className="text-gray-400 group-hover:text-gray-600 shrink-0">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                </div>
              </button>
              {isExpanded && (
                <div className="mx-5 mb-4 space-y-1.5">
                  {linkedCpmks.length === 0 ? (
                    <p className="text-xs text-gray-400 italic px-1 py-2">Belum ada CPMK terpetakan.</p>
                  ) : linkedCpmks.map((cpmk) => (
                    <div key={cpmk.id} className="flex items-start gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                      <span className="text-[10px] font-bold text-violet-700 shrink-0 mt-0.5 bg-violet-50 px-1.5 py-0.5 rounded-md whitespace-nowrap">{cpmk.code}</span>
                      <p className="text-xs text-gray-600 leading-relaxed">{cpmk.name}</p>
                    </div>
                  ))}
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
  const { selectedCurriculum } = useApp();
  const curriculumId = selectedCurriculum?.id;

  const [selectedAngkatan, setSelectedAngkatan] = useState<number[]>([]);
  const [expandedCpl, setExpandedCpl]           = useState<string | null>(null);
  const [heatmapPage, setHeatmapPage]           = useState(0);
  const PAGE_SIZE = 15;

  // ── API queries ───────────────────────────────────────────────────────────
  const { data: cpmkData }    = useQuery({ queryKey: ['count-cpmk'],    queryFn: () => cpmkService.getAll({ limit: 1 }) });
  const { data: subData }     = useQuery({ queryKey: ['count-subcpmk'], queryFn: () => subCpmkService.getAll({ limit: 1 }) });
  const { data: compData }    = useQuery({ queryKey: ['count-comp'],    queryFn: () => assessmentComponentService.getAll({ limit: 1 }) });
  const { data: classesData } = useQuery({ queryKey: ['count-classes'], queryFn: () => academicClassService.getAll({ limit: 100 }) });

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
  const realCpls    = useMemo(() => (cplListData?.data ?? []) as RealCpl[], [cplListData]);
  const realCpmks   = useMemo(() => cpmkCplMatrix?.data?.cpmks    ?? [], [cpmkCplMatrix]);
  const rawMappings = useMemo(() => cpmkCplMatrix?.data?.mappings ?? [], [cpmkCplMatrix]);

  const cplToCpmkIds = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const cpl of realCpls) {
      map.set(cpl.id, rawMappings.filter((m) => m.cplId === cpl.id).map((m) => m.cpmkId));
    }
    return map;
  }, [realCpls, rawMappings]);

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

    // Collect scores per student per CPMK
    const scoresByStudent = new Map<string, Map<string, number[]>>();
    for (const res of classScoreResults) {
      for (const s of res.data?.data ?? []) {
        if (!scoresByStudent.has(s.studentId)) scoresByStudent.set(s.studentId, new Map());
        const sm = scoresByStudent.get(s.studentId)!;
        if (!sm.has(s.cpmkId)) sm.set(s.cpmkId, []);
        sm.get(s.cpmkId)!.push(s.score);
      }
    }

    return [...studentMap.values()].map((student) => {
      const cpmkScoreMap = scoresByStudent.get(student.id) ?? new Map<string, number[]>();
      const cpmkAvg = new Map<string, number>();
      for (const [id, scores] of cpmkScoreMap) {
        cpmkAvg.set(id, scores.reduce((a, b) => a + b, 0) / scores.length);
      }

      const cplMap:    Record<string, 'met' | 'not_met' | 'no_data'> = {};
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
          const avg = scored.reduce((s, id) => s + cpmkAvg.get(id)!, 0) / scored.length;
          cplAvgPct[cpl.code] = Math.round(avg);
          // Only check CPMKs that have been assessed; ignore unscored ones from other courses
          const allPass = scored.every((id) => cpmkAvg.get(id)! >= 60);
          cplMap[cpl.code] = allPass ? 'met' : 'not_met';
          if (allPass) metCount++;
        }
      }

      return { student, angkatan: nimToAngkatan(student.nim), cplMap, cplAvgPct, metCount, totalWithData };
    }).sort((a, b) => b.metCount - a.metCount);
  }, [realCpls, cplToCpmkIds, classDetailResults, classScoreResults]);

  // ── CPL aggregate stats ───────────────────────────────────────────────────
  const cplStats = useMemo((): RealCplStat[] =>
    realCpls.map((cpl) => {
      const withData = allStudentResults.filter((r) => r.cplMap[cpl.code] !== 'no_data');
      const met      = withData.filter((r) => r.cplMap[cpl.code] === 'met').length;
      const total    = withData.length;
      return { ...cpl, pct: total > 0 ? Math.round((met / total) * 100) : 0, met, total };
    }),
  [realCpls, allStudentResults]);

  // ── Filter by angkatan ────────────────────────────────────────────────────
  const filteredResults = useMemo(() =>
    selectedAngkatan.length === 0
      ? allStudentResults
      : allStudentResults.filter((r) => selectedAngkatan.includes(r.angkatan)),
  [allStudentResults, selectedAngkatan]);

  const angkatanOptions = useMemo(() => {
    const set = new Set(allStudentResults.map((r) => r.angkatan));
    return [...set].sort().map((a) => ({ value: a, label: `Angk. ${a}` }));
  }, [allStudentResults]);

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalFiltered   = filteredResults.length;
  const studentsAllMet  = filteredResults.filter((r) => r.totalWithData > 0 && r.metCount === realCpls.length).length;
  const studentsAtRisk  = filteredResults.filter((r) => r.totalWithData > 0 && r.metCount < realCpls.length * 0.5).length;
  const avgCplPct = useMemo(() => {
    const valid = cplStats.filter((s) => s.total > 0);
    return valid.length ? Math.round(valid.reduce((s, c) => s + c.pct, 0) / valid.length) : 0;
  }, [cplStats]);

  // ── Chart data ────────────────────────────────────────────────────────────
  const barData = cplStats.map((s) => ({ ...s, label: s.code, fill: pctColor(s.pct).bar }));

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
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{realStudents > 0 ? realStudents : '…'}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{realClasses.length} kelas · {activeClasses} aktif</p>
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

      {/* ══ CPL ACHIEVEMENT ══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Header + filter */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Target size={18} className="text-primary shrink-0" />
              <div>
                <h2 className="text-base font-bold text-gray-800">Pencapaian CPL Mahasiswa</h2>
                <p className="text-xs text-gray-400">Berdasarkan nilai CPMK nyata · threshold kelulusan ≥ 60</p>
              </div>
            </div>
            {angkatanOptions.length > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] text-gray-400 font-medium">Angkatan</span>
                <MultiSelectChip options={angkatanOptions} value={selectedAngkatan}
                  onChange={(v) => { setSelectedAngkatan(v); setHeatmapPage(0); }} placeholder="Semua Angkatan" />
              </div>
            )}
          </div>
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
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Pencapaian']} />
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
              failingStudents={filteredResults.filter((r) => r.cplMap[stat.code] === 'not_met')}
              noDataStudents={filteredResults.filter((r) => r.cplMap[stat.code] === 'no_data')}
              expanded={expandedCpl === stat.id}
              onToggle={() => setExpandedCpl(expandedCpl === stat.id ? null : stat.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Student perspective ─────────────────────────────────────────────── */}
      <StudentPerspectiveSection results={allStudentResults} cpls={realCpls} />

      {/* ── Pemetaan CPL → CPMK ────────────────────────────────────────────── */}
      <PemetaanSection cpls={realCpls} cpmks={realCpmks} cplToCpmkIds={cplToCpmkIds} />

      {/* ── Peta CPL per Mahasiswa (heatmap) ──────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
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
      </div>

    </div>
  );
}
