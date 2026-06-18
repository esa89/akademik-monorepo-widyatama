import { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Drawer } from '@widyatama/ui';
import { useApp } from '@/contexts/AppContext';
import { cpmkCourseMappingService, courseService } from '@/services/obe.service';
import type { CplMatrixRow, CpmkMatrixRow, Course } from '@/types';
import {
  BookOpen, Link2, Download, FileSpreadsheet, Upload,
  CheckCircle2, XCircle, ChevronLeft, ChevronRight, Loader2,
  Search, X, LayoutList, Table2, AlertCircle, Pencil,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = 'matrix' | 'table';

interface ImportRow {
  cpmkCode: string;
  courseCode: string;
  valid: boolean;
  error?: string;
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function CplBadge({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
      {code}
    </span>
  );
}

function CourseBadge({ code, name }: { code: string; name?: string }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-100 text-blue-800 border border-blue-200 cursor-default hover:bg-blue-200 transition-colors"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {code}
      {show && name && (
        <span className="absolute bottom-full left-0 mb-1 z-50 w-52 p-2 bg-gray-900 text-white text-[11px] rounded-lg shadow-xl leading-snug pointer-events-none whitespace-normal">
          {name}
        </span>
      )}
    </span>
  );
}

function EmptyMk({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-dashed border-gray-300 text-[11px] text-gray-400 hover:border-primary hover:text-primary transition-colors"
    >
      <Link2 size={10} /> Pilih MK
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function MappingCplCpmkMkPage() {
  const queryClient = useQueryClient();
  const { selectedCurriculum } = useApp();
  const curriculumId = selectedCurriculum?.id ?? null;

  const [viewMode, setViewMode] = useState<ViewMode>('matrix');
  const [tableSearch, setTableSearch] = useState('');
  const [filterCpl, setFilterCpl] = useState('');
  const [filterMk, setFilterMk] = useState<'all' | 'mapped' | 'unmapped'>('all');

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit drawer
  const [editOpen, setEditOpen]       = useState(false);
  const [editingCpmk, setEditingCpmk] = useState<CpmkMatrixRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [courseSearch, setCourseSearch] = useState('');

  // Import drawer
  const [importOpen, setImportOpen]     = useState(false);
  const [importStep, setImportStep]     = useState<1 | 2>(1);
  const [importRows, setImportRows]     = useState<ImportRow[]>([]);
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; failed: string[] } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // ─── Queries ─────────────────────────────────────────────────────────────────

  const { data: matrixRes, isLoading } = useQuery({
    queryKey: ['cpmk-course-mapping-matrix', curriculumId, selectedCurriculum?.year],
    queryFn: () => cpmkCourseMappingService.getMatrix({
      curriculumId: curriculumId!,
      curriculumYear: selectedCurriculum?.year,
    }),
    enabled: !!curriculumId,
  });

  const { data: courseRes } = useQuery({
    queryKey: ['courses-all', curriculumId],
    queryFn: () => courseService.getAll({
      curriculumId: curriculumId ?? undefined,
      limit: 100,
      sortBy: 'code',
      sortOrder: 'asc',
    }),
    enabled: !!curriculumId,
  });

  const matrix: CplMatrixRow[]    = matrixRes?.data?.matrix ?? [];
  const unmapped: CpmkMatrixRow[] = matrixRes?.data?.unmappedCpmks ?? [];
  const stats = {
    totalCpl:    matrixRes?.data?.totalCpl ?? 0,
    totalCpmk:   matrixRes?.data?.totalCpmk ?? 0,
    mappedToCpl: matrixRes?.data?.mappedToCpl ?? 0,
    mappedToMk:  matrixRes?.data?.mappedToMk ?? 0,
  };

  const courses: Course[] = courseRes?.data ?? [];
  const courseMap     = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);
  const courseByCode  = useMemo(() => new Map(courses.map((c) => [c.code, c])), [courses]);

  // Group courses by semester for the edit drawer
  const coursesBySemester = useMemo(() => {
    const map = new Map<number, Course[]>();
    for (const c of courses) {
      const sem = c.semester ?? 0;
      if (!map.has(sem)) map.set(sem, []);
      map.get(sem)!.push(c);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [courses]);

  // All CPMK in a flat list (for table view)
  const allCpmks: CpmkMatrixRow[] = useMemo(() => {
    const seen = new Set<string>();
    const result: CpmkMatrixRow[] = [];
    for (const row of matrix) {
      for (const c of row.cpmks) {
        if (!seen.has(c.id)) { seen.add(c.id); result.push(c); }
      }
    }
    for (const c of unmapped) {
      if (!seen.has(c.id)) { seen.add(c.id); result.push(c); }
    }
    return result.sort((a, b) => a.code.localeCompare(b.code));
  }, [matrix, unmapped]);

  // Unique CPL list for filter dropdown
  const cplOptions = useMemo(
    () => matrix.map((r) => r.cpl),
    [matrix],
  );

  // Filtered table rows
  const filteredCpmks = useMemo(() => {
    return allCpmks.filter((c) => {
      const q = tableSearch.toLowerCase();
      if (q && !c.code.toLowerCase().includes(q) && !c.name.toLowerCase().includes(q)) return false;
      if (filterCpl && !c.cpls.some((p) => p.id === filterCpl)) return false;
      if (filterMk === 'mapped' && c.courseIds.length === 0) return false;
      if (filterMk === 'unmapped' && c.courseIds.length > 0) return false;
      return true;
    });
  }, [allCpmks, tableSearch, filterCpl, filterMk]);

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: (data: { cpmkId: string; courseIds: string[] }) =>
      cpmkCourseMappingService.saveMappings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpmk-course-mapping-matrix'] });
      setEditOpen(false);
      showToast('success', `Pemetaan MK untuk ${editingCpmk?.code} berhasil disimpan.`);
    },
    onError: () => showToast('error', 'Gagal menyimpan pemetaan.'),
  });

  // ─── Edit Drawer ─────────────────────────────────────────────────────────────

  const openEdit = (cpmk: CpmkMatrixRow) => {
    setEditingCpmk(cpmk);
    setSelectedIds(new Set(cpmk.courseIds));
    setCourseSearch('');
    setEditOpen(true);
  };

  const toggleCourse = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const filteredDrawerCourses = useMemo(() => {
    const q = courseSearch.toLowerCase();
    if (!q) return coursesBySemester;
    return coursesBySemester.map(([sem, list]) => [
      sem,
      list.filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)),
    ] as [number, Course[]]).filter(([, list]) => list.length > 0);
  }, [coursesBySemester, courseSearch]);

  // ─── Import ───────────────────────────────────────────────────────────────────

  const resetImport = () => {
    setImportStep(1); setImportRows([]); setImportProgress(null); setImportResult(null);
    if (importFileRef.current) importFileRef.current.value = '';
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(new Uint8Array(evt.target?.result as ArrayBuffer), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        const cpmkCodes = new Set(allCpmks.map((c) => c.code));
        const parsed: ImportRow[] = rows.slice(1)
          .map((row) => ({
            cpmkCode:   String((row as unknown[])[0] ?? '').trim(),
            courseCode: String((row as unknown[])[1] ?? '').trim(),
            valid: false,
          }))
          .filter((r) => r.cpmkCode && r.courseCode)
          .map((r) => {
            if (!cpmkCodes.has(r.cpmkCode))    return { ...r, error: `CPMK "${r.cpmkCode}" tidak ada dalam kurikulum` };
            if (!courseByCode.has(r.courseCode)) return { ...r, error: `MK "${r.courseCode}" tidak ditemukan` };
            return { ...r, valid: true };
          });
        setImportRows(parsed);
      } catch { showToast('error', 'Gagal membaca file Excel.'); }
    };
    reader.readAsArrayBuffer(file);
    if (importFileRef.current) importFileRef.current.value = '';
  };

  const runImport = async () => {
    const valid = importRows.filter((r) => r.valid);
    const grouped = new Map<string, Set<string>>();
    for (const row of valid) {
      const cpmk   = allCpmks.find((c) => c.code === row.cpmkCode);
      const course = courseByCode.get(row.courseCode);
      if (!cpmk || !course) continue;
      if (!grouped.has(cpmk.id)) grouped.set(cpmk.id, new Set(cpmk.courseIds));
      grouped.get(cpmk.id)!.add(course.id);
    }
    setImportProgress({ done: 0, total: grouped.size });
    const failed: string[] = [];
    let done = 0;
    for (const [cpmkId, ids] of grouped) {
      try {
        await cpmkCourseMappingService.saveMappings({ cpmkId, courseIds: [...ids] });
        done++;
      } catch {
        const code = allCpmks.find((c) => c.id === cpmkId)?.code ?? cpmkId;
        failed.push(code);
      }
      setImportProgress({ done, total: grouped.size });
    }
    setImportResult({ success: grouped.size - failed.length, failed });
    queryClient.invalidateQueries({ queryKey: ['cpmk-course-mapping-matrix'] });
  };

  // ─── Export ───────────────────────────────────────────────────────────────────

  const handleExport = () => {
    const rows: Record<string, string>[] = [];
    let no = 1;
    for (const row of matrix) {
      for (let i = 0; i < row.cpmks.length; i++) {
        const cpmk = row.cpmks[i];
        const mks  = cpmk.courseIds.map((id) => courseMap.get(id)?.code ?? id).join(', ');
        rows.push({
          'No':            i === 0 ? String(no) : '',
          'CPL':           i === 0 ? row.cpl.code : '',
          'Deskripsi CPL': i === 0 ? row.cpl.name : '',
          'Kode CPMK':     cpmk.code,
          'CPMK':          cpmk.name,
          'MK':            mks,
        });
      }
      no++;
    }
    if (unmapped.length > 0) {
      rows.push({ 'No': '', 'CPL': '— Belum dipetakan ke CPL —', 'Deskripsi CPL': '', 'Kode CPMK': '', 'CPMK': '', 'MK': '' });
      for (const c of unmapped) {
        const mks = c.courseIds.map((id) => courseMap.get(id)?.code ?? id).join(', ');
        rows.push({ 'No': '', 'CPL': '', 'Deskripsi CPL': '', 'Kode CPMK': c.code, 'CPMK': c.name, 'MK': mks });
      }
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 4 }, { wch: 8 }, { wch: 52 }, { wch: 12 }, { wch: 60 }, { wch: 60 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CPL-CPMK-MK');
    XLSX.writeFile(wb, `pemetaan-cpl-cpmk-mk-${selectedCurriculum?.year ?? 'all'}.xlsx`);
  };

  const handleTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Kode CPMK', 'Kode MK'],
      ['CPMK011', 'MKU62101'],
      ['CPMK011', 'MKU62102'],
      ['CPMK012', 'INF62123'],
    ]);
    ws['!cols'] = [{ wch: 12 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template-mapping-cpmk-mk.xlsx');
  };

  const validCount = importRows.filter((r) => r.valid).length;

  // ─── Render Matrix View ───────────────────────────────────────────────────────

  const renderMatrixTable = (rows: CplMatrixRow[], showUnmapped: boolean) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b-2 border-gray-200">
            <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-8 border-r border-gray-200">No</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-20 border-r border-gray-200">CPL</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[200px] border-r border-gray-200">Deskripsi CPL</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 border-r border-gray-200">Kode CPMK</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[200px] border-r border-gray-200">CPMK</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[240px]">Mata Kuliah</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) =>
            row.cpmks.map((cpmk, ci) => (
              <tr
                key={`${row.cpl.id}-${cpmk.id}`}
                className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors cursor-pointer
                  ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                onClick={() => openEdit(cpmk)}
              >
                {ci === 0 && (
                  <>
                    <td rowSpan={row.cpmks.length} className="px-3 py-3 text-center text-sm font-semibold text-gray-500 align-top border-r border-gray-200 bg-inherit">
                      {ri + 1}
                    </td>
                    <td rowSpan={row.cpmks.length} className="px-3 py-3 align-top border-r border-gray-200 bg-inherit">
                      <CplBadge code={row.cpl.code} />
                    </td>
                    <td rowSpan={row.cpmks.length} className="px-3 py-3 text-xs text-gray-600 align-top border-r border-gray-200 leading-relaxed bg-inherit max-w-[220px]">
                      {row.cpl.name}
                    </td>
                  </>
                )}
                <td className="px-3 py-3 align-top border-r border-gray-200">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-mono font-bold border
                    ${cpmk.courseIds.length > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {cpmk.code}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs text-gray-700 align-top border-r border-gray-200 leading-relaxed max-w-[200px]">
                  {cpmk.name}
                </td>
                <td className="px-3 py-3 align-top" onClick={(e) => { e.stopPropagation(); openEdit(cpmk); }}>
                  {cpmk.courseIds.length > 0 ? (
                    <div className="flex flex-wrap gap-1 items-start">
                      {cpmk.courseIds.map((id) => {
                        const c = courseMap.get(id);
                        return c ? <CourseBadge key={id} code={c.code} name={c.name} /> : null;
                      })}
                      <button
                        className="ml-1 p-0.5 rounded text-gray-300 hover:text-primary transition-colors"
                        title="Edit pemetaan MK"
                      >
                        <Pencil size={11} />
                      </button>
                    </div>
                  ) : (
                    <EmptyMk onClick={() => openEdit(cpmk)} />
                  )}
                </td>
              </tr>
            ))
          )}

          {/* Unmapped CPMK section */}
          {showUnmapped && unmapped.length > 0 && (
            <>
              <tr>
                <td colSpan={6} className="px-3 py-2 bg-amber-50 border-t-2 border-amber-200">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                    <AlertCircle size={13} />
                    CPMK belum dipetakan ke CPL ({unmapped.length})
                    <span className="font-normal text-amber-600">— bisa langsung dipetakan ke MK di bawah ini</span>
                  </div>
                </td>
              </tr>
              {unmapped.map((cpmk) => (
                <tr
                  key={cpmk.id}
                  className="border-b border-amber-100 bg-amber-50/30 hover:bg-amber-50 transition-colors cursor-pointer"
                  onClick={() => openEdit(cpmk)}
                >
                  <td className="px-3 py-3 text-center border-r border-gray-200 text-gray-300">—</td>
                  <td className="px-3 py-3 border-r border-gray-200">
                    <span className="text-xs text-gray-400 italic">Belum</span>
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200 text-xs text-gray-400 italic">
                    Belum dipetakan ke CPL
                  </td>
                  <td className="px-3 py-3 border-r border-gray-200">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-mono font-bold border
                      ${cpmk.courseIds.length > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {cpmk.code}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600 border-r border-gray-200 leading-relaxed max-w-[200px]">
                    {cpmk.name}
                  </td>
                  <td className="px-3 py-3">
                    {cpmk.courseIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {cpmk.courseIds.map((id) => {
                          const c = courseMap.get(id);
                          return c ? <CourseBadge key={id} code={c.code} name={c.name} /> : null;
                        })}
                      </div>
                    ) : (
                      <EmptyMk onClick={() => openEdit(cpmk)} />
                    )}
                  </td>
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );

  // ─── Render Table View ────────────────────────────────────────────────────────

  const renderTableView = () => (
    <div>
      {/* Filter bar */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari kode atau isi CPMK..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <select
          value={filterCpl}
          onChange={(e) => setFilterCpl(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
        >
          <option value="">Semua CPL</option>
          {cplOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.code}</option>
          ))}
        </select>
        <select
          value={filterMk}
          onChange={(e) => setFilterMk(e.target.value as 'all' | 'mapped' | 'unmapped')}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
        >
          <option value="all">Semua Status MK</option>
          <option value="mapped">Sudah dipetakan ke MK</option>
          <option value="unmapped">Belum dipetakan ke MK</option>
        </select>
        <span className="self-center text-xs text-gray-400">{filteredCpmks.length} CPMK</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Kode CPMK</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[240px]">Isi CPMK</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">CPL</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[240px]">Mata Kuliah</th>
            </tr>
          </thead>
          <tbody>
            {filteredCpmks.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-gray-400">
                  Tidak ada data yang sesuai filter
                </td>
              </tr>
            ) : (
              filteredCpmks.map((cpmk, i) => (
                <tr
                  key={cpmk.id}
                  className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors cursor-pointer"
                  onClick={() => openEdit(cpmk)}
                >
                  <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-mono font-bold border
                      ${cpmk.courseIds.length > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {cpmk.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 leading-relaxed max-w-[260px]">{cpmk.name}</td>
                  <td className="px-4 py-3">
                    {cpmk.cpls.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {cpmk.cpls.map((p) => <CplBadge key={p.id} code={p.code} />)}
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Belum</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {cpmk.courseIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1 items-center">
                        {cpmk.courseIds.map((id) => {
                          const c = courseMap.get(id);
                          return c ? <CourseBadge key={id} code={c.code} name={c.name} /> : null;
                        })}
                        <button className="ml-1 p-0.5 rounded text-gray-300 hover:text-primary transition-colors">
                          <Pencil size={11} />
                        </button>
                      </div>
                    ) : (
                      <EmptyMk onClick={() => openEdit(cpmk)} />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ─── Page ─────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toastMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toastMsg.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toastMsg.text}
        </div>
      )}

      {!curriculumId && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-700">
          <BookOpen size={18} className="shrink-0" />
          Pilih kurikulum terlebih dahulu melalui dropdown di header.
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pemetaan CPL – CPMK – MK</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedCurriculum
              ? `Kurikulum ${selectedCurriculum.name} · ${selectedCurriculum.year}`
              : 'Pilih kurikulum untuk menampilkan data'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button onClick={handleTemplate}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <Download size={14} /> Template
          </button>
          <button onClick={handleExport} disabled={stats.totalCpmk === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-40">
            <FileSpreadsheet size={14} /> Export Excel
          </button>
          <button onClick={() => { resetImport(); setImportOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <Upload size={14} /> Import
          </button>
        </div>
      </div>

      {/* Stats */}
      {curriculumId && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total CPL',        value: stats.totalCpl,    color: 'text-primary',      bg: 'bg-primary/10',   prog: null },
            { label: 'Total CPMK',       value: stats.totalCpmk,   color: 'text-blue-600',     bg: 'bg-blue-50',      prog: null },
            { label: 'CPMK → CPL',       value: `${stats.mappedToCpl}/${stats.totalCpmk}`, color: stats.mappedToCpl === stats.totalCpmk ? 'text-emerald-700' : 'text-amber-600', bg: stats.mappedToCpl === stats.totalCpmk ? 'bg-emerald-50' : 'bg-amber-50', prog: stats.totalCpmk > 0 ? stats.mappedToCpl / stats.totalCpmk : 0 },
            { label: 'CPMK → MK',        value: `${stats.mappedToMk}/${stats.totalCpmk}`,  color: stats.mappedToMk === stats.totalCpmk ? 'text-emerald-700' : 'text-amber-600',  bg: stats.mappedToMk === stats.totalCpmk ? 'bg-emerald-50' : 'bg-amber-50',  prog: stats.totalCpmk > 0 ? stats.mappedToMk  / stats.totalCpmk : 0 },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              {s.prog !== null && (
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${s.prog === 1 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                    style={{ width: `${s.prog * 100}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* View toggle + content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Tab bar */}
        <div className="flex items-center gap-0 border-b border-gray-100 px-4 pt-3">
          {([
            { mode: 'matrix' as ViewMode, label: 'Matrix View', icon: <Table2 size={14} /> },
            { mode: 'table'  as ViewMode, label: 'Table View',  icon: <LayoutList size={14} /> },
          ] as const).map((tab) => (
            <button
              key={tab.mode}
              onClick={() => setViewMode(tab.mode)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors mr-1
                ${viewMode === tab.mode
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
          <div className="ml-auto pb-2">
            <p className="text-xs text-gray-400">Klik baris untuk edit pemetaan MK</p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-gray-400">
            <Loader2 size={20} className="animate-spin" /> Memuat data...
          </div>
        ) : !curriculumId ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">
            Pilih kurikulum untuk menampilkan pemetaan
          </div>
        ) : stats.totalCpmk === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
            <BookOpen size={28} className="opacity-40" />
            <p className="text-sm">Belum ada CPMK. Tambahkan CPMK terlebih dahulu di halaman Master CPMK.</p>
          </div>
        ) : viewMode === 'matrix' ? (
          renderMatrixTable(matrix, true)
        ) : (
          renderTableView()
        )}
      </div>

      {/* ─── Edit Drawer ──────────────────────────────────────────────────── */}
      <Drawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Pilih Mata Kuliah"
        description={editingCpmk?.code}
        footer={
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500">{selectedIds.size} MK dipilih</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
              <Button onClick={() => editingCpmk && saveMutation.mutate({ cpmkId: editingCpmk.id, courseIds: [...selectedIds] })}
                disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 p-1">

          {/* CPMK info */}
          {editingCpmk && (
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
              <p className="text-xs text-gray-700 leading-snug">{editingCpmk.name}</p>
              {editingCpmk.cpls.length > 0 ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-gray-400">CPL:</span>
                  {editingCpmk.cpls.map((p) => <CplBadge key={p.id} code={p.code} />)}
                </div>
              ) : (
                <p className="text-xs text-amber-600">Belum dipetakan ke CPL — petakan di halaman CPMK</p>
              )}
            </div>
          )}

          {/* Selected chips */}
          {selectedIds.size > 0 && (
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 mb-2">Terpilih ({selectedIds.size})</p>
              <div className="flex flex-wrap gap-1.5">
                {[...selectedIds].map((id) => {
                  const c = courseMap.get(id);
                  return c ? (
                    <button key={id} onClick={() => toggleCourse(id)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-white text-blue-700 border border-blue-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                      {c.code} <X size={9} />
                    </button>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="text" placeholder="Cari MK..." value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>

          {/* Course list grouped by semester */}
          <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {courses.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">Data MK belum tersedia</div>
            ) : filteredDrawerCourses.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">Tidak ada MK ditemukan</div>
            ) : (
              filteredDrawerCourses.map(([sem, list]) => (
                <div key={sem}>
                  <div className="px-4 py-2 bg-gray-50 flex items-center justify-between sticky top-0 z-10">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                      {sem === 0 ? 'Tanpa Semester' : `Semester ${sem}`}
                    </span>
                    <span className="text-[11px] text-gray-400">{list.filter((c) => selectedIds.has(c.id)).length}/{list.length} dipilih</span>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto">
                    {list.map((c) => {
                      const checked = selectedIds.has(c.id);
                      return (
                        <button key={c.id} type="button" onClick={() => toggleCourse(c.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors
                            ${checked ? 'bg-primary/5' : ''}`}>
                          <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors
                            ${checked ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                            {checked && <CheckCircle2 size={11} className="text-white fill-white" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-mono text-xs font-bold text-gray-700">{c.code}</span>
                            <span className="text-xs text-gray-500 ml-2 truncate">{c.name}</span>
                          </div>
                          {c.sks > 0 && <span className="shrink-0 text-[11px] text-gray-400">{c.sks} SKS</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </Drawer>

      {/* ─── Import Drawer ────────────────────────────────────────────────── */}
      <Drawer
        open={importOpen}
        onClose={() => { setImportOpen(false); resetImport(); }}
        title="Import Pemetaan CPMK – MK"
        footer={
          importResult ? (
            <div className="flex justify-end">
              <Button onClick={() => { setImportOpen(false); resetImport(); }}>Selesai</Button>
            </div>
          ) : importProgress ? null : importStep === 1 ? (
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => { setImportOpen(false); resetImport(); }}>Batal</Button>
              <Button onClick={() => setImportStep(2)} disabled={!curriculumId}>
                Lanjut <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => { setImportStep(1); setImportRows([]); }}>
                <ChevronLeft size={14} className="mr-1" /> Kembali
              </Button>
              <Button onClick={runImport} disabled={validCount === 0}>
                <Upload size={14} className="mr-1" /> Import {validCount} baris
              </Button>
            </div>
          )
        }
      >
        <div className="space-y-4 p-1">

          {/* Steps */}
          <div className="flex items-center gap-2 text-xs">
            {(['1. Kurikulum', '2. Upload'] as const).map((label, idx) => {
              const step = (idx + 1) as 1 | 2;
              const active = importStep === step, done = importStep > step;
              return (
                <div key={label} className="flex items-center gap-2">
                  {idx > 0 && <div className="w-6 h-px bg-gray-200" />}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium
                    ${active ? 'bg-primary text-white' : done ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                    {done ? <CheckCircle2 size={11} /> : step} {label.split('. ')[1]}
                  </div>
                </div>
              );
            })}
          </div>

          {importStep === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Pemetaan akan ditambahkan ke kurikulum aktif (tidak menghapus yang sudah ada).</p>
              {selectedCurriculum ? (
                <div className="px-3 py-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-sm font-semibold text-blue-800">{selectedCurriculum.name}</p>
                  <p className="text-xs text-blue-500 mt-0.5">Tahun {selectedCurriculum.year}</p>
                </div>
              ) : (
                <div className="px-3 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                  Belum ada kurikulum yang dipilih.
                </div>
              )}
            </div>
          )}

          {importStep === 2 && !importProgress && !importResult && (
            <div className="space-y-4">
              {allCpmks.length === 0 && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Data CPMK belum termuat</p>
                    <p className="mt-0.5">Pastikan kurikulum yang dipilih sudah benar dan halaman ini menampilkan daftar CPMK. Semua kode akan gagal validasi selama data CPMK kosong.</p>
                  </div>
                </div>
              )}
              {allCpmks.length > 0 && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
                  <CheckCircle2 size={12} className="shrink-0" />
                  {allCpmks.length} CPMK tersedia untuk validasi · Kode: {allCpmks.slice(0, 3).map(c => c.code).join(', ')}{allCpmks.length > 3 ? `, +${allCpmks.length - 3} lainnya` : ''}
                </div>
              )}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-2">Format kolom (baris 1 = header):</p>
                <table className="text-[11px] w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="px-2 py-1 text-left border border-gray-300 font-semibold">A: Kode CPMK</th>
                      <th className="px-2 py-1 text-left border border-gray-300 font-semibold">B: Kode MK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[['CPMK011', 'MKU62101'], ['CPMK011', 'MKU62102'], ['CPMK012', 'INF62123']].map(([c, m]) => (
                      <tr key={c + m} className="bg-white">
                        <td className="px-2 py-1 border border-gray-200 font-mono">{c}</td>
                        <td className="px-2 py-1 border border-gray-200 font-mono">{m}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[11px] text-gray-400 mt-1.5">Satu baris = satu pasang CPMK–MK. Kode harus sesuai data sistem.</p>
              </div>

              <input ref={importFileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />
              <button onClick={() => importFileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-primary hover:text-primary transition-colors">
                <FileSpreadsheet size={16} />
                {importRows.length > 0 ? 'Ganti File' : 'Pilih File Excel (.xlsx / .xls)'}
              </button>

              {importRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-600">
                      <span className="text-emerald-600">{validCount} valid</span>
                      {importRows.filter((r) => !r.valid).length > 0 && (
                        <span className="text-red-500 ml-2">{importRows.filter((r) => !r.valid).length} error</span>
                      )}
                    </p>
                    <p className="text-[11px] text-gray-400">{importRows.length} baris</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-y-auto max-h-60">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600 w-24">CPMK</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">MK / Error</th>
                            <th className="px-2 py-2 text-center w-8">✓</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importRows.map((row, i) => (
                            <tr key={i} className={`border-b border-gray-50 ${!row.valid ? 'bg-red-50' : ''}`}>
                              <td className="px-3 py-2 font-mono text-gray-700">{row.cpmkCode}</td>
                              <td className="px-3 py-2">
                                {row.valid
                                  ? <span className="font-mono text-gray-600">{row.courseCode}</span>
                                  : <span className="text-red-600">{row.error}</span>}
                              </td>
                              <td className="px-2 py-2 text-center">
                                {row.valid
                                  ? <CheckCircle2 size={12} className="text-emerald-500 inline" />
                                  : <XCircle size={12} className="text-red-500 inline" />}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {importProgress && !importResult && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 size={32} className="text-primary animate-spin" />
              <div className="w-full">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Menyimpan pemetaan...</span>
                  <span>{importProgress.done} / {importProgress.total} CPMK</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(importProgress.done / importProgress.total) * 100}%` }} />
                </div>
              </div>
            </div>
          )}

          {importResult && (
            <div className={`flex items-start gap-3 p-4 rounded-xl border
              ${importResult.failed.length === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <CheckCircle2 size={18} className={importResult.failed.length === 0 ? 'text-emerald-600' : 'text-yellow-600'} />
              <div>
                <p className={`text-sm font-semibold ${importResult.failed.length === 0 ? 'text-emerald-800' : 'text-yellow-800'}`}>Import selesai</p>
                <p className="text-xs mt-0.5 text-gray-600">
                  {importResult.success} CPMK berhasil dipetakan.
                  {importResult.failed.length > 0 && ` ${importResult.failed.length} gagal: ${importResult.failed.join(', ')}`}
                </p>
              </div>
            </div>
          )}

        </div>
      </Drawer>

    </div>
  );
}
