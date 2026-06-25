import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Input, Button, Drawer } from '@widyatama/ui';
import type { DataTableOptions, Header } from '@widyatama/ui';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { cplService } from '@/services/obe.service';
import { CPL_CATEGORY_LABELS } from '@/constants';
import { useApp } from '@/contexts/AppContext';
import type { Cpl, CplCategory } from '@/types';
import {
  Eye, Search, Plus, Pencil, Trash2,
  CheckCircle2, XCircle, FileSpreadsheet,
  Upload, ChevronLeft, ChevronRight, Loader2,
  Target,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type ImportStep = 1 | 2;

interface ImportRow {
  code: string;
  name: string;
  category: CplCategory;
  curriculumYear: number | null;
  description: string;
  valid: boolean;
  error?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const LABEL_CLS = 'block text-sm font-medium text-gray-700 mb-1.5';

const EMPTY_FORM = {
  code: '',
  name: '',
  category: 'SIKAP' as CplCategory,
  description: '',
  curriculumYear: new Date().getFullYear(),
};

type FormState  = typeof EMPTY_FORM;
type FormErrors = Partial<Record<keyof FormState | 'api', string>>;

const CATEGORY_OPTIONS: { value: CplCategory; label: string }[] = Object.entries(CPL_CATEGORY_LABELS).map(
  ([value, label]) => ({ value: value as CplCategory, label }),
);

function truncate(text: string | null, max = 80) {
  if (!text) return '—';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CplPage() {
  const queryClient    = useQueryClient();
  const { selectedCurriculum } = useApp();
  const curriculumYear = selectedCurriculum?.year ?? null;

  const [search, setSearch]           = useState('');
  const debouncedSearch               = useDebounce(search);
  const [filterCategory, setFilterCategory] = useState('');
  const [options, setOptions] = useState<DataTableOptions<Cpl>>({
    page: 1, itemsPerPage: 10, sortBy: 'code' as keyof Cpl, sortDesc: false,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState<FormState>({
    ...EMPTY_FORM,
    curriculumYear: selectedCurriculum?.year ?? new Date().getFullYear(),
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched]       = useState<Partial<Record<keyof FormState, boolean>>>({});

  const [detailOpen, setDetailOpen]               = useState(false);
  const [detailItem, setDetailItem]               = useState<Cpl | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId]                   = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ─── Import state ──────────────────────────────────────────────────────────
  const [importOpen, setImportOpen]               = useState(false);
  const [importStep, setImportStep]               = useState<ImportStep>(1);
  const [importDefaultYear, setImportDefaultYear] = useState<number>(
    selectedCurriculum?.year ?? new Date().getFullYear(),
  );
  const [importRows, setImportRows]               = useState<ImportRow[]>([]);
  const [importProgress, setImportProgress]       = useState<{ done: number; total: number } | null>(null);
  const [importResult, setImportResult]           = useState<{ success: number; failed: string[] } | null>(null);
  const importFileRef                             = useRef<HTMLInputElement>(null);

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['cpl', options.page, options.itemsPerPage, debouncedSearch, filterCategory, curriculumYear],
    queryFn: () => cplService.getAll({
      page:           options.page,
      limit:          options.itemsPerPage,
      search:         debouncedSearch || undefined,
      curriculumYear: curriculumYear ?? undefined,
      category:       filterCategory || undefined,
      sortBy:         String(options.sortBy),
      sortOrder:      options.sortDesc ? 'desc' : 'asc',
    }),
  });

  const total = data?.meta?.total ?? 0;

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => cplService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpl'] });
      setDrawerOpen(false); resetForm();
      showToast('success', 'CPL berhasil dibuat.');
    },
    onError: (err: any) => {
      setFormErrors((p) => ({ ...p, api: err.response?.data?.message || 'Gagal menyimpan data' }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      cplService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpl'] });
      setDrawerOpen(false); resetForm();
      showToast('success', 'CPL berhasil diperbarui.');
    },
    onError: (err: any) => {
      setFormErrors((p) => ({ ...p, api: err.response?.data?.message || 'Gagal memperbarui data' }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cplService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpl'] });
      setConfirmDeleteOpen(false);
      showToast('success', 'CPL berhasil dihapus.');
    },
    onError: (err: any) => {
      setConfirmDeleteOpen(false);
      showToast('error', err.response?.data?.message || 'Gagal menghapus data.');
    },
  });

  // ─── Form Helpers ──────────────────────────────────────────────────────────

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const resetForm = () => { setForm({ ...EMPTY_FORM, curriculumYear: selectedCurriculum?.year ?? new Date().getFullYear() }); setFormErrors({}); setTouched({}); setEditingId(null); };

  const openCreate = () => { resetForm(); setDrawerOpen(true); };

  const openEdit = (row: Cpl) => {
    setEditingId(row.id);
    setForm({ code: row.code, name: row.name, category: row.category, description: row.description ?? '', curriculumYear: row.curriculumYear });
    setFormErrors({}); setTouched({});
    setDrawerOpen(true);
  };

  const handleFormChange = (field: keyof FormState, value: string | number | boolean) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (touched[field]) {
      setFormErrors((p) => ({ ...p, [field]: validateField(field, value), api: undefined }));
    } else {
      setFormErrors((p) => ({ ...p, api: undefined }));
    }
  };

  const handleBlur = (field: keyof FormState) => {
    setTouched((p) => ({ ...p, [field]: true }));
    setFormErrors((p) => ({ ...p, [field]: validateField(field, form[field]) }));
  };

  const validateField = (field: keyof FormState, value: string | number | boolean | undefined): string | undefined => {
    switch (field) {
      case 'code':    return !String(value ?? '').trim() ? 'Kode wajib diisi' : undefined;
      case 'name':    return !String(value ?? '').trim() ? 'Nama wajib diisi' : undefined;
      case 'curriculumYear': {
        const y = Number(value);
        if (!y) return 'Tahun kurikulum wajib diisi';
        if (y < 2000 || y > 2100) return 'Tahun harus antara 2000–2100';
        return undefined;
      }
      default: return undefined;
    }
  };

  const validateForm = (): FormErrors => {
    const errs: FormErrors = {};
    if (!form.code.trim())        errs.code = 'Kode wajib diisi';
    if (!form.name.trim())        errs.name = 'Nama wajib diisi';
    if (!form.curriculumYear)     errs.curriculumYear = 'Tahun kurikulum wajib diisi';
    else if (form.curriculumYear < 2000 || form.curriculumYear > 2100) errs.curriculumYear = 'Tahun harus antara 2000–2100';
    return errs;
  };

  const handleSubmit = () => {
    const errs = validateForm();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    const payload = {
      code:           form.code.trim(),
      name:           form.name.trim(),
      category:       form.category,
      description:    form.description.trim() || undefined,
      curriculumYear: selectedCurriculum?.year ?? Number(form.curriculumYear),
    };
    if (editingId) updateMutation.mutate({ id: editingId, payload });
    else createMutation.mutate(payload);
  };

  // ─── Import Helpers ────────────────────────────────────────────────────────

  const resetImport = () => {
    setImportStep(1);
    setImportDefaultYear(selectedCurriculum?.year ?? new Date().getFullYear());
    setImportRows([]);
    setImportProgress(null); setImportResult(null);
    if (importFileRef.current) importFileRef.current.value = '';
  };

  const parseCategoryFromExcel = (raw: string): CplCategory => {
    const val = raw.toUpperCase().replace(/\s+/g, '_');
    if (val === 'PENGETAHUAN') return 'PENGETAHUAN';
    if (val === 'KETERAMPILAN_UMUM' || val.includes('UMUM')) return 'KETERAMPILAN_UMUM';
    if (val === 'KETERAMPILAN_KHUSUS' || val.includes('KHUSUS')) return 'KETERAMPILAN_KHUSUS';
    return 'SIKAP';
  };

  const handleImportXlsx = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb   = XLSX.read(new Uint8Array(evt.target?.result as ArrayBuffer), { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        const parsed: ImportRow[] = rows
          .map((row) => ({
            code:          String(row[0] ?? '').trim(),
            name:          String(row[1] ?? '').trim(),
            category:      parseCategoryFromExcel(String(row[2] ?? '')),
            curriculumYear: parseInt(String(row[3] ?? ''), 10) || null,
            description:   String(row[4] ?? '').trim(),
            valid:         false,
          }))
          .filter((r) => r.code && r.code.toLowerCase() !== 'kode' && r.code.toLowerCase() !== 'code')
          .map((r) => {
            if (!r.code) return { ...r, valid: false, error: 'Kode wajib diisi' };
            if (!r.name) return { ...r, valid: false, error: 'Nama wajib diisi' };
            const year = r.curriculumYear ?? importDefaultYear;
            if (!year || year < 2000 || year > 2100) return { ...r, valid: false, error: 'Tahun tidak valid (2000–2100)' };
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
    const valid = importRows.filter((r) => r.valid);
    setImportProgress({ done: 0, total: valid.length });
    setImportResult(null);
    const failed: string[] = [];
    for (let i = 0; i < valid.length; i++) {
      const row = valid[i];
      try {
        await cplService.create({
          code:           row.code,
          name:           row.name,
          category:       row.category,
          curriculumYear: selectedCurriculum?.year ?? row.curriculumYear ?? importDefaultYear,
          description:    row.description || undefined,
        });
      } catch {
        failed.push(row.code);
      }
      setImportProgress({ done: i + 1, total: valid.length });
    }
    setImportResult({ success: valid.length - failed.length, failed });
    queryClient.invalidateQueries({ queryKey: ['cpl'] });
  };

  const validImportCount = importRows.filter((r) => r.valid).length;

  // ─── Table Headers ─────────────────────────────────────────────────────────

  const headers: Header<Cpl>[] = [
    {
      key: 'code', title: 'Kode', sortable: true,
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
      key: 'name', title: 'Nama CPL', sortable: true,
      render: (row) => (
        <div className="cursor-pointer" onClick={() => { setDetailItem(row); setDetailOpen(true); }}>
          <p className="text-sm font-medium text-gray-800 hover:text-primary">{row.name}</p>
          {row.description && <p className="text-xs text-gray-400 truncate max-w-[220px]">{row.description}</p>}
        </div>
      ),
    },
    {
      key: 'category', title: 'Kategori', sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {CPL_CATEGORY_LABELS[row.category] ?? row.category}
        </span>
      ),
    },
    {
      key: 'curriculumYear', title: 'Tahun Kurikulum', sortable: true,
      render: (row) => (
        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100 font-medium">
          {row.curriculumYear}
        </span>
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

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Capaian Pembelajaran Lulusan (CPL)</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedCurriculum
              ? `Kurikulum: ${selectedCurriculum.name} · ${selectedCurriculum.year}`
              : 'Semua kurikulum — pilih kurikulum di header untuk memfilter'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { resetImport(); setImportOpen(true); }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <FileSpreadsheet size={15} />
            Import Excel
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus size={15} />
            Tambah CPL
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Target size={20} /></div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{total}</p>
            <p className="text-xs text-gray-500">Total CPL</p>
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
              placeholder="Cari kode atau nama CPL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
          >
            <option value="">Semua Kategori</option>
            {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
        title={editingId ? 'Edit CPL' : 'Tambah CPL'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setDrawerOpen(false); resetForm(); }}>Batal</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah CPL'}
            </Button>
          </div>
        }
      >
        <div className="space-y-5 p-1">

          {formErrors.api && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <XCircle size={15} className="shrink-0" /> {formErrors.api}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Kode CPL <span className="text-red-500">*</span></label>
              <Input
                value={form.code}
                onChange={(e) => handleFormChange('code', e.target.value)}
                onBlur={() => handleBlur('code')}
                placeholder="CPL-01"
                className={formErrors.code ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}
              />
              {formErrors.code && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.code}</p>}
            </div>
            <div>
              <label className={LABEL_CLS}>Tahun Kurikulum <span className="text-red-500">*</span></label>
              {selectedCurriculum ? (
                <div className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 font-medium flex items-center justify-between">
                  <span>{selectedCurriculum.year}</span>
                  <span className="text-[11px] text-blue-400 font-normal truncate ml-2">{selectedCurriculum.name}</span>
                </div>
              ) : (
                <Input
                  type="number"
                  value={form.curriculumYear}
                  onChange={(e) => handleFormChange('curriculumYear', Number(e.target.value))}
                  onBlur={() => handleBlur('curriculumYear')}
                  placeholder="2025"
                  min={2000} max={2100}
                  className={formErrors.curriculumYear ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}
                />
              )}
              {formErrors.curriculumYear && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.curriculumYear}</p>}
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Nama CPL <span className="text-red-500">*</span></label>
            <Input
              value={form.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="Mampu menerapkan konsep..."
              className={formErrors.name ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}
            />
            {formErrors.name && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.name}</p>}
          </div>

          <div>
            <label className={LABEL_CLS}>Kategori <span className="text-red-500">*</span></label>
            <select
              value={form.category}
              onChange={(e) => handleFormChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            >
              {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className={LABEL_CLS}>Deskripsi <span className="text-gray-400 font-normal">(opsional)</span></label>
            <Input
              value={form.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Deskripsi singkat..."
            />
          </div>

        </div>
      </Drawer>

      {/* ─── Detail Drawer ────────────────────────────────────────────────── */}
      <Drawer
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailItem(null); }}
        title="Detail CPL"
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
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                <Target size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">{detailItem.name}</h2>
                <p className="text-xs text-gray-400 font-mono">{detailItem.code} · Kurikulum {detailItem.curriculumYear}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {CPL_CATEGORY_LABELS[detailItem.category] ?? detailItem.category}
                  </span>
                </div>
              </div>
            </div>
            {detailItem.description && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-medium text-gray-400 mb-1">Deskripsi</p>
                <p className="text-sm text-gray-700">{detailItem.description}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Memuat...</div>
        )}
      </Drawer>

      {/* ─── Import Excel Drawer ─────────────────────────────────────────── */}
      <Drawer
        open={importOpen}
        onClose={() => { setImportOpen(false); resetImport(); }}
        title="Import CPL via Excel"
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
                Import {validImportCount} CPL
              </Button>
            </div>
          )
        }
      >
        <div className="space-y-4 p-1">

          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs mb-2">
            {(['1. Pengaturan Default', '2. Upload & Preview'] as const).map((label, idx) => {
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

          {/* Step 1 */}
          {importStep === 1 && (
            <div className="space-y-5">
              <p className="text-xs text-gray-500">
                Tentukan nilai default yang akan diterapkan ke semua baris Excel yang tidak memiliki nilai di kolom tersebut.
              </p>
              <div>
                <label className={LABEL_CLS}>Tahun Kurikulum Default <span className="text-red-500">*</span></label>
                {selectedCurriculum ? (
                  <div className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700 font-medium flex items-center justify-between">
                    <span>{selectedCurriculum.year}</span>
                    <span className="text-[11px] text-blue-400 font-normal truncate ml-2">{selectedCurriculum.name}</span>
                  </div>
                ) : (
                  <input
                    type="number" value={importDefaultYear}
                    onChange={(e) => setImportDefaultYear(Number(e.target.value))}
                    min={2000} max={2100}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="2024"
                  />
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {selectedCurriculum ? 'Dikunci sesuai kurikulum yang dipilih di header.' : 'Digunakan jika kolom D di Excel kosong.'}
                </p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-700 space-y-0.5">
                <p className="font-semibold text-blue-800">Semua CPL dalam Excel akan diimport dengan:</p>
                <p>• Tahun Kurikulum: <span className="font-medium">{selectedCurriculum?.year ?? importDefaultYear}</span></p>
              </div>
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
                        {['A: Kode*', 'B: Nama*', 'C: Kategori', 'D: Tahun', 'E: Deskripsi'].map((h) => (
                          <th key={h} className="px-2 py-1 text-left border border-gray-300 font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white">
                        <td className="px-2 py-1 border border-gray-200 font-mono">CPL-01</td>
                        <td className="px-2 py-1 border border-gray-200">Mampu menerapkan...</td>
                        <td className="px-2 py-1 border border-gray-200">SIKAP</td>
                        <td className="px-2 py-1 border border-gray-200">2024</td>
                        <td className="px-2 py-1 border border-gray-200 text-gray-400">opsional</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Kategori: SIKAP, PENGETAHUAN, KETERAMPILAN_UMUM, KETERAMPILAN_KHUSUS (default: SIKAP).
                  Kolom D opsional — pakai default ({importDefaultYear}) jika kosong.
                </p>
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
                      <table className="w-full text-xs min-w-[460px]">
                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-2 py-2 text-left font-semibold text-gray-600 w-20">Kode</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-600">Nama</th>
                            <th className="px-2 py-2 text-left font-semibold text-gray-600 w-28">Kategori</th>
                            <th className="px-2 py-2 text-center font-semibold text-gray-600 w-16">Tahun</th>
                            <th className="px-2 py-2 text-center font-semibold text-gray-600 w-10">OK</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importRows.map((row, i) => (
                            <tr key={i} className={`border-b border-gray-50 ${!row.valid ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                              <td className="px-2 py-1.5 font-mono text-gray-700">{row.code}</td>
                              <td className="px-2 py-1.5 text-gray-700 max-w-[160px] truncate">{truncate(row.name, 40)}</td>
                              <td className="px-2 py-1.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-medium">
                                  {CPL_CATEGORY_LABELS[row.category] ?? row.category}
                                </span>
                              </td>
                              <td className="px-2 py-1.5 text-center text-gray-600">
                                {row.curriculumYear ?? <span className="text-gray-400 text-[10px]">default</span>}
                              </td>
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
                  <span>Mengimport CPL...</span>
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
                  {importResult.success} CPL berhasil ditambahkan.
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
        title="Hapus CPL"
        description="Apakah Anda yakin ingin menghapus CPL ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        loading={deleteMutation.isPending}
      />

    </div>
  );
}
