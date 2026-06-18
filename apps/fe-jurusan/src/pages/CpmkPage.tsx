import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Input, Button, Drawer } from '@widyatama/ui';
import type { DataTableOptions, Header } from '@widyatama/ui';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { cpmkService, cplService } from '@/services/obe.service';
import { useApp } from '@/contexts/AppContext';
import type { Cpmk, CpmkDetail, Cpl } from '@/types';
import {
  Search, Plus, Pencil, Trash2, BookOpen, Link2,
  CheckCircle2, XCircle, FileSpreadsheet,
  Upload, ChevronLeft, ChevronRight, Loader2, Download, Eye,
} from 'lucide-react';

// ─── Schema ────────────────────────────────────────────────────────────────────

const cpmkFormSchema = z.object({
  code:        z.string().min(1, 'Kode CPMK wajib diisi').max(50),
  name:        z.string().min(3, 'Isi CPMK minimal 3 karakter').max(1000),
  description: z.string().optional(),
  isActive:    z.boolean().default(true),
});

type CpmkFormData = z.infer<typeof cpmkFormSchema>;

// ─── Import Types ──────────────────────────────────────────────────────────────

interface ImportRow {
  code:    string;
  name:    string;
  valid:   boolean;
  error?:  string;
}

const LABEL_CLS = 'block text-sm font-medium text-gray-700 mb-1.5';

function truncate(text: string | null | undefined, max = 100) {
  if (!text) return '—';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CpmkPage() {
  const queryClient = useQueryClient();
  const { selectedCurriculum } = useApp();

  const curriculumId = selectedCurriculum?.id ?? null;

  const [search, setSearch]   = useState('');
  const debouncedSearch       = useDebounce(search);
  const [filterActive, setFilterActive] = useState('');
  const [options, setOptions] = useState<DataTableOptions<Cpmk>>({
    page: 1, itemsPerPage: 10, sortBy: 'code' as keyof Cpmk, sortDesc: false,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [apiError, setApiError]     = useState<string | null>(null);

  const [detailOpen, setDetailOpen]       = useState(false);
  const [detailItem, setDetailItem]       = useState<CpmkDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [cplMapOpen, setCplMapOpen]       = useState(false);
  const [mappingCpmkId, setMappingCpmkId] = useState<string | null>(null);
  const [mappingDetail, setMappingDetail] = useState<CpmkDetail | null>(null);
  const [newCplId, setNewCplId]           = useState('');
  const [newCplWeight, setNewCplWeight]   = useState(50);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId]                   = useState<string | null>(null);
  const [toastMsg, setToastMsg]                   = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Import
  const [importOpen, setImportOpen]         = useState(false);
  const [importStep, setImportStep]         = useState<1 | 2>(1);
  const [importRows, setImportRows]         = useState<ImportRow[]>([]);
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null);
  const [importResult, setImportResult]     = useState<{ success: number; failed: string[] } | null>(null);
  const importFileRef                       = useRef<HTMLInputElement>(null);

  // ─── Form ──────────────────────────────────────────────────────────────────

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors },
  } = useForm<CpmkFormData>({
    resolver: zodResolver(cpmkFormSchema),
    mode: 'onChange',
    defaultValues: { code: '', name: '', description: '', isActive: true },
  });

  const isActiveValue = watch('isActive');

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['cpmk', options.page, options.itemsPerPage, debouncedSearch, filterActive, curriculumId, String(options.sortBy), options.sortDesc],
    queryFn: () => cpmkService.getAll({
      page:         options.page,
      limit:        options.itemsPerPage,
      search:       debouncedSearch || undefined,
      curriculumId: curriculumId ?? undefined,
      isActive:     filterActive === '' ? undefined : filterActive === 'true',
      sortBy:       String(options.sortBy),
      sortOrder:    options.sortDesc ? 'desc' : 'asc',
    }),
  });

  const total = data?.meta?.total ?? 0;

  const { data: cplData } = useQuery({
    queryKey: ['cpl', selectedCurriculum?.year],
    queryFn: () => cplService.getAll({ limit: 100, curriculumYear: selectedCurriculum?.year }),
  });

  const cpls: Cpl[] = cplData?.data ?? [];

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => cpmkService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpmk'] });
      setDrawerOpen(false);
      resetForm();
      showToast('success', 'CPMK berhasil dibuat.');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal menyimpan data';
      setApiError(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      cpmkService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpmk'] });
      setDrawerOpen(false);
      resetForm();
      showToast('success', 'CPMK berhasil diperbarui.');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal memperbarui data';
      setApiError(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cpmkService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpmk'] });
      setConfirmDeleteOpen(false);
      showToast('success', 'CPMK berhasil dihapus.');
    },
    onError: (err: unknown) => {
      setConfirmDeleteOpen(false);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal menghapus data.';
      showToast('error', msg);
    },
  });

  const mapCplMutation = useMutation({
    mutationFn: ({ id, cpls: mappings }: { id: string; cpls: { cplId: string; weight: number }[] }) =>
      cpmkService.mapCpl(id, mappings),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['cpmk'] });
      cpmkService.getById(id).then((r) => setMappingDetail(r.data)).catch(() => {});
      setNewCplId('');
      setNewCplWeight(50);
      showToast('success', 'CPL berhasil dipetakan ke CPMK.');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal mapping CPL.';
      showToast('error', msg);
    },
  });

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const resetForm = () => {
    reset({ code: '', name: '', description: '', isActive: true });
    setApiError(null);
    setEditingId(null);
  };

  const openCreate = () => {
    if (!curriculumId) { showToast('error', 'Pilih kurikulum terlebih dahulu.'); return; }
    resetForm();
    setDrawerOpen(true);
  };

  const openEdit = (row: Cpmk) => {
    setEditingId(row.id);
    reset({
      code:        row.code,
      name:        row.name,
      description: row.description ?? '',
      isActive:    row.isActive,
    });
    setApiError(null);
    setDrawerOpen(true);
  };

  const openDetail = async (row: Cpmk) => {
    setDetailLoading(true);
    setDetailItem(null);
    setDetailOpen(true);
    try {
      const res = await cpmkService.getById(row.id);
      setDetailItem(res.data);
    } catch { setDetailItem(null); }
    finally { setDetailLoading(false); }
  };

  const openCplMapping = async (row: Cpmk) => {
    setMappingCpmkId(row.id);
    setMappingDetail(null);
    setNewCplId('');
    setNewCplWeight(50);
    setCplMapOpen(true);
    try {
      const res = await cpmkService.getById(row.id);
      setMappingDetail(res.data);
    } catch {}
  };

  const onSubmit = (formData: CpmkFormData) => {
    if (!curriculumId) { setApiError('Pilih kurikulum terlebih dahulu.'); return; }
    const payload: Record<string, unknown> = {
      curriculumId,
      code:        formData.code.trim(),
      name:        formData.name.trim(),
      description: formData.description?.trim() || undefined,
      isActive:    formData.isActive,
    };
    if (editingId) updateMutation.mutate({ id: editingId, payload });
    else createMutation.mutate(payload);
  };

  // ─── Import ────────────────────────────────────────────────────────────────

  const resetImport = () => {
    setImportStep(1);
    setImportRows([]);
    setImportProgress(null);
    setImportResult(null);
    if (importFileRef.current) importFileRef.current.value = '';
  };

  const handleImportXlsx = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb   = XLSX.read(new Uint8Array(evt.target?.result as ArrayBuffer), { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // Format: kode CPMK | isi CPMK
        const seenCodes = new Set<string>();
        const parsed: ImportRow[] = rows
          .slice(1)
          .map((row) => ({
            code:  String((row as unknown[])[0] ?? '').trim(),
            name:  String((row as unknown[])[1] ?? '').trim(),
            valid: false,
          }))
          .filter((r) => r.code)
          .map((r) => {
            if (!r.name)              return { ...r, valid: false, error: 'Isi CPMK wajib diisi' };
            if (seenCodes.has(r.code)) return { ...r, valid: false, error: 'Kode duplikat dalam file' };
            seenCodes.add(r.code);
            return { ...r, valid: true };
          });

        setImportRows(parsed);
      } catch {
        showToast('error', 'Gagal membaca file. Pastikan format file benar.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (importFileRef.current) importFileRef.current.value = '';
  };

  const runImport = async () => {
    if (!curriculumId) { showToast('error', 'Pilih kurikulum terlebih dahulu.'); return; }
    const valid = importRows.filter((r) => r.valid);
    setImportProgress({ done: 0, total: valid.length });
    setImportResult(null);
    const failed: string[] = [];
    for (let i = 0; i < valid.length; i++) {
      const row = valid[i];
      try {
        await cpmkService.create({ curriculumId, code: row.code, name: row.name });
      } catch {
        failed.push(row.code);
      }
      setImportProgress({ done: i + 1, total: valid.length });
    }
    setImportResult({ success: valid.length - failed.length, failed });
    queryClient.invalidateQueries({ queryKey: ['cpmk'] });
  };

  const validImportCount = importRows.filter((r) => r.valid).length;

  // ─── Export ────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    try {
      const res = await cpmkService.getAll({
        curriculumId: curriculumId ?? undefined,
        limit: 1000, page: 1, sortBy: 'code', sortOrder: 'asc',
      });
      const rows = (res.data ?? []).map((r) => ({
        'Kode CPMK': r.code,
        'Isi CPMK':  r.name,
        'Keterangan': r.description ?? '',
        'Status':    r.isActive ? 'Aktif' : 'Nonaktif',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wch: 14 }, { wch: 60 }, { wch: 30 }, { wch: 10 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'CPMK');
      XLSX.writeFile(wb, `cpmk-${selectedCurriculum?.year ?? 'all'}.xlsx`);
    } catch {
      showToast('error', 'Gagal mengekspor data.');
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['kode CPMK', 'isi CPMK'],
      ['CPMK011', 'Mampu menunjukkan perilaku yang mencerminkan internalisasi nilai spiritual dan etika dalam pelaksanaan tugas profesional'],
      ['CPMK012', 'Mampu menunjukkan sikap toleransi dan menghargai perbedaan pendapat dalam lingkungan kerja yang multikultural'],
      ['CPMK021', 'Mampu berkolaborasi secara efektif dalam tim multidisiplin untuk menyelesaikan proyek teknologi informasi'],
    ]);
    ws['!cols'] = [{ wch: 12 }, { wch: 70 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template CPMK');
    XLSX.writeFile(wb, 'template-cpmk.xlsx');
  };

  // ─── Table Headers ──────────────────────────────────────────────────────────

  const headers: Header<Cpmk>[] = [
    {
      key: 'code', title: 'Kode CPMK', sortable: true,
      render: (row) => (
        <span
          className="font-mono text-xs font-bold text-primary cursor-pointer hover:underline"
          onClick={() => openDetail(row)}
        >
          {row.code}
        </span>
      ),
    },
    {
      key: 'name', title: 'Isi CPMK', sortable: true,
      render: (row) => (
        <div className="cursor-pointer max-w-[380px]" onClick={() => openDetail(row)}>
          <p className="text-sm text-gray-800 hover:text-primary line-clamp-2 leading-snug">{row.name}</p>
        </div>
      ),
    },
    {
      key: 'totalCpl' as keyof Cpmk, title: 'CPL',
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
          ${row.totalCpl > 0 ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
          {row.totalCpl} CPL
        </span>
      ),
    },
    {
      key: 'isActive', title: 'Status',
      render: (row) => (
        row.isActive
          ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Aktif</span>
          : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Nonaktif</span>
      ),
    },
    {
      key: 'id', title: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openDetail(row); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
            title="Detail"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openCplMapping(row); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Mapping CPL"
          >
            <Link2 size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); setConfirmDeleteOpen(true); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Hapus"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toastMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toastMsg.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toastMsg.text}
        </div>
      )}

      {/* No curriculum banner */}
      {!curriculumId && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-700">
          <BookOpen size={18} className="shrink-0" />
          Pilih kurikulum terlebih dahulu melalui dropdown di header untuk melihat data CPMK.
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master CPMK</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedCurriculum
              ? `Kurikulum: ${selectedCurriculum.name} · ${selectedCurriculum.year}`
              : 'Pilih kurikulum untuk menampilkan data'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download size={15} /> Template
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <FileSpreadsheet size={15} /> Export
          </button>
          <button
            onClick={() => { resetImport(); setImportOpen(true); }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Upload size={15} /> Import
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus size={15} /> Tambah CPMK
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><BookOpen size={20} /></div>
        <div>
          <p className="text-2xl font-bold text-gray-800">{total}</p>
          <p className="text-xs text-gray-500">Total CPMK{selectedCurriculum ? ` · Kurikulum ${selectedCurriculum.year}` : ''}</p>
        </div>
      </div>

      {/* Filter + Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari kode atau isi CPMK..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
          >
            <option value="">Semua Status</option>
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable
          headers={headers}
          items={data?.data ?? []}
          totalItems={total}
          loading={isLoading}
          options={options}
          onOptionsChange={setOptions}
        />
      </div>

      {/* ─── Create / Edit Drawer ────────────────────────────────────────── */}
      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); resetForm(); }}
        title={editingId ? 'Edit CPMK' : 'Tambah CPMK'}
        description={selectedCurriculum ? `Kurikulum: ${selectedCurriculum.name} · ${selectedCurriculum.year}` : undefined}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setDrawerOpen(false); resetForm(); }}>Batal</Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah CPMK'}
            </Button>
          </div>
        }
      >
        <div className="space-y-5 p-1">

          {apiError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <XCircle size={15} className="shrink-0" /> {apiError}
            </div>
          )}

          <div>
            <label className={LABEL_CLS}>Kode CPMK <span className="text-red-500">*</span></label>
            <Input
              {...register('code')}
              placeholder="CPMK011"
              className={errors.code ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}
            />
            {errors.code && <p className="text-xs text-red-500 mt-1">❌ {errors.code.message}</p>}
            <p className="text-xs text-gray-400 mt-1">Contoh: CPMK011, CPMK021, CPMK031</p>
          </div>

          <div>
            <label className={LABEL_CLS}>Isi CPMK <span className="text-red-500">*</span></label>
            <textarea
              {...register('name')}
              placeholder="Mampu menunjukkan perilaku yang mencerminkan..."
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none
                ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">❌ {errors.name.message}</p>}
          </div>

          <div>
            <label className={LABEL_CLS}>Keterangan <span className="text-gray-400 font-normal">(opsional)</span></label>
            <textarea
              {...register('description')}
              placeholder="Catatan atau keterangan tambahan..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Status Aktif</label>
            <button
              type="button"
              onClick={() => setValue('isActive', !isActiveValue)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none
                ${isActiveValue ? 'bg-primary' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform
                ${isActiveValue ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-xs text-gray-500">{isActiveValue ? 'Aktif' : 'Nonaktif'}</span>
          </div>

        </div>
      </Drawer>

      {/* ─── Detail Drawer ───────────────────────────────────────────────── */}
      <Drawer
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailItem(null); }}
        title="Detail CPMK"
        footer={detailItem ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setDetailOpen(false); if (detailItem) openEdit(detailItem as unknown as Cpmk); }}>
              <Pencil size={14} className="mr-1" /> Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => { if (detailItem) { setDeleteId(detailItem.id); setConfirmDeleteOpen(true); setDetailOpen(false); } }}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 size={14} className="mr-1" /> Hapus
            </Button>
          </div>
        ) : undefined}
      >
        {detailLoading ? (
          <div className="flex items-center justify-center h-32 gap-2 text-gray-400">
            <Loader2 size={20} className="animate-spin" /> Memuat...
          </div>
        ) : detailItem ? (
          <div className="space-y-5 p-1">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <BookOpen size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 font-mono mb-1">{detailItem.code}</p>
                <p className="text-sm font-medium text-gray-800 leading-snug">{detailItem.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  {detailItem.isActive
                    ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Aktif</span>
                    : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Nonaktif</span>
                  }
                </div>
              </div>
            </div>

            {detailItem.description && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-medium text-gray-400 mb-1">Keterangan</p>
                <p className="text-sm text-gray-700">{detailItem.description}</p>
              </div>
            )}

            {detailItem.cpls && detailItem.cpls.length > 0 ? (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">CPL yang Dipetakan</p>
                <div className="space-y-2">
                  {detailItem.cpls.map((cpl) => (
                    <div key={cpl.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-blue-800">{cpl.code}</span>
                        <p className="text-xs text-blue-600 mt-0.5 line-clamp-2">{cpl.name}</p>
                      </div>
                      <span className="text-sm font-bold text-blue-700 shrink-0 ml-2">{cpl.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                Belum ada CPL yang dipetakan. Gunakan tombol Link untuk menambahkan.
              </div>
            )}

            <div className="text-xs text-gray-400 border-t pt-3">
              Dibuat: {new Date(detailItem.createdAt).toLocaleString('id-ID')}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Data tidak ditemukan</div>
        )}
      </Drawer>

      {/* ─── CPL Mapping Drawer ──────────────────────────────────────────── */}
      <Drawer
        open={cplMapOpen}
        onClose={() => { setCplMapOpen(false); setMappingDetail(null); setMappingCpmkId(null); }}
        title="Mapping CPL ke CPMK"
        description={mappingDetail ? `${mappingDetail.code}` : undefined}
      >
        <div className="space-y-5 p-1">

          {!mappingDetail && (
            <div className="flex items-center justify-center h-16 gap-2 text-gray-400 text-sm">
              <Loader2 size={16} className="animate-spin" /> Memuat...
            </div>
          )}

          {mappingDetail && (
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
              <p className="text-xs text-gray-400 font-mono">{mappingDetail.code}</p>
              <p className="text-sm text-gray-700 mt-0.5 line-clamp-3">{mappingDetail.name}</p>
            </div>
          )}

          {mappingDetail?.cpls && mappingDetail.cpls.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">CPL Termap</p>
              <div className="space-y-2">
                {mappingDetail.cpls.map((cpl) => (
                  <div key={cpl.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-blue-800">{cpl.code}</span>
                      <p className="text-xs text-blue-600 mt-0.5 line-clamp-1">{cpl.name}</p>
                    </div>
                    <span className="text-sm font-bold text-blue-700 shrink-0 ml-2">{cpl.weight}%</span>
                  </div>
                ))}
                <p className="text-xs text-gray-400 text-right">
                  Total bobot: {mappingDetail.cpls.reduce((s, c) => s + c.weight, 0)}%
                </p>
              </div>
            </div>
          )}

          {mappingDetail && (!mappingDetail.cpls || mappingDetail.cpls.length === 0) && (
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-500 text-center">
              Belum ada CPL yang dipetakan
            </div>
          )}

          <div className="border-t pt-4 space-y-4">
            <p className="text-sm font-semibold text-gray-700">Tambah Mapping CPL</p>

            <div>
              <label className={LABEL_CLS}>Pilih CPL</label>
              <select
                value={newCplId}
                onChange={(e) => setNewCplId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              >
                <option value="">Pilih CPL...</option>
                {cpls
                  .filter((c) => !mappingDetail?.cpls?.some((m) => m.id === c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.code} – {c.name}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLS}>Bobot (%)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={newCplWeight}
                onChange={(e) => setNewCplWeight(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <Button
              disabled={!newCplId || !mappingCpmkId || mapCplMutation.isPending}
              onClick={() => {
                if (mappingCpmkId && newCplId) {
                  mapCplMutation.mutate({ id: mappingCpmkId, cpls: [{ cplId: newCplId, weight: newCplWeight }] });
                }
              }}
            >
              {mapCplMutation.isPending ? 'Menyimpan...' : 'Tambah CPL'}
            </Button>
          </div>

        </div>
      </Drawer>

      {/* ─── Import Drawer ───────────────────────────────────────────────── */}
      <Drawer
        open={importOpen}
        onClose={() => { setImportOpen(false); resetImport(); }}
        title="Import CPMK via Excel"
        footer={
          importResult ? (
            <div className="flex justify-end">
              <Button onClick={() => { setImportOpen(false); resetImport(); }}>Selesai</Button>
            </div>
          ) : importProgress ? null : importStep === 1 ? (
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => { setImportOpen(false); resetImport(); }}>Batal</Button>
              <Button onClick={() => setImportStep(2)}>
                Lanjut <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => { setImportStep(1); setImportRows([]); }}>
                <ChevronLeft size={14} className="mr-1" /> Kembali
              </Button>
              <Button onClick={runImport} disabled={validImportCount === 0 || !curriculumId}>
                <Upload size={14} className="mr-1" />
                Import {validImportCount} CPMK
              </Button>
            </div>
          )
        }
      >
        <div className="space-y-4 p-1">

          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs mb-2">
            {(['1. Kurikulum', '2. Upload & Preview'] as const).map((label, idx) => {
              const step = (idx + 1) as 1 | 2;
              const active = importStep === step;
              const done   = importStep > step;
              return (
                <div key={label} className="flex items-center gap-2">
                  {idx > 0 && <div className="w-6 h-px bg-gray-200" />}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-colors
                    ${active ? 'bg-primary text-white' : done ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                    {done ? <CheckCircle2 size={11} /> : <span>{step}</span>}
                    {label.split('. ')[1]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step 1 */}
          {importStep === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Data CPMK akan diimport ke kurikulum yang sedang dipilih.
              </p>
              {selectedCurriculum ? (
                <div className="px-3 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                  <p className="font-semibold">{selectedCurriculum.name}</p>
                  <p className="text-xs text-blue-500 mt-0.5">Tahun {selectedCurriculum.year} · ID: {selectedCurriculum.id.slice(0, 8)}...</p>
                </div>
              ) : (
                <div className="px-3 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                  Belum ada kurikulum yang dipilih. Pilih kurikulum dari header terlebih dahulu.
                </div>
              )}
            </div>
          )}

          {/* Step 2 */}
          {importStep === 2 && !importProgress && !importResult && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-2">Format kolom Excel (baris pertama = header):</p>
                <div className="overflow-x-auto">
                  <table className="text-[11px] w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="px-2 py-1 text-left border border-gray-300 font-semibold">A: kode CPMK*</th>
                        <th className="px-2 py-1 text-left border border-gray-300 font-semibold">B: isi CPMK*</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white">
                        <td className="px-2 py-1 border border-gray-200 font-mono">CPMK011</td>
                        <td className="px-2 py-1 border border-gray-200">Mampu menunjukkan perilaku yang mencerminkan...</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">* Kolom wajib. Kode CPMK harus unik dalam satu kurikulum.</p>
              </div>

              <input ref={importFileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportXlsx} />
              <button
                type="button"
                onClick={() => importFileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-primary hover:text-primary transition-colors"
              >
                <FileSpreadsheet size={16} />
                {importRows.length > 0 ? 'Ganti File Excel' : 'Pilih File Excel (.xlsx / .xls)'}
              </button>

              {importRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-600">
                      Preview: <span className="text-emerald-600">{validImportCount} valid</span>
                      {importRows.filter((r) => !r.valid).length > 0 && (
                        <span className="text-red-500 ml-1.5">{importRows.filter((r) => !r.valid).length} error</span>
                      )}
                    </p>
                    <p className="text-[11px] text-gray-400">{importRows.length} baris</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-y-auto max-h-64">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600 w-24">Kode</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Isi / Error</th>
                            <th className="px-2 py-2 text-center font-semibold text-gray-600 w-8">OK</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importRows.map((row, i) => (
                            <tr key={i} className={`border-b border-gray-50 ${!row.valid ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                              <td className="px-3 py-2 font-mono text-gray-700">{row.code}</td>
                              <td className="px-3 py-2 max-w-[260px] truncate">
                                {row.valid
                                  ? <span className="text-gray-600">{truncate(row.name, 60)}</span>
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

          {/* Progress */}
          {importProgress && !importResult && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 size={32} className="text-primary animate-spin" />
              <div className="w-full">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Mengimport CPMK...</span>
                  <span>{importProgress.done} / {importProgress.total}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(importProgress.done / importProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Result */}
          {importResult && (
            <div className={`flex items-start gap-3 p-4 rounded-xl border ${
              importResult.failed.length === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <CheckCircle2 size={18} className={importResult.failed.length === 0 ? 'text-emerald-600' : 'text-yellow-600'} />
              <div>
                <p className={`text-sm font-semibold ${importResult.failed.length === 0 ? 'text-emerald-800' : 'text-yellow-800'}`}>
                  Import selesai
                </p>
                <p className="text-xs mt-0.5 text-gray-600">
                  {importResult.success} CPMK berhasil ditambahkan.
                  {importResult.failed.length > 0 && ` ${importResult.failed.length} gagal (kode duplikat).`}
                </p>
                {importResult.failed.length > 0 && (
                  <p className="text-xs mt-1 text-red-600 font-mono">
                    Gagal: {importResult.failed.slice(0, 5).join(', ')}
                    {importResult.failed.length > 5 && ` +${importResult.failed.length - 5} lainnya`}
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </Drawer>

      {/* ─── Confirm Delete ──────────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Hapus CPMK"
        description="Apakah Anda yakin ingin menghapus CPMK ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        loading={deleteMutation.isPending}
      />

    </div>
  );
}
