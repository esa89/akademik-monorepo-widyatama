import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Input, Button, Drawer } from '@widyatama/ui';
import type { DataTableOptions, Header } from '@widyatama/ui';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { academicSemesterService } from '@/services/academicSemester.service';
import type { AcademicSemester, SemesterType } from '@/types';
import {
  Search, Plus, Pencil, Trash2, Star, CalendarDays,
  CalendarCheck, CheckCircle2, XCircle, Wand2,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const SELECT_CLS = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white';
const LABEL_CLS  = 'block text-sm font-medium text-gray-700 mb-1.5';

const SEMESTER_TYPE_LABELS: Record<SemesterType, string> = {
  GANJIL: 'Ganjil',
  GENAP:  'Genap',
  PENDEK: 'Pendek',
};

const EMPTY_FORM = {
  code: '', name: '', academicYear: '',
  semesterType: 'GANJIL' as SemesterType,
  startDate: '', endDate: '',
};

type FormState  = typeof EMPTY_FORM;
type FormErrors = Partial<Record<keyof FormState | 'api', string>>;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AcademicSemesterPage() {
  const queryClient = useQueryClient();

  const [search, setSearch]   = useState('');
  const debouncedSearch       = useDebounce(search);
  const [options, setOptions] = useState<DataTableOptions<AcademicSemester>>({
    page: 1, itemsPerPage: 10, sortBy: 'createdAt' as keyof AcademicSemester, sortDesc: true,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched]       = useState<Partial<Record<keyof FormState, boolean>>>({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [toastMsg, setToastMsg]       = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['academic-semesters', options.page, options.itemsPerPage, debouncedSearch],
    queryFn:  () => academicSemesterService.getAll({
      page: options.page, limit: options.itemsPerPage,
      search: debouncedSearch || undefined,
    }),
  });

  const { data: currentData } = useQuery({
    queryKey: ['academic-semesters', 'current-count'],
    queryFn:  () => academicSemesterService.getAll({ isCurrent: true, limit: 1 }),
  });

  const { data: lastSemData } = useQuery({
    queryKey: ['academic-semesters', 'last-for-autofill'],
    queryFn:  () => academicSemesterService.getAll({ limit: 1, sortBy: 'startDate', sortOrder: 'desc' }),
    enabled:  drawerOpen && !editingId,
  });
  const lastSem = lastSemData?.data?.[0];

  // ─── Mutations ────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (payload: FormState) =>
      academicSemesterService.create({
        code:         payload.code,
        name:         payload.name,
        academicYear: payload.academicYear,
        semesterType: payload.semesterType,
        startDate:    payload.startDate,
        endDate:      payload.endDate,
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-semesters'] });
      setDrawerOpen(false); resetForm();
      showToast('success', 'Semester akademik berhasil ditambahkan.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      setFormErrors((p) => ({ ...p, api: Array.isArray(msg) ? msg.join(', ') : msg || 'Gagal menyimpan data' }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FormState> }) =>
      academicSemesterService.update(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-semesters'] });
      setDrawerOpen(false); resetForm();
      showToast('success', 'Semester akademik berhasil diperbarui.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      setFormErrors((p) => ({ ...p, api: Array.isArray(msg) ? msg.join(', ') : msg || 'Gagal memperbarui data' }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: academicSemesterService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-semesters'] });
      setConfirmOpen(false);
      showToast('success', 'Semester akademik berhasil dihapus.');
    },
  });

  const setCurrentMutation = useMutation({
    mutationFn: academicSemesterService.setCurrent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-semesters'] });
      showToast('success', 'Semester aktif berhasil diperbarui.');
    },
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM); setFormErrors({}); setTouched({}); setEditingId(null);
  };

  const openCreate = () => { resetForm(); setDrawerOpen(true); };

  const openEdit = (item: AcademicSemester) => {
    setEditingId(item.id);
    setForm({
      code:         item.code,
      name:         item.name,
      academicYear: item.academicYear,
      semesterType: item.semesterType,
      startDate:    item.startDate.slice(0, 10),
      endDate:      item.endDate.slice(0, 10),
    });
    setDrawerOpen(true);
  };

  const autoFillFromLast = () => {
    if (!lastSem) return;

    const { semesterType: prevType, academicYear: prevYear, endDate: prevEnd } = lastSem;
    const [y1Str, y2Str] = prevYear.split('/');
    const y1 = Number(y1Str);
    const y2 = Number(y2Str);

    // Aturan urutan semester:
    // GANJIL → GENAP (tahun akademik sama)
    // GENAP  → GANJIL (tahun akademik baru); user bisa ubah ke PENDEK manual
    // PENDEK → GENAP (tahun akademik sama)
    let nextType: SemesterType;
    let nextYear: string;

    if (prevType === 'GANJIL') {
      nextType = 'GENAP';
      nextYear = prevYear;
    } else if (prevType === 'GENAP') {
      nextType = 'GANJIL';
      nextYear = `${y1 + 1}/${y2 + 1}`;
    } else {
      nextType = 'GENAP';
      nextYear = prevYear;
    }

    // Tanggal: mulai = akhir semester lalu + 1 hari
    const [ey, em, ed] = prevEnd.slice(0, 10).split('-').map(Number);
    const startDate = new Date(ey, em - 1, ed + 1);
    const endDate   = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + (nextType === 'PENDEK' ? 2 : 5));
    endDate.setDate(endDate.getDate() - 1);

    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const y1Next = Number(nextYear.split('/')[0]);
    const label  = { GANJIL: 'Ganjil', GENAP: 'Genap', PENDEK: 'Pendek' }[nextType];

    setForm({
      semesterType: nextType,
      academicYear: nextYear,
      code:         `${y1Next}-${nextType}`,
      name:         `Semester ${label} ${nextYear}`,
      startDate:    fmt(startDate),
      endDate:      fmt(endDate),
    });
    setFormErrors({});
    setTouched({});
  };

  const validateField = (field: keyof FormState, value: string): string | undefined => {
    switch (field) {
      case 'code':         return !value.trim() ? 'Kode wajib diisi' : undefined;
      case 'name':         return !value.trim() ? 'Nama wajib diisi' : value.trim().length < 3 ? 'Minimal 3 karakter' : undefined;
      case 'academicYear': {
        if (!value.trim()) return 'Tahun akademik wajib diisi';
        if (!/^\d{4}\/\d{4}$/.test(value)) return 'Format harus YYYY/YYYY, contoh: 2024/2025';
        return undefined;
      }
      case 'startDate': return !value ? 'Tanggal mulai wajib diisi' : undefined;
      case 'endDate':   return !value ? 'Tanggal selesai wajib diisi' : undefined;
      default: return undefined;
    }
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setFormErrors((p) => ({ ...p, [field]: validateField(field, value), api: undefined }));
    }
  };

  const handleBlur = (field: keyof FormState) => {
    setTouched((p) => ({ ...p, [field]: true }));
    setFormErrors((p) => ({ ...p, [field]: validateField(field, form[field] as string) }));
  };

  const handleSubmit = () => {
    const fields: (keyof FormState)[] = ['code', 'name', 'academicYear', 'startDate', 'endDate'];
    const errs: FormErrors = {};
    fields.forEach((f) => {
      const err = validateField(f, form[f] as string);
      if (err) errs[f] = err;
    });
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      setTouched(Object.fromEntries(fields.map((f) => [f, true])));
      return;
    }

    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(form);
  };

  // ─── Table Headers ────────────────────────────────────────────────────────

  const headers: Header<AcademicSemester>[] = [
    {
      key: 'code', title: 'Kode', sortable: true,
      render: (item) => <span className="font-mono text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded">{item.code}</span>,
    },
    { key: 'name', title: 'Nama', sortable: true },
    { key: 'academicYear', title: 'Tahun Akademik', sortable: true },
    {
      key: 'semesterType', title: 'Tipe',
      render: (item) => (
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium">
          {SEMESTER_TYPE_LABELS[item.semesterType]}
        </span>
      ),
    },
    {
      key: 'startDate', title: 'Mulai',
      render: (item) => <span className="text-xs text-gray-600">{new Date(item.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>,
    },
    {
      key: 'endDate', title: 'Selesai',
      render: (item) => <span className="text-xs text-gray-600">{new Date(item.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>,
    },
    {
      key: 'isCurrent', title: 'Semester Aktif',
      render: (item) => item.isCurrent
        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200"><Star size={10} />Berjalan</span>
        : <span className="text-xs text-gray-400">—</span>,
    },
    {
      key: 'id', title: 'Aksi',
      render: (item) => (
        <div className="flex items-center gap-1">
          {!item.isCurrent && (
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentMutation.mutate(item.id); }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              title="Jadikan semester berjalan"
            >
              <Star size={14} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(item); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); setConfirmOpen(true); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Hapus"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const total        = data?.meta?.total ?? 0;
  const currentTotal = currentData?.meta?.total ?? 0;
  const isSaving     = createMutation.isPending || updateMutation.isPending;

  // ─── Render ───────────────────────────────────────────────────────────────

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

      <PageHeader
        title="Semester Akademik"
        description="Kelola data semester akademik kampus"
        action={{ label: 'Tambah Semester', onClick: openCreate, icon: <Plus size={16} /> }}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total Semester"    value={total}        icon={<CalendarDays size={18} />}  color="blue"   />
        <StatCard label="Semester Berjalan" value={currentTotal} icon={<CalendarCheck size={18} />} color="yellow" />
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text" placeholder="Cari kode atau nama semester..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
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
        title={editingId ? 'Edit Semester Akademik' : 'Tambah Semester Akademik'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setDrawerOpen(false); resetForm(); }}>Batal</Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Tambah Semester')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-1">

          {/* Auto-fill dari semester terakhir — hanya saat create */}
          {!editingId && (
            <button
              type="button"
              onClick={autoFillFromLast}
              disabled={!lastSem}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border-2 border-dashed
                ${lastSem
                  ? 'border-primary/40 text-primary hover:bg-primary/5 hover:border-primary'
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'}`}
              title={lastSem ? `Isi otomatis berdasarkan: ${lastSem.name}` : 'Belum ada data semester sebelumnya'}
            >
              <Wand2 size={15} />
              {lastSem
                ? <>Isi dari semester terakhir <span className="opacity-60 font-normal">({lastSem.name})</span></>
                : 'Belum ada semester sebelumnya'}
            </button>
          )}

          {/* API Error */}
          {formErrors.api && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <XCircle size={15} className="shrink-0" /> {formErrors.api}
            </div>
          )}

          <div>
            <label className={LABEL_CLS}>Kode Semester <span className="text-red-500">*</span></label>
            <Input
              value={form.code}
              onChange={(e) => handleChange('code', e.target.value)}
              onBlur={() => handleBlur('code')}
              placeholder="Contoh: 2024-GANJIL"
              className={formErrors.code ? 'border-red-400' : ''}
            />
            {formErrors.code && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.code}</p>}
          </div>

          <div>
            <label className={LABEL_CLS}>Nama Semester <span className="text-red-500">*</span></label>
            <Input
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="Contoh: Semester Ganjil 2024/2025"
              className={formErrors.name ? 'border-red-400' : ''}
            />
            {formErrors.name && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.name}</p>}
          </div>

          <div>
            <label className={LABEL_CLS}>Tahun Akademik <span className="text-red-500">*</span></label>
            <Input
              value={form.academicYear}
              onChange={(e) => handleChange('academicYear', e.target.value)}
              onBlur={() => handleBlur('academicYear')}
              placeholder="2024/2025"
              className={formErrors.academicYear ? 'border-red-400' : ''}
            />
            {formErrors.academicYear
              ? <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.academicYear}</p>
              : <p className="mt-1 text-xs text-gray-400">Format: YYYY/YYYY, contoh: 2024/2025</p>
            }
          </div>

          <div>
            <label className={LABEL_CLS}>Tipe Semester <span className="text-red-500">*</span></label>
            <select
              value={form.semesterType}
              onChange={(e) => handleChange('semesterType', e.target.value)}
              className={SELECT_CLS}
            >
              <option value="GANJIL">Ganjil</option>
              <option value="GENAP">Genap</option>
              <option value="PENDEK">Pendek</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Tanggal Mulai <span className="text-red-500">*</span></label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                onBlur={() => handleBlur('startDate')}
                className={formErrors.startDate ? 'border-red-400' : ''}
              />
              {formErrors.startDate && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.startDate}</p>}
            </div>
            <div>
              <label className={LABEL_CLS}>Tanggal Selesai <span className="text-red-500">*</span></label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                onBlur={() => handleBlur('endDate')}
                className={formErrors.endDate ? 'border-red-400' : ''}
              />
              {formErrors.endDate && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.endDate}</p>}
            </div>
          </div>
        </div>
      </Drawer>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Hapus Semester Akademik"
        description="Apakah Anda yakin ingin menghapus semester ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
