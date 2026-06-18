import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Input, Button, Drawer } from '@widyatama/ui';
import type { DataTableOptions, Header } from '@widyatama/ui';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { bodyOfKnowledgeService } from '@/services/obe.service';
import { useApp } from '@/contexts/AppContext';
import { bodyOfKnowledgeSchema } from '@/schemas/obe.schema';
import type { BodyOfKnowledgeFormData } from '@/schemas/obe.schema';
import type { BodyOfKnowledge } from '@/types';
import {
  Eye, Search, Plus, Pencil, Trash2,
  CheckCircle2, XCircle, FileSpreadsheet,
  Upload, ChevronLeft, ChevronRight, Loader2,
  BookOpenCheck, Download,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type ImportStep = 1 | 2;

interface ImportRow {
  code: string;
  name: string;
  reference: string;
  valid: boolean;
  error?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const LABEL_CLS = 'block text-sm font-medium text-gray-700 mb-1.5';

function truncate(text: string | null, max = 80) {
  if (!text) return '—';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function BodyOfKnowledgePage() {
  const queryClient    = useQueryClient();
  const { selectedCurriculum } = useApp();

  const [search, setSearch]           = useState('');
  const debouncedSearch               = useDebounce(search);
  const [filterActive, setFilterActive] = useState('');
  const [options, setOptions] = useState<DataTableOptions<BodyOfKnowledge>>({
    page: 1, itemsPerPage: 10, sortBy: 'code' as keyof BodyOfKnowledge, sortDesc: false,
  });

  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [apiError, setApiError]       = useState<string | null>(null);

  const [detailOpen, setDetailOpen]               = useState(false);
  const [detailItem, setDetailItem]               = useState<BodyOfKnowledge | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId]                   = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ─── Import state ──────────────────────────────────────────────────────────
  const [importOpen, setImportOpen]         = useState(false);
  const [importStep, setImportStep]         = useState<ImportStep>(1);
  const [importRows, setImportRows]         = useState<ImportRow[]>([]);
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null);
  const [importResult, setImportResult]     = useState<{ success: number; failed: string[] } | null>(null);
  const importFileRef                       = useRef<HTMLInputElement>(null);

  // ─── React Hook Form ───────────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BodyOfKnowledgeFormData>({
    resolver: zodResolver(bodyOfKnowledgeSchema),
    mode: 'onChange',
    defaultValues: { code: '', name: '', reference: '', description: '', isActive: true },
  });

  const isActiveValue = watch('isActive');

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['body-of-knowledge', options.page, options.itemsPerPage, debouncedSearch, filterActive, selectedCurriculum?.id],
    queryFn: () => bodyOfKnowledgeService.getAll({
      page:         options.page,
      limit:        options.itemsPerPage,
      search:       debouncedSearch || undefined,
      curriculumId: selectedCurriculum?.id ?? undefined,
      isActive:     filterActive === '' ? undefined : filterActive === 'true',
      sortBy:       String(options.sortBy),
      sortOrder:    options.sortDesc ? 'desc' : 'asc',
    }),
  });

  const total = data?.meta?.total ?? 0;

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => bodyOfKnowledgeService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-of-knowledge'] });
      setDrawerOpen(false);
      resetForm();
      showToast('success', 'Bahan Kajian berhasil dibuat.');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal menyimpan data';
      setApiError(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      bodyOfKnowledgeService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-of-knowledge'] });
      setDrawerOpen(false);
      resetForm();
      showToast('success', 'Bahan Kajian berhasil diperbarui.');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal memperbarui data';
      setApiError(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bodyOfKnowledgeService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body-of-knowledge'] });
      setConfirmDeleteOpen(false);
      showToast('success', 'Bahan Kajian berhasil dihapus.');
    },
    onError: (err: unknown) => {
      setConfirmDeleteOpen(false);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal menghapus data.';
      showToast('error', msg);
    },
  });

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const resetForm = () => {
    reset({ code: '', name: '', reference: '', description: '', isActive: true });
    setApiError(null);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setDrawerOpen(true);
  };

  const openEdit = (row: BodyOfKnowledge) => {
    setEditingId(row.id);
    reset({
      code: row.code,
      name: row.name,
      reference: row.reference ?? '',
      description: row.description ?? '',
      isActive: row.isActive,
    });
    setApiError(null);
    setDrawerOpen(true);
  };

  const onSubmit = (formData: BodyOfKnowledgeFormData) => {
    if (!selectedCurriculum?.id) {
      setApiError('Pilih kurikulum terlebih dahulu.');
      return;
    }
    const payload: Record<string, unknown> = {
      curriculumId: selectedCurriculum.id,
      code:         formData.code.trim(),
      name:         formData.name.trim(),
      reference:    formData.reference.trim(),
      description:  formData.description?.trim() || undefined,
      isActive:     formData.isActive,
    };
    if (editingId) updateMutation.mutate({ id: editingId, payload });
    else createMutation.mutate(payload);
  };

  // ─── Import Helpers ────────────────────────────────────────────────────────

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

        const seenCodes = new Set<string>();

        const parsed: ImportRow[] = rows
          .map((row) => ({
            code:      String((row as unknown[])[0] ?? '').trim(),
            name:      String((row as unknown[])[1] ?? '').trim(),
            reference: String((row as unknown[])[2] ?? '').trim(),
            valid:     false,
          }))
          .filter((r) => r.code && r.code.toLowerCase() !== 'kode' && r.code.toLowerCase() !== 'code')
          .map((r) => {
            if (!r.code) return { ...r, valid: false, error: 'Kode wajib diisi' };
            if (!r.name) return { ...r, valid: false, error: 'Nama wajib diisi' };
            if (!r.reference) return { ...r, valid: false, error: 'Acuan wajib diisi' };
            if (seenCodes.has(r.code)) return { ...r, valid: false, error: `Kode duplikat dalam file` };
            seenCodes.add(r.code);
            return { ...r, valid: true };
          });

        setImportRows(parsed);
      } catch {
        showToast('error', 'Gagal membaca file XLSX. Pastikan format file benar.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (importFileRef.current) importFileRef.current.value = '';
  };

  const runImport = async () => {
    if (!selectedCurriculum?.id) {
      showToast('error', 'Pilih kurikulum terlebih dahulu.');
      return;
    }
    const valid = importRows.filter((r) => r.valid);
    setImportProgress({ done: 0, total: valid.length });
    setImportResult(null);
    const failed: string[] = [];
    for (let i = 0; i < valid.length; i++) {
      const row = valid[i];
      try {
        await bodyOfKnowledgeService.create({
          curriculumId: selectedCurriculum.id,
          code:         row.code,
          name:         row.name,
          reference:    row.reference,
        });
      } catch {
        failed.push(row.code);
      }
      setImportProgress({ done: i + 1, total: valid.length });
    }
    setImportResult({ success: valid.length - failed.length, failed });
    queryClient.invalidateQueries({ queryKey: ['body-of-knowledge'] });
  };

  const validImportCount = importRows.filter((r) => r.valid).length;

  // ─── Export Excel ──────────────────────────────────────────────────────────

  const handleExport = async () => {
    try {
      const res = await bodyOfKnowledgeService.getAll({
        curriculumId: selectedCurriculum?.id ?? undefined,
        limit: 1000,
        page: 1,
        sortBy: 'code',
        sortOrder: 'asc',
      });
      const rows = (res.data ?? []).map((r) => ({
        'Kode BK':         r.code,
        'Nama Bahan Kajian': r.name,
        'Acuan':           r.reference ?? '',
        'Deskripsi':       r.description ?? '',
        'Status':          r.isActive ? 'Aktif' : 'Nonaktif',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Bahan Kajian');
      XLSX.writeFile(wb, `bahan-kajian-${selectedCurriculum?.year ?? 'all'}.xlsx`);
    } catch {
      showToast('error', 'Gagal mengekspor data.');
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Kode BK', 'Nama Bahan Kajian', 'Acuan'],
      ['BK-01', 'Algoritma dan Pemrograman', 'KKNI Level 6'],
      ['BK-02', 'Basis Data', 'IEEE/ACM Computing Curricula'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template-bahan-kajian.xlsx');
  };

  // ─── Table Headers ─────────────────────────────────────────────────────────

  const headers: Header<BodyOfKnowledge>[] = [
    {
      key: 'code', title: 'Kode BK', sortable: true,
      render: (row) => (
        <span
          className="font-mono text-xs font-bold text-primary cursor-pointer hover:underline"
          onClick={() => { setDetailItem(row); setDetailOpen(true); }}
        >
          {row.code}
        </span>
      ),
    },
    {
      key: 'name', title: 'Nama Bahan Kajian', sortable: true,
      render: (row) => (
        <div className="cursor-pointer" onClick={() => { setDetailItem(row); setDetailOpen(true); }}>
          <p className="text-sm font-medium text-gray-800 hover:text-primary">{row.name}</p>
          {row.description && <p className="text-xs text-gray-400 truncate max-w-[220px]">{truncate(row.description, 60)}</p>}
        </div>
      ),
    },
    {
      key: 'reference', title: 'Acuan',
      render: (row) => (
        <span className="text-sm text-gray-600">{row.reference ?? '—'}</span>
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
      key: 'createdAt', title: 'Dibuat',
      render: (row) => (
        <span className="text-xs text-gray-400">{new Date(row.createdAt).toLocaleDateString('id-ID')}</span>
      ),
    },
    {
      key: 'id', title: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setDetailItem(row); setDetailOpen(true); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
            title="Detail"
          >
            <Eye size={14} />
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

      {/* No curriculum selected */}
      {!selectedCurriculum && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-700">
          <BookOpenCheck size={18} className="shrink-0" />
          Pilih kurikulum terlebih dahulu melalui dropdown di header untuk melihat data Bahan Kajian.
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master Bahan Kajian (Body of Knowledge)</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedCurriculum
              ? `Kurikulum: ${selectedCurriculum.name} · ${selectedCurriculum.year}`
              : 'Semua kurikulum — pilih kurikulum di header untuk memfilter'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download size={15} />
            Template
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <FileSpreadsheet size={15} />
            Export Excel
          </button>
          <button
            onClick={() => { resetImport(); setImportOpen(true); }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Upload size={15} />
            Import Excel
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus size={15} />
            Tambah BK
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><BookOpenCheck size={20} /></div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{total}</p>
            <p className="text-xs text-gray-500">Total Bahan Kajian</p>
          </div>
        </div>
      </div>

      {/* Filter + Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari kode, nama, atau acuan..."
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

      {/* ─── Create / Edit Drawer ─────────────────────────────────────────── */}
      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); resetForm(); }}
        title={editingId ? 'Edit Bahan Kajian' : 'Tambah Bahan Kajian'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setDrawerOpen(false); resetForm(); }}>Batal</Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah BK'}
            </Button>
          </div>
        }
      >
        <div className="space-y-5 p-1">

          {/* API error */}
          {apiError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <XCircle size={15} className="shrink-0" /> {apiError}
            </div>
          )}

          {/* Curriculum info box */}
          {selectedCurriculum && (
            <div className="px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 flex items-center justify-between">
              <div>
                <span className="font-semibold">{selectedCurriculum.name}</span>
                <span className="text-blue-500 ml-2 text-xs">Tahun {selectedCurriculum.year}</span>
              </div>
              <span className="text-[11px] text-blue-400 font-normal">Kurikulum (terkunci)</span>
            </div>
          )}

          <div>
            <label className={LABEL_CLS}>Kode BK <span className="text-red-500">*</span></label>
            <Input
              {...register('code')}
              placeholder="BK-01"
              className={errors.code ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}
            />
            {errors.code && <p className="text-xs text-red-500 mt-1">❌ {errors.code.message}</p>}
          </div>

          <div>
            <label className={LABEL_CLS}>Nama Bahan Kajian <span className="text-red-500">*</span></label>
            <Input
              {...register('name')}
              placeholder="Algoritma dan Pemrograman"
              className={errors.name ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">❌ {errors.name.message}</p>}
          </div>

          <div>
            <label className={LABEL_CLS}>Acuan <span className="text-red-500">*</span></label>
            <Input
              {...register('reference')}
              placeholder="KKNI Level 6"
              className={errors.reference ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}
            />
            {errors.reference && <p className="text-xs text-red-500 mt-1">❌ {errors.reference.message}</p>}
          </div>

          <div>
            <label className={LABEL_CLS}>Deskripsi <span className="text-gray-400 font-normal">(opsional)</span></label>
            <textarea
              {...register('description')}
              placeholder="Deskripsi singkat bahan kajian..."
              rows={3}
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
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform
                  ${isActiveValue ? 'translate-x-4.5' : 'translate-x-0.5'}`}
              />
            </button>
            <span className="text-xs text-gray-500">{isActiveValue ? 'Aktif' : 'Nonaktif'}</span>
          </div>

        </div>
      </Drawer>

      {/* ─── Detail Drawer ────────────────────────────────────────────────── */}
      <Drawer
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailItem(null); }}
        title="Detail Bahan Kajian"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setDetailOpen(false); if (detailItem) openEdit(detailItem); }}>
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
        }
      >
        {detailItem ? (
          <div className="space-y-5 p-1">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <BookOpenCheck size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">{detailItem.name}</h2>
                <p className="text-xs text-gray-400 font-mono">{detailItem.code}</p>
                <div className="flex items-center gap-2 mt-1">
                  {detailItem.isActive
                    ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Aktif</span>
                    : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Nonaktif</span>
                  }
                </div>
              </div>
            </div>
            {detailItem.reference && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs font-medium text-blue-400 mb-1">Acuan</p>
                <p className="text-sm text-blue-800">{detailItem.reference}</p>
              </div>
            )}
            {detailItem.description && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-medium text-gray-400 mb-1">Deskripsi</p>
                <p className="text-sm text-gray-700">{detailItem.description}</p>
              </div>
            )}
            <div className="text-xs text-gray-400 flex gap-4 border-t pt-3">
              <span>Dibuat: {new Date(detailItem.createdAt).toLocaleString('id-ID')}</span>
              <span>Diperbarui: {new Date(detailItem.updatedAt).toLocaleString('id-ID')}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Memuat...</div>
        )}
      </Drawer>

      {/* ─── Import Excel Drawer ─────────────────────────────────────────── */}
      <Drawer
        open={importOpen}
        onClose={() => { setImportOpen(false); resetImport(); }}
        title="Import Bahan Kajian via Excel"
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
              <Button onClick={runImport} disabled={validImportCount === 0}>
                <Upload size={14} className="mr-1" />
                Import {validImportCount} BK
              </Button>
            </div>
          )
        }
      >
        <div className="space-y-4 p-1">

          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs mb-2">
            {(['1. Konfirmasi Kurikulum', '2. Upload & Preview'] as const).map((label, idx) => {
              const step = (idx + 1) as ImportStep;
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

          {/* Step 1: Curriculum confirmation */}
          {importStep === 1 && (
            <div className="space-y-5">
              <p className="text-xs text-gray-500">
                Semua baris Excel akan diimport ke kurikulum yang sedang dipilih.
              </p>
              {selectedCurriculum ? (
                <div className="px-3 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                  <p className="font-semibold">{selectedCurriculum.name}</p>
                  <p className="text-xs text-blue-500 mt-0.5">Tahun {selectedCurriculum.year} · ID: {selectedCurriculum.id.slice(0, 8)}...</p>
                </div>
              ) : (
                <div className="px-3 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  Belum ada kurikulum yang dipilih. Tutup dialog ini dan pilih kurikulum dari header terlebih dahulu.
                </div>
              )}
            </div>
          )}

          {/* Step 2: Upload & Preview */}
          {importStep === 2 && !importProgress && !importResult && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-2">Format kolom Excel:</p>
                <div className="overflow-x-auto">
                  <table className="text-[11px] w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        {['A: Kode BK*', 'B: Nama Bahan Kajian*', 'C: Acuan*'].map((h) => (
                          <th key={h} className="px-2 py-1 text-left border border-gray-300 font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white">
                        <td className="px-2 py-1 border border-gray-200 font-mono">BK-01</td>
                        <td className="px-2 py-1 border border-gray-200">Algoritma dan Pemrograman</td>
                        <td className="px-2 py-1 border border-gray-200">KKNI Level 6</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Semua kolom bertanda * wajib diisi.</p>
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
                    <div className="overflow-y-auto overflow-x-auto max-h-72">
                      <table className="w-full text-xs min-w-[400px]">
                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-2 py-2 text-left font-semibold text-gray-600 w-20">Kode</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-600">Nama</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-600 w-28">Acuan</th>
                            <th className="px-2 py-2 text-center font-semibold text-gray-600 w-10">OK</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importRows.map((row, i) => (
                            <tr key={i} className={`border-b border-gray-50 ${!row.valid ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                              <td className="px-2 py-1.5 font-mono text-gray-700">{row.code}</td>
                              <td className="px-2 py-1.5 text-gray-700 max-w-[160px] truncate">{truncate(row.name, 40)}</td>
                              <td className="px-2 py-1.5 text-gray-600 max-w-[100px] truncate">{truncate(row.reference, 30)}</td>
                              <td className="px-2 py-1.5 text-center">
                                {row.valid
                                  ? <CheckCircle2 size={12} className="text-emerald-500 inline" />
                                  : <span title={row.error}><XCircle size={12} className="text-red-500 inline" /></span>}
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
                  <span>Mengimport Bahan Kajian...</span>
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
                  {importResult.success} Bahan Kajian berhasil ditambahkan.
                  {importResult.failed.length > 0 && ` ${importResult.failed.length} gagal (mungkin kode sudah ada).`}
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
        title="Hapus Bahan Kajian"
        description="Apakah Anda yakin ingin menghapus Bahan Kajian ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        loading={deleteMutation.isPending}
      />

    </div>
  );
}
