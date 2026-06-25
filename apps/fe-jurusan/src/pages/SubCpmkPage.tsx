import { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Drawer } from '@widyatama/ui';
import { useApp } from '@/contexts/AppContext';
import { subCpmkService, courseService, cpmkCourseMappingService } from '@/services/obe.service';
import type { SubCpmk, Course, CpmkMatrixRow } from '@/types';
import {
  Plus, Search, Pencil, Trash2, Download, FileSpreadsheet,
  Upload, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  Loader2, BookOpen, AlertTriangle, ToggleLeft, ToggleRight,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ImportRow {
  courseCode: string;
  cpmkCode: string;
  code: string;
  name: string;
  valid: boolean;
  error?: string;
  resolvedCourseId?: string;
  resolvedCpmkId?: string;
}

interface FormState {
  courseId: string;
  cpmkId: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = { courseId: '', cpmkId: '', code: '', name: '', description: '', isActive: true };

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SubCpmkPage() {
  const queryClient = useQueryClient();
  const { selectedCurriculum } = useApp();
  const curriculumId = selectedCurriculum?.id ?? null;

  // Table filters
  const [search, setSearch]           = useState('');
  const [filterCourseId, setFilterCourseId] = useState('');
  const [filterCpmkId, setFilterCpmkId]     = useState('');
  const [page, setPage]               = useState(1);
  const limit = 20;

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem]     = useState<SubCpmk | null>(null);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError]   = useState('');

  // Detail drawer
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<SubCpmk | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<SubCpmk | null>(null);

  // Import
  const [importOpen, setImportOpen]         = useState(false);
  const [importStep, setImportStep]         = useState<1 | 2>(1);
  const [importRows, setImportRows]         = useState<ImportRow[]>([]);
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null);
  const [importResult, setImportResult]     = useState<{ success: number; failed: string[] } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── Queries ─────────────────────────────────────────────────────────────────

  const { data: courseRes } = useQuery({
    queryKey: ['courses-all', curriculumId],
    queryFn: () => courseService.getAll({ curriculumId: curriculumId!, limit: 100, sortBy: 'code', sortOrder: 'asc' }),
    enabled: !!curriculumId,
  });
  const allCourses: Course[] = courseRes?.data ?? [];

  const { data: mappingRes } = useQuery({
    queryKey: ['cpmk-course-matrix', curriculumId],
    queryFn: () => cpmkCourseMappingService.getMatrix({ curriculumId: curriculumId! }),
    enabled: !!curriculumId,
  });

  // All CPMK rows from the mapping matrix
  const allCpmkRows: CpmkMatrixRow[] = useMemo(() => {
    if (!mappingRes?.data) return [];
    const { matrix, unmappedCpmks } = mappingRes.data;
    return [
      ...matrix.flatMap((row) => row.cpmks),
      ...unmappedCpmks,
    ];
  }, [mappingRes]);

  // CPMKs available for a given courseId (used in form)
  const cpmksForCourse = useMemo(() => {
    if (!form.courseId) return [];
    return allCpmkRows.filter((c) => c.courseIds.includes(form.courseId));
  }, [allCpmkRows, form.courseId]);

  // CPMKs for the selected filter course (used in table filter)
  const cpmksForFilterCourse = useMemo(() => {
    if (!filterCourseId) return allCpmkRows;
    return allCpmkRows.filter((c) => c.courseIds.includes(filterCourseId));
  }, [allCpmkRows, filterCourseId]);

  const { data, isLoading } = useQuery({
    queryKey: ['sub-cpmk', curriculumId, page, limit, search, filterCourseId, filterCpmkId],
    queryFn: () => subCpmkService.getAll({
      curriculumId: curriculumId!,
      page,
      limit,
      search: search || undefined,
      courseId: filterCourseId || undefined,
      cpmkId: filterCpmkId || undefined,
      sortBy: 'code',
      sortOrder: 'asc',
    }),
    enabled: !!curriculumId,
  });

  const items: SubCpmk[] = data?.data ?? [];
  const total: number    = data?.meta?.total ?? 0;
  const totalPages       = Math.ceil(total / limit);

  // Course name lookup for the table
  const courseById = useMemo(() => {
    const map = new Map<string, Course>();
    for (const c of allCourses) map.set(c.id, c);
    return map;
  }, [allCourses]);

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      editItem
        ? subCpmkService.update(editItem.id, payload)
        : subCpmkService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-cpmk'] });
      setDrawerOpen(false);
      showToast('success', editItem ? 'Sub CPMK berhasil diperbarui.' : 'Sub CPMK berhasil ditambahkan.');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? 'Gagal menyimpan. Periksa kembali data Anda.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subCpmkService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-cpmk'] });
      setDeleteTarget(null);
      showToast('success', 'Sub CPMK berhasil dihapus.');
    },
    onError: () => showToast('error', 'Gagal menghapus Sub CPMK.'),
  });

  // ─── Form handlers ───────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setDrawerOpen(true);
  };

  const openEdit = (item: SubCpmk) => {
    setEditItem(item);
    setForm({
      courseId: item.courseId,
      cpmkId: item.cpmkId,
      code: item.code,
      name: item.name,
      description: item.description ?? '',
      isActive: item.isActive,
    });
    setFormError('');
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!form.courseId)    { setFormError('Pilih Mata Kuliah terlebih dahulu.'); return; }
    if (!form.cpmkId)      { setFormError('Pilih CPMK terlebih dahulu.'); return; }
    if (!form.code.trim()) { setFormError('Kode wajib diisi.'); return; }
    if (!form.name.trim()) { setFormError('Isi Sub CPMK wajib diisi.'); return; }
    if (!curriculumId)     { setFormError('Pilih kurikulum terlebih dahulu.'); return; }
    setFormError('');
    saveMutation.mutate({
      curriculumId,
      courseId: form.courseId,
      cpmkId: form.cpmkId,
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      isActive: form.isActive,
    });
  };

  // ─── Import ───────────────────────────────────────────────────────────────────

  const courseByCode = useMemo(() => {
    const map = new Map<string, Course>();
    for (const c of allCourses) map.set(c.code.toLowerCase(), c);
    return map;
  }, [allCourses]);

  const cpmkByCode = useMemo(() => {
    const map = new Map<string, CpmkMatrixRow>();
    for (const c of allCpmkRows) map.set(c.code.toLowerCase(), c);
    return map;
  }, [allCpmkRows]);

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
        // seen: Map<courseId+cpmkId, Set<code>>
        const seen = new Map<string, Set<string>>();
        const parsed: ImportRow[] = rows.slice(1)
          .map((row) => ({
            courseCode: String((row as unknown[])[0] ?? '').trim(),
            cpmkCode:   String((row as unknown[])[1] ?? '').trim(),
            code:       String((row as unknown[])[2] ?? '').trim(),
            name:       String((row as unknown[])[3] ?? '').trim(),
            valid: false,
          }))
          .filter((r) => r.courseCode || r.cpmkCode || r.code || r.name)
          .map((r) => {
            if (!r.courseCode) return { ...r, error: 'Kode MK tidak boleh kosong' };
            if (!r.cpmkCode)   return { ...r, error: 'Kode CPMK tidak boleh kosong' };
            if (!r.code)       return { ...r, error: 'Kode Sub CPMK tidak boleh kosong' };
            if (!r.name)       return { ...r, error: 'Isi Sub CPMK tidak boleh kosong' };

            const course = courseByCode.get(r.courseCode.toLowerCase());
            if (!course) return { ...r, error: `MK "${r.courseCode}" tidak ada dalam kurikulum` };

            const cpmk = cpmkByCode.get(r.cpmkCode.toLowerCase());
            if (!cpmk) return { ...r, error: `CPMK "${r.cpmkCode}" tidak ada dalam kurikulum` };

            if (!cpmk.courseIds.includes(course.id)) {
              return { ...r, error: `CPMK "${r.cpmkCode}" tidak dipetakan ke MK "${r.courseCode}"` };
            }

            const seenKey = `${course.id}|${cpmk.id}`;
            const codesInGroup = seen.get(seenKey) ?? new Set<string>();
            if (codesInGroup.has(r.code.toLowerCase())) {
              return { ...r, error: `Duplikat kode "${r.code}" untuk MK+CPMK ini dalam file` };
            }
            codesInGroup.add(r.code.toLowerCase());
            seen.set(seenKey, codesInGroup);

            return { ...r, valid: true, resolvedCourseId: course.id, resolvedCpmkId: cpmk.id };
          });
        setImportRows(parsed);
      } catch { showToast('error', 'Gagal membaca file Excel.'); }
    };
    reader.readAsArrayBuffer(file);
    if (importFileRef.current) importFileRef.current.value = '';
  };

  const runImport = async () => {
    if (!curriculumId) return;
    const valid = importRows.filter((r) => r.valid && r.resolvedCourseId && r.resolvedCpmkId);
    setImportProgress({ done: 0, total: valid.length });
    const failed: string[] = [];
    let done = 0;
    for (const row of valid) {
      try {
        await subCpmkService.create({
          curriculumId,
          courseId: row.resolvedCourseId!,
          cpmkId: row.resolvedCpmkId!,
          code: row.code,
          name: row.name,
          isActive: true,
        });
        done++;
      } catch { failed.push(`${row.courseCode}/${row.cpmkCode}/${row.code}`); }
      setImportProgress({ done, total: valid.length });
    }
    setImportResult({ success: done, failed });
    queryClient.invalidateQueries({ queryKey: ['sub-cpmk'] });
  };

  // ─── Export ───────────────────────────────────────────────────────────────────

  const handleExport = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Kode MK', 'Kode CPMK', 'Kode Sub CPMK', 'Isi Sub CPMK', 'Deskripsi', 'Status'],
      ...items.map((i) => [
        courseById.get(i.courseId)?.code ?? i.courseId,
        i.cpmk.code, i.code, i.name, i.description ?? '',
        i.isActive ? 'Aktif' : 'Nonaktif',
      ]),
    ]);
    ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 80 }, { wch: 60 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sub CPMK');
    XLSX.writeFile(wb, `sub-cpmk-${selectedCurriculum?.year ?? 'all'}.xlsx`);
  };

  const handleTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Kode MK', 'Kode CPMK', 'Kode Sub CPMK', 'Isi Sub CPMK'],
      ['MK001', 'CPMK01', 'SCPMK011', 'Mampu mengidentifikasi kebutuhan pengguna dalam perancangan sistem'],
      ['MK001', 'CPMK01', 'SCPMK012', 'Mampu membuat diagram alur proses bisnis secara terstruktur'],
      ['MK001', 'CPMK02', 'SCPMK021', 'Mampu menerapkan konsep OOP dalam pembuatan aplikasi'],
    ]);
    ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 80 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template-sub-cpmk.xlsx');
  };

  const validCount = importRows.filter((r) => r.valid).length;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toast.text}
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
          <h1 className="text-2xl font-bold text-gray-900">Master Sub CPMK</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedCurriculum
              ? `Kurikulum ${selectedCurriculum.name} · ${selectedCurriculum.year}`
              : 'Pilih kurikulum untuk menampilkan data'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button onClick={handleTemplate}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm">
            <Download size={14} /> Template
          </button>
          <button onClick={handleExport} disabled={items.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm disabled:opacity-40">
            <FileSpreadsheet size={14} /> Export
          </button>
          <button onClick={() => { resetImport(); setImportOpen(true); }} disabled={!curriculumId}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm disabled:opacity-40">
            <Upload size={14} /> Import
          </button>
          <Button onClick={openCreate} disabled={!curriculumId}>
            <Plus size={14} className="mr-1.5" /> Tambah Sub CPMK
          </Button>
        </div>
      </div>

      {/* Stats */}
      {curriculumId && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-6">
          <div>
            <p className="text-2xl font-bold text-primary">{total}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Sub CPMK</p>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div>
            <p className="text-2xl font-bold text-emerald-600">
              {data?.data?.filter((i) => i.isActive).length ?? 0}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Aktif</p>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div>
            <p className="text-2xl font-bold text-blue-600">{allCourses.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Mata Kuliah</p>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      {curriculumId && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari kode atau isi..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            />
          </div>
          <select
            value={filterCourseId}
            onChange={(e) => { setFilterCourseId(e.target.value); setFilterCpmkId(''); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
          >
            <option value="">Semua Mata Kuliah</option>
            {allCourses.map((c) => (
              <option key={c.id} value={c.id}>{c.code} – {c.name.length > 35 ? c.name.slice(0, 35) + '…' : c.name}</option>
            ))}
          </select>
          {filterCourseId && (
            <select
              value={filterCpmkId}
              onChange={(e) => { setFilterCpmkId(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            >
              <option value="">Semua CPMK</option>
              {cpmksForFilterCourse.map((c) => (
                <option key={c.id} value={c.id}>{c.code}</option>
              ))}
            </select>
          )}
          {(search || filterCourseId || filterCpmkId) && (
            <button onClick={() => { setSearch(''); setFilterCourseId(''); setFilterCpmkId(''); setPage(1); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Reset filter
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-gray-400">
            <Loader2 size={20} className="animate-spin" /> Memuat data...
          </div>
        ) : !curriculumId ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">
            Pilih kurikulum untuk menampilkan Sub CPMK
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400">
            <BookOpen size={28} className="opacity-40" />
            <p className="text-sm">
              {search || filterCourseId || filterCpmkId
                ? 'Tidak ada Sub CPMK yang cocok dengan filter'
                : 'Belum ada Sub CPMK. Klik Tambah atau Import untuk memulai.'}
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">MK</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">CPMK</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">Kode Sub CPMK</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Isi Sub CPMK</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const course = courseById.get(item.courseId);
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => { setDetailItem(item); setDetailOpen(true); }}
                    >
                      <td className="px-4 py-3 text-xs text-gray-400">{(page - 1) * limit + i + 1}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded" title={course?.name}>
                          {course?.code ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary">
                          {item.cpmk.code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                          {item.code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[350px]">
                        <p className="line-clamp-2 leading-snug">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium
                          ${item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                          {item.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setDeleteTarget(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  {(page - 1) * limit + 1}–{Math.min(page * limit, total)} dari {total} Sub CPMK
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pg = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button key={pg} onClick={() => setPage(pg)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors
                          ${pg === page ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                        {pg}
                      </button>
                    );
                  })}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Form Drawer ──────────────────────────────────────────────────── */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editItem ? 'Edit Sub CPMK' : 'Tambah Sub CPMK'}
        description={editItem ? `Edit kode ${editItem.code}` : 'Pilih Mata Kuliah dan CPMK terlebih dahulu'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? <><Loader2 size={14} className="animate-spin mr-1.5" />Menyimpan...</>
                : editItem ? 'Simpan Perubahan' : 'Tambah Sub CPMK'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-1">
          {formError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <XCircle size={14} className="shrink-0" /> {formError}
            </div>
          )}

          {/* Step 1: Mata Kuliah */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Mata Kuliah <span className="text-red-500">*</span>
            </label>
            {allCourses.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                <AlertTriangle size={13} className="shrink-0" />
                Tidak ada mata kuliah dalam kurikulum ini.
              </div>
            ) : (
              <select
                value={form.courseId}
                onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value, cpmkId: '' }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="">-- Pilih Mata Kuliah --</option>
                {allCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} – {c.name.length > 55 ? c.name.slice(0, 55) + '…' : c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Step 2: CPMK (filtered by course) */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              CPMK <span className="text-red-500">*</span>
            </label>
            {!form.courseId ? (
              <div className="px-3 py-2 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-xl">
                Pilih Mata Kuliah terlebih dahulu
              </div>
            ) : cpmksForCourse.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                <AlertTriangle size={13} className="shrink-0" />
                Tidak ada CPMK yang dipetakan ke mata kuliah ini.
              </div>
            ) : (
              <select
                value={form.cpmkId}
                onChange={(e) => setForm((f) => ({ ...f, cpmkId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="">-- Pilih CPMK --</option>
                {cpmksForCourse.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} – {c.name.length > 55 ? c.name.slice(0, 55) + '…' : c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Kode */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Kode Sub CPMK <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="cth: SCPMK011"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
            />
            <p className="text-[11px] text-gray-400 mt-1">Kode unik dalam satu MK + CPMK</p>
          </div>

          {/* Isi */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Isi Sub CPMK <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="cth: Mampu mengidentifikasi kebutuhan pengguna dalam perancangan sistem..."
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Deskripsi <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <textarea
              placeholder="Deskripsi tambahan..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Status Aktif</p>
              <p className="text-xs text-gray-400 mt-0.5">Sub CPMK nonaktif tidak ditampilkan di penilaian</p>
            </div>
            <button onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
              className={`transition-colors ${form.isActive ? 'text-emerald-500' : 'text-gray-300'}`}>
              {form.isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
          </div>
        </div>
      </Drawer>

      {/* ─── Detail Drawer ────────────────────────────────────────────────── */}
      <Drawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Detail Sub CPMK"
        footer={
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => { setDetailOpen(false); detailItem && setDeleteTarget(detailItem); }}>
              <Trash2 size={14} className="mr-1.5 text-red-500" /> Hapus
            </Button>
            <Button onClick={() => { setDetailOpen(false); detailItem && openEdit(detailItem); }}>
              <Pencil size={14} className="mr-1.5" /> Edit
            </Button>
          </div>
        }
      >
        {detailItem && (() => {
          const course = courseById.get(detailItem.courseId);
          return (
            <div className="space-y-4 p-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {course?.code ?? '—'}
                </span>
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary">
                  {detailItem.cpmk.code}
                </span>
                <span className="font-mono text-sm font-bold bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg">
                  {detailItem.code}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                  ${detailItem.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${detailItem.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  {detailItem.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              {course && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">Mata Kuliah</p>
                  <p className="text-sm font-semibold text-gray-800">{course.code}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{course.name}</p>
                </div>
              )}

              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-xs font-semibold text-primary/70 uppercase tracking-wide mb-1">CPMK</p>
                <p className="text-sm font-semibold text-gray-800">{detailItem.cpmk.code}</p>
                <p className="text-xs text-gray-500 mt-0.5">{detailItem.cpmk.name}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Isi Sub CPMK</p>
                <p className="text-sm text-gray-800 leading-relaxed">{detailItem.name}</p>
              </div>

              {detailItem.description && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Deskripsi</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{detailItem.description}</p>
                </div>
              )}

            </div>
          );
        })()}
      </Drawer>

      {/* ─── Delete Confirm ───────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Hapus Sub CPMK</p>
                <p className="text-xs text-gray-500 mt-0.5">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Hapus Sub CPMK <strong className="font-mono">{deleteTarget.code}</strong> (CPMK{' '}
              <strong>{deleteTarget.cpmk.code}</strong>, MK{' '}
              <strong>{courseById.get(deleteTarget.courseId)?.code ?? '—'}</strong>)?
              Semua data penilaian yang terkait juga akan terhapus.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Import Drawer ────────────────────────────────────────────────── */}
      <Drawer
        open={importOpen}
        onClose={() => { setImportOpen(false); resetImport(); }}
        title="Import Sub CPMK"
        footer={
          importResult ? (
            <div className="flex justify-end">
              <Button onClick={() => { setImportOpen(false); resetImport(); }}>Selesai</Button>
            </div>
          ) : importProgress ? null : importStep === 1 ? (
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => { setImportOpen(false); resetImport(); }}>Batal</Button>
              <Button onClick={() => setImportStep(2)} disabled={allCourses.length === 0 || allCpmkRows.length === 0}>
                Lanjut <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => { setImportStep(1); setImportRows([]); }}>
                <ChevronLeft size={14} className="mr-1" /> Kembali
              </Button>
              <Button onClick={runImport} disabled={validCount === 0}>
                <CheckCircle2 size={14} className="mr-1" /> Import {validCount} Sub CPMK
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
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-sm font-semibold text-blue-800">{selectedCurriculum?.name}</p>
                <p className="text-xs text-blue-500 mt-0.5">Tahun {selectedCurriculum?.year}</p>
              </div>
              {allCourses.length > 0 ? (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700">
                  <CheckCircle2 size={13} className="shrink-0" />
                  {allCourses.length} MK · {allCpmkRows.length} CPMK tersedia
                </div>
              ) : (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  Tidak ada mata kuliah atau CPMK. Lengkapi data kurikulum terlebih dahulu.
                </div>
              )}
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 flex gap-2">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                Import hanya menambahkan data baru. Kode yang sudah ada tidak akan ditimpa.
              </div>
            </div>
          )}

          {importStep === 2 && !importProgress && !importResult && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-2">Format kolom (baris 1 = header):</p>
                <table className="text-[11px] w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="px-2 py-1 text-left border border-gray-300 font-semibold">A: Kode MK</th>
                      <th className="px-2 py-1 text-left border border-gray-300 font-semibold">B: Kode CPMK</th>
                      <th className="px-2 py-1 text-left border border-gray-300 font-semibold">C: Kode Sub CPMK</th>
                      <th className="px-2 py-1 text-left border border-gray-300 font-semibold">D: Isi Sub CPMK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['MK001', 'CPMK01', 'SCPMK011', 'Mampu mengidentifikasi kebutuhan pengguna'],
                      ['MK001', 'CPMK02', 'SCPMK021', 'Mampu menerapkan konsep OOP'],
                    ].map(([a, b, c, d]) => (
                      <tr key={c} className="bg-white">
                        <td className="px-2 py-1 border border-gray-200 font-mono">{a}</td>
                        <td className="px-2 py-1 border border-gray-200 font-mono">{b}</td>
                        <td className="px-2 py-1 border border-gray-200 font-mono">{c}</td>
                        <td className="px-2 py-1 border border-gray-200">{d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[11px] text-gray-500 mt-2">
                  CPMK harus sudah dipetakan ke MK tersebut (via Mapping CPMK-MK)
                </p>
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
                    <div className="overflow-y-auto max-h-56">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-2 py-2 text-left font-semibold text-gray-600 w-16">MK</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-600 w-20">CPMK</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-600 w-24">Kode</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-600">Isi / Error</th>
                            <th className="px-2 py-2 text-center w-8">✓</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importRows.map((row, i) => (
                            <tr key={i} className={`border-b border-gray-50 ${!row.valid ? 'bg-red-50' : ''}`}>
                              <td className="px-2 py-2 font-mono">{row.courseCode || '—'}</td>
                              <td className="px-2 py-2 font-mono">{row.cpmkCode || '—'}</td>
                              <td className="px-2 py-2 font-mono">{row.code || '—'}</td>
                              <td className="px-2 py-2">
                                {row.valid
                                  ? <span className="text-gray-600 line-clamp-1">{row.name}</span>
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
                  <span>Mengimpor Sub CPMK...</span>
                  <span>{importProgress.done} / {importProgress.total}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all"
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
                <p className="text-sm font-semibold">{importResult.success} Sub CPMK berhasil diimpor</p>
                {importResult.failed.length > 0 && (
                  <p className="text-xs mt-0.5 text-gray-600">
                    {importResult.failed.length} gagal: {importResult.failed.join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Drawer>

    </div>
  );
}
