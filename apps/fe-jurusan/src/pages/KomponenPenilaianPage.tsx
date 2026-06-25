import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button, DataTable, Input, Drawer, Switch,
  type Header, type DataTableOptions,
} from '@widyatama/ui';
import { assessmentComponentService } from '@/services/obe.service';
import type { AssessmentComponent } from '@/types';
import {
  Plus, Download, FileSpreadsheet, Upload, Search,
  Pencil, Trash2, CheckCircle2, XCircle, Loader2, AlertTriangle,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const formSchema = z.object({
  code: z.string().min(1, 'Kode wajib diisi').max(20, 'Kode maksimal 20 karakter'),
  name: z.string().min(1, 'Nama wajib diisi').max(255, 'Nama maksimal 255 karakter'),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Import Row ───────────────────────────────────────────────────────────────

interface ImportRow {
  code: string;
  name: string;
  description: string;
  valid: boolean;
  error?: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KomponenPenilaianPage() {
  const queryClient = useQueryClient();

  // Table state
  const [tableOptions, setTableOptions] = useState<DataTableOptions<AssessmentComponent>>({
    page: 1, itemsPerPage: 10, sortBy: 'code', sortDesc: false,
  });
  const [search, setSearch]               = useState('');
  const [filterActive, setFilterActive]   = useState<'all' | 'true' | 'false'>('all');

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form drawer
  const [formOpen, setFormOpen]   = useState(false);
  const [editItem, setEditItem]   = useState<AssessmentComponent | null>(null);

  // Delete drawer
  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AssessmentComponent | null>(null);

  // Import drawer
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

  // ─── React Hook Form ─────────────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: { code: '', name: '', description: '', isActive: true },
  });

  const watchIsActive = watch('isActive');

  // ─── Query ───────────────────────────────────────────────────────────────────

  const sortBy    = tableOptions.sortBy ? String(tableOptions.sortBy) : 'code';
  const sortOrder = tableOptions.sortDesc ? 'desc' : 'asc';

  const { data, isLoading } = useQuery({
    queryKey: ['assessment-components', tableOptions.page, tableOptions.itemsPerPage, sortBy, sortOrder, search, filterActive],
    queryFn: () => assessmentComponentService.getAll({
      page: tableOptions.page,
      limit: tableOptions.itemsPerPage,
      sortBy,
      sortOrder,
      search: search || undefined,
      isActive: filterActive === 'all' ? undefined : filterActive === 'true',
    }),
  });

  const items: AssessmentComponent[] = data?.data ?? [];
  const total: number = data?.meta?.total ?? 0;

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      editItem
        ? assessmentComponentService.update(editItem.id, values)
        : assessmentComponentService.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-components'] });
      setFormOpen(false);
      reset();
      showToast('success', editItem ? 'Komponen berhasil diperbarui.' : 'Komponen berhasil ditambahkan.');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast('error', msg ?? 'Gagal menyimpan data.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assessmentComponentService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-components'] });
      setDeleteOpen(false);
      setDeleteTarget(null);
      showToast('success', 'Komponen berhasil dihapus.');
    },
    onError: () => showToast('error', 'Gagal menghapus komponen.'),
  });

  // ─── Form Handlers ───────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditItem(null);
    reset({ code: '', name: '', description: '', isActive: true });
    setFormOpen(true);
  };

  const openEdit = (item: AssessmentComponent) => {
    setEditItem(item);
    reset({ code: item.code, name: item.name, description: item.description ?? '', isActive: item.isActive });
    setFormOpen(true);
  };

  const openDelete = (item: AssessmentComponent) => {
    setDeleteTarget(item);
    setDeleteOpen(true);
  };

  const onSubmit = (values: FormValues) => saveMutation.mutate(values);

  // ─── Import ───────────────────────────────────────────────────────────────────

  const existingCodes = new Set(items.map((i) => i.code.toLowerCase()));

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
        const seen = new Set<string>();
        const parsed: ImportRow[] = rows.slice(1)
          .map((row) => ({
            code: String((row as unknown[])[0] ?? '').trim(),
            name: String((row as unknown[])[1] ?? '').trim(),
            description: String((row as unknown[])[2] ?? '').trim(),
            valid: false,
          }))
          .filter((r) => r.code || r.name)
          .map((r) => {
            if (!r.code)              return { ...r, error: 'Kode tidak boleh kosong' };
            if (r.code.length > 20)   return { ...r, error: 'Kode maksimal 20 karakter' };
            if (!r.name)              return { ...r, error: 'Nama tidak boleh kosong' };
            if (r.name.length > 255)  return { ...r, error: 'Nama maksimal 255 karakter' };
            if (seen.has(r.code.toLowerCase())) return { ...r, error: `Duplikat kode "${r.code}" dalam file` };
            if (existingCodes.has(r.code.toLowerCase())) return { ...r, error: `Kode "${r.code}" sudah ada di database` };
            seen.add(r.code.toLowerCase());
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
    setImportProgress({ done: 0, total: valid.length });
    const failed: string[] = [];
    let done = 0;
    for (const row of valid) {
      try {
        await assessmentComponentService.create({ code: row.code, name: row.name, description: row.description || undefined, isActive: true });
        done++;
      } catch { failed.push(row.code); }
      setImportProgress({ done, total: valid.length });
    }
    setImportResult({ success: done, failed });
    queryClient.invalidateQueries({ queryKey: ['assessment-components'] });
  };

  // ─── Export / Template ────────────────────────────────────────────────────────

  const handleExport = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Kode', 'Nama Komponen', 'Deskripsi'],
      ...items.map((i) => [i.code, i.name, i.description ?? '']),
    ]);
    ws['!cols'] = [{ wch: 10 }, { wch: 40 }, { wch: 60 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Komponen Penilaian');
    XLSX.writeFile(wb, 'komponen-penilaian.xlsx');
  };

  const handleTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Kode', 'Nama Komponen', 'Deskripsi'],
      ['KP01', 'Partisipasi (Quiz)',          'Penilaian partisipasi mahasiswa'],
      ['KP02', 'Observasi (Praktik / Tugas)', 'Penilaian praktik dan tugas'],
      ['KP03', 'Unjuk Kerja (Presentasi)',    'Penilaian presentasi'],
      ['KP04', 'Tes Tulis (UTS)',             'Penilaian ujian tengah semester'],
      ['KP05', 'Tes Tulis (UAS)',             'Penilaian ujian akhir semester'],
      ['KP06', 'Tes Lisan (Tugas Kelompok)',  'Penilaian diskusi dan tugas kelompok'],
    ]);
    ws['!cols'] = [{ wch: 10 }, { wch: 40 }, { wch: 60 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template-komponen-penilaian.xlsx');
  };

  // ─── DataTable Headers ────────────────────────────────────────────────────────

  const headers: Header<AssessmentComponent>[] = [
    {
      key: 'code', title: 'Kode', sortable: true,
      render: (item) => (
        <span className="font-mono text-xs font-bold bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
          {item.code}
        </span>
      ),
    },
    {
      key: 'name', title: 'Nama Komponen', sortable: true,
      render: (item) => (
        <div>
          <p className="font-medium text-gray-800">{item.name}</p>
          {item.description && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'isActive', title: 'Status',
      render: (item) => (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium
          ${item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
          {item.isActive ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      key: 'id', title: 'Aksi',
      render: (item) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(item); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors" title="Edit">
            <Pencil size={13} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); openDelete(item); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Hapus">
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

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

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master Komponen Penilaian</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Jenis penilaian reusable untuk bobot CPMK dan input nilai OBE
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
          <button onClick={() => { resetImport(); setImportOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm">
            <Upload size={14} /> Import
          </button>
          <Button onClick={openCreate}>
            <Plus size={14} className="mr-1.5" /> Tambah Komponen
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Komponen', value: total,                                           color: 'text-primary' },
          { label: 'Aktif',          value: data?.data?.filter((i) => i.isActive).length ?? 0,  color: 'text-emerald-600' },
          { label: 'Nonaktif',       value: data?.data?.filter((i) => !i.isActive).length ?? 0, color: 'text-gray-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari kode atau nama..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setTableOptions((o) => ({ ...o, page: 1 })); }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
          />
        </div>
        <select
          value={filterActive}
          onChange={(e) => { setFilterActive(e.target.value as typeof filterActive); setTableOptions((o) => ({ ...o, page: 1 })); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
        >
          <option value="all">Semua Status</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
        {(search || filterActive !== 'all') && (
          <button onClick={() => { setSearch(''); setFilterActive('all'); }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Reset filter
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <DataTable<AssessmentComponent>
          headers={headers}
          items={items}
          totalItems={total}
          loading={isLoading}
          options={tableOptions}
          onOptionsChange={(opts) => setTableOptions(opts)}
        />
      </div>

      {/* ─── Form Drawer ──────────────────────────────────────────────────── */}
      <Drawer
        open={formOpen}
        onClose={() => { setFormOpen(false); reset(); }}
        title={editItem ? 'Edit Komponen Penilaian' : 'Tambah Komponen Penilaian'}
        description={editItem ? `Edit komponen ${editItem.code}` : 'Isi form untuk menambahkan komponen baru'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setFormOpen(false); reset(); }}>Batal</Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? <><Loader2 size={14} className="animate-spin mr-1.5" />Menyimpan...</>
                : editItem ? 'Simpan Perubahan' : 'Tambah Komponen'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Kode Komponen *"
            placeholder="cth: KP01"
            error={errors.code?.message}
            {...register('code')}
          />

          <Input
            label="Nama Komponen *"
            placeholder="cth: Partisipasi (Quiz)"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="flex flex-col gap-1 text-sm w-full">
            <label className="text-gray-700 font-medium">Deskripsi <span className="font-normal text-gray-400">(opsional)</span></label>
            <textarea
              placeholder="Deskripsi komponen penilaian..."
              rows={3}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm transition-all placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
              {...register('description')}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Status Aktif</p>
              <p className="text-xs text-gray-400 mt-0.5">Komponen nonaktif tidak ditampilkan pada penilaian</p>
            </div>
            <Switch
              checked={watchIsActive}
              onCheckedChange={(val) => setValue('isActive', val, { shouldValidate: true })}
            />
          </div>
        </form>
      </Drawer>

      {/* ─── Delete Drawer ────────────────────────────────────────────────── */}
      <Drawer
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        title="Hapus Komponen Penilaian"
        description="Tindakan ini tidak dapat dibatalkan"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteTarget(null); }}>Batal</Button>
            <button
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        }
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{deleteTarget.name}</p>
                <p className="font-mono text-xs text-gray-500 mt-0.5">{deleteTarget.code}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Hapus komponen <strong className="font-mono">{deleteTarget.code}</strong>?
              Komponen yang sudah dihapus tidak dapat dikembalikan.
            </p>
          </div>
        )}
      </Drawer>

      {/* ─── Import Drawer ────────────────────────────────────────────────── */}
      <Drawer
        open={importOpen}
        onClose={() => { setImportOpen(false); resetImport(); }}
        title="Import Komponen Penilaian"
        footer={
          importResult ? (
            <div className="flex justify-end">
              <Button onClick={() => { setImportOpen(false); resetImport(); }}>Selesai</Button>
            </div>
          ) : importProgress ? undefined : importStep === 1 ? (
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
              <Button onClick={runImport} disabled={validCount === 0}>
                <CheckCircle2 size={14} className="mr-1" /> Import {validCount} Komponen
              </Button>
            </div>
          )
        }
      >
        <div className="space-y-4">
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs">
            {(['1. Info', '2. Upload'] as const).map((label, idx) => {
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
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 flex gap-2">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                Import hanya menambahkan data baru. Kode yang sudah ada tidak akan ditimpa.
              </div>
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <p className="text-xs font-semibold text-gray-600 mb-2">Format kolom (baris 1 = header):</p>
                <table className="text-[11px] w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="px-2 py-1 text-left border border-gray-300 font-semibold">A: Kode</th>
                      <th className="px-2 py-1 text-left border border-gray-300 font-semibold">B: Nama Komponen</th>
                      <th className="px-2 py-1 text-left border border-gray-300 font-semibold">C: Deskripsi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['KP01', 'Partisipasi (Quiz)', 'Penilaian partisipasi mahasiswa'],
                      ['KP02', 'Observasi (Praktik / Tugas)', 'Penilaian praktik dan tugas'],
                    ].map(([a, b, c]) => (
                      <tr key={a} className="bg-white">
                        <td className="px-2 py-1 border border-gray-200 font-mono">{a}</td>
                        <td className="px-2 py-1 border border-gray-200">{b}</td>
                        <td className="px-2 py-1 border border-gray-200 text-gray-400">{c}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {importStep === 2 && !importProgress && !importResult && (
            <div className="space-y-4">
              <input ref={importFileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />
              <button
                onClick={() => importFileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-primary hover:text-primary transition-colors"
              >
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
                            <th className="px-3 py-2 text-left font-semibold text-gray-600 w-24">Kode</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Nama / Error</th>
                            <th className="px-2 py-2 text-center w-8">✓</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importRows.map((row, i) => (
                            <tr key={i} className={`border-b border-gray-50 ${!row.valid ? 'bg-red-50' : ''}`}>
                              <td className="px-3 py-2 font-mono">{row.code || '—'}</td>
                              <td className="px-3 py-2">
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
                  <span>Mengimpor komponen...</span>
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
            <div className={`p-4 rounded-xl border ${importResult.failed.length === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={18} className={importResult.failed.length === 0 ? 'text-emerald-600' : 'text-yellow-600'} />
                <p className="text-sm font-semibold">Import Selesai</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Total Data',  value: importRows.length,       color: 'text-gray-700' },
                  { label: 'Berhasil',    value: importResult.success,    color: 'text-emerald-600' },
                  { label: 'Gagal',       value: importResult.failed.length, color: importResult.failed.length > 0 ? 'text-red-500' : 'text-gray-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white rounded-lg p-2 border border-gray-100">
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              {importResult.failed.length > 0 && (
                <p className="text-xs mt-2 text-gray-600">Gagal: {importResult.failed.join(', ')}</p>
              )}
            </div>
          )}
        </div>
      </Drawer>

    </div>
  );
}
