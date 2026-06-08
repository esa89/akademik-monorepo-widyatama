import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Input, Button, Drawer, Switch, Modal, Combobox } from '@widyatama/ui';
import type { DataTableOptions, Header } from '@widyatama/ui';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { graduateProfileService, cplService } from '@/services/obe.service';
import { CPL_CATEGORY_LABELS } from '@/constants';
import type { GraduateProfile, Cpl } from '@/types';
import {
  Eye, Search, Plus, Pencil, Trash2,
  CheckCircle2, XCircle, BookOpen, Target,
  Link2, X,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const LABEL_CLS = 'block text-sm font-medium text-gray-700 mb-1.5';
const TEXTAREA_CLS = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  code: '',
  name: '',
  description: '',
  vision: '',
  mission: '',
  curriculumYear: new Date().getFullYear(),
  isActive: true,
};

type FormState = typeof EMPTY_FORM;
type FormErrors = Partial<Record<keyof FormState | 'api', string>>;

function truncate(text: string | null, max = 80) {
  if (!text) return '—';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function VisiMisiPage() {
  const queryClient = useQueryClient();

  const [search, setSearch]     = useState('');
  const debouncedSearch         = useDebounce(search);
  const [options, setOptions]   = useState<DataTableOptions<GraduateProfile>>({
    page: 1, itemsPerPage: 10, sortBy: 'code' as keyof GraduateProfile, sortDesc: false,
  });
  const [filterStatus, setFilterStatus] = useState('');

  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [form, setForm]               = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState<FormErrors>({});
  const [touched, setTouched]         = useState<Partial<Record<keyof FormState, boolean>>>({});

  const [detailOpen, setDetailOpen]         = useState(false);
  const [detailItem, setDetailItem]         = useState<GraduateProfile | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId]             = useState<string | null>(null);
  const [toastMsg, setToastMsg]             = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ─── CPL Mapping state ───────────────────────────────────────────────────
  const [cplMapOpen, setCplMapOpen]         = useState(false);
  const [cplMapProfile, setCplMapProfile]   = useState<GraduateProfile | null>(null);
  const [linkCplId, setLinkCplId]           = useState('');
  const [showNewCplForm, setShowNewCplForm] = useState(false);
  const [newCplForm, setNewCplForm]         = useState({ code: '', name: '', category: 'SIKAP', description: '' });

  // ─── Queries ─────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['graduate-profiles', options.page, options.itemsPerPage, debouncedSearch, filterStatus],
    queryFn: () => graduateProfileService.getAll({
      page: options.page, limit: options.itemsPerPage,
      search: debouncedSearch || undefined,
      isActive: filterStatus === '' ? undefined : filterStatus === 'true',
      sortBy: String(options.sortBy),
      sortOrder: options.sortDesc ? 'desc' : 'asc',
    }),
  });

  const { data: activeData } = useQuery({
    queryKey: ['graduate-profiles', 'stat-active'],
    queryFn:  () => graduateProfileService.getAll({ isActive: true, limit: 1 }),
  });

  const { data: mappedCplsData, isLoading: mappedLoading } = useQuery({
    queryKey: ['cpl', 'mapped-profile', cplMapProfile?.id],
    queryFn:  () => cplService.getAll({ graduateProfileId: cplMapProfile!.id, limit: 100 }),
    enabled:  !!cplMapProfile?.id,
  });

  const { data: allCplsData } = useQuery({
    queryKey: ['cpl', 'all-assign'],
    queryFn:  () => cplService.getAll({ limit: 100 }),
    enabled:  cplMapOpen,
  });

  // ─── Mutations ────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => graduateProfileService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graduate-profiles'] });
      setDrawerOpen(false);
      resetForm();
      showToast('success', 'Profil lulusan (visi & misi) berhasil dibuat.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal menyimpan data';
      setFormErrors((p) => ({ ...p, api: msg }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      graduateProfileService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graduate-profiles'] });
      setDrawerOpen(false);
      resetForm();
      showToast('success', 'Profil lulusan (visi & misi) berhasil diperbarui.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal memperbarui data';
      setFormErrors((p) => ({ ...p, api: msg }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => graduateProfileService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graduate-profiles'] });
      setConfirmDeleteOpen(false);
      showToast('success', 'Profil lulusan berhasil dihapus.');
    },
    onError: (err: any) => {
      setConfirmDeleteOpen(false);
      showToast('error', err.response?.data?.message || 'Gagal menghapus data.');
    },
  });

  const unlinkCplMutation = useMutation({
    mutationFn: (cplId: string) => cplService.update(cplId, { graduateProfileId: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpl', 'mapped-profile', cplMapProfile?.id] });
      queryClient.invalidateQueries({ queryKey: ['graduate-profiles'] });
    },
  });

  const linkCplMutation = useMutation({
    mutationFn: (cplId: string) => cplService.update(cplId, { graduateProfileId: cplMapProfile!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpl', 'mapped-profile', cplMapProfile?.id] });
      queryClient.invalidateQueries({ queryKey: ['graduate-profiles'] });
      setLinkCplId('');
    },
  });

  const createCplMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => cplService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cpl', 'mapped-profile', cplMapProfile?.id] });
      queryClient.invalidateQueries({ queryKey: ['graduate-profiles'] });
      setNewCplForm({ code: '', name: '', category: 'SIKAP', description: '' });
      setShowNewCplForm(false);
      showToast('success', 'CPL baru berhasil dibuat dan dipetakan.');
    },
    onError: (err: any) => {
      showToast('error', err.response?.data?.message || 'Gagal membuat CPL.');
    },
  });

  const openCplMap = (profile: GraduateProfile) => {
    setCplMapProfile(profile);
    setCplMapOpen(true);
    setLinkCplId('');
    setShowNewCplForm(false);
    setNewCplForm({ code: '', name: '', category: 'SIKAP', description: '' });
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setTouched({});
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setDrawerOpen(true); };

  const openEdit = (row: GraduateProfile) => {
    setEditingId(row.id);
    setForm({
      code:           row.code,
      name:           row.name,
      description:    row.description ?? '',
      vision:         row.vision ?? '',
      mission:        row.mission ?? '',
      curriculumYear: row.curriculumYear,
      isActive:       row.isActive,
    });
    setFormErrors({});
    setTouched({});
    setDrawerOpen(true);
  };

  const handleFormChange = (field: keyof FormState, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const err = validateField(field, value);
      setFormErrors((p) => ({ ...p, [field]: err, api: undefined }));
    } else {
      setFormErrors((p) => ({ ...p, api: undefined }));
    }
  };

  const handleBlur = (field: keyof FormState) => {
    setTouched((p) => ({ ...p, [field]: true }));
    const err = validateField(field, form[field]);
    setFormErrors((p) => ({ ...p, [field]: err }));
  };

  const validateField = (field: keyof FormState, value: string | number | boolean | undefined): string | undefined => {
    switch (field) {
      case 'code': return !String(value ?? '').trim() ? 'Kode wajib diisi' : undefined;
      case 'name': return !String(value ?? '').trim() ? 'Nama wajib diisi' : undefined;
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
    if (!form.code.trim()) errs.code = 'Kode wajib diisi';
    if (!form.name.trim()) errs.name = 'Nama wajib diisi';
    if (!form.curriculumYear) {
      errs.curriculumYear = 'Tahun kurikulum wajib diisi';
    } else if (form.curriculumYear < 2000 || form.curriculumYear > 2100) {
      errs.curriculumYear = 'Tahun harus antara 2000–2100';
    }
    return errs;
  };

  const handleSubmit = () => {
    const errs = validateForm();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    const payload: Record<string, unknown> = {
      code:           form.code.trim(),
      name:           form.name.trim(),
      curriculumYear: Number(form.curriculumYear),
      isActive:       form.isActive,
      description:    form.description.trim() || undefined,
      vision:         form.vision.trim() || undefined,
      mission:        form.mission.trim() || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // ─── Table Headers ────────────────────────────────────────────────────────

  const headers: Header<GraduateProfile>[] = [
    {
      key: 'code', title: 'Kode', sortable: true,
      render: (row) => (
        <span
          className="font-mono text-xs font-semibold text-primary cursor-pointer hover:underline"
          onClick={() => { setDetailItem(row); setDetailOpen(true); }}
        >
          {row.code}
        </span>
      ),
    },
    {
      key: 'name', title: 'Nama Profil', sortable: true,
      render: (row) => (
        <div className="cursor-pointer" onClick={() => { setDetailItem(row); setDetailOpen(true); }}>
          <p className="text-sm font-semibold text-gray-800 hover:text-primary">{row.name}</p>
          {row.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{row.description}</p>}
        </div>
      ),
    },
    {
      key: 'vision', title: 'Visi',
      render: (row) => (
        <p className="text-xs text-gray-600 max-w-[240px] line-clamp-2 leading-relaxed">
          {truncate(row.vision, 100)}
        </p>
      ),
    },
    {
      key: 'mission', title: 'Misi',
      render: (row) => (
        <p className="text-xs text-gray-600 max-w-[240px] line-clamp-2 leading-relaxed">
          {truncate(row.mission, 100)}
        </p>
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
      key: 'isActive', title: 'Status',
      render: (row) => <StatusBadge active={row.isActive} />,
    },
    {
      key: 'totalCpl' as keyof GraduateProfile, title: 'CPL',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); openCplMap(row); }}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
          title="Kelola pemetaan CPL"
        >
          <Target size={11} />
          {row.totalCpl} CPL
        </button>
      ),
    },
    {
      key: 'id', title: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openCplMap(row); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
            title="Pemetaan CPL"
          >
            <Link2 size={14} />
          </button>
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

  const total       = data?.meta?.total ?? 0;
  const activeTotal = activeData?.meta?.total ?? 0;

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
        title="Visi & Misi Program Studi"
        description="Kelola visi, misi, dan profil lulusan program studi"
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Visi & Misi' }]}
        action={{ label: 'Tambah Profil', onClick: openCreate, icon: <Plus size={16} /> }}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><Target size={20} /></div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{total}</p>
            <p className="text-xs text-gray-500">Total Profil</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600"><BookOpen size={20} /></div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{activeTotal}</p>
            <p className="text-xs text-gray-500">Profil Aktif</p>
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
              placeholder="Cari kode atau nama profil..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
          >
            <option value="">Semua Status</option>
            <option value="true">Aktif</option>
            <option value="false">Tidak Aktif</option>
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

      {/* ─── Create / Edit Drawer ──────────────────────────────────────────── */}
      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); resetForm(); }}
        title={editingId ? 'Edit Profil Lulusan' : 'Tambah Profil Lulusan'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setDrawerOpen(false); resetForm(); }}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Buat Profil'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6 p-1">

          {/* API Error */}
          {formErrors.api && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <XCircle size={15} className="shrink-0" /> {formErrors.api}
            </div>
          )}

          {/* Section 1: Data Profil */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Target size={15} className="text-primary" /> Data Profil
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className={LABEL_CLS}>Kode <span className="text-red-500">*</span></label>
                <Input
                  value={form.code}
                  onChange={(e) => handleFormChange('code', e.target.value)}
                  onBlur={() => handleBlur('code')}
                  placeholder="PL-01"
                  className={formErrors.code ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}
                />
                {formErrors.code && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.code}</p>}
              </div>

              <div>
                <label className={LABEL_CLS}>Tahun Kurikulum <span className="text-red-500">*</span></label>
                <Input
                  type="number"
                  value={form.curriculumYear}
                  onChange={(e) => handleFormChange('curriculumYear', Number(e.target.value))}
                  onBlur={() => handleBlur('curriculumYear')}
                  placeholder="2025"
                  min={2000}
                  max={2100}
                  className={formErrors.curriculumYear ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}
                />
                {formErrors.curriculumYear && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.curriculumYear}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL_CLS}>Nama Profil <span className="text-red-500">*</span></label>
                <Input
                  value={form.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  placeholder="Sarjana Informatika"
                  className={formErrors.name ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}
                />
                {formErrors.name && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.name}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL_CLS}>Deskripsi <span className="text-gray-400 font-normal">(opsional)</span></label>
                <Input
                  value={form.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Deskripsi singkat profil lulusan..."
                />
              </div>

              <div className="flex items-center gap-3 sm:col-span-2">
                <Switch checked={form.isActive} onCheckedChange={(v) => handleFormChange('isActive', v)} />
                <label className="text-sm font-medium text-gray-700">Status Aktif</label>
              </div>
            </div>
          </div>

          {/* Section 2: Visi */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Target size={15} className="text-yellow-500" /> Visi
            </h3>
            <div>
              <label className={LABEL_CLS}>Pernyataan Visi <span className="text-gray-400 font-normal">(opsional)</span></label>
              <textarea
                rows={4}
                value={form.vision}
                onChange={(e) => handleFormChange('vision', e.target.value)}
                placeholder="Tuliskan visi program studi..."
                className={TEXTAREA_CLS}
              />
              <p className="mt-1 text-xs text-gray-400">{form.vision.length} karakter</p>
            </div>
          </div>

          {/* Section 3: Misi */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <BookOpen size={15} className="text-orange-500" /> Misi
            </h3>
            <div>
              <label className={LABEL_CLS}>Pernyataan Misi <span className="text-gray-400 font-normal">(opsional)</span></label>
              <textarea
                rows={8}
                value={form.mission}
                onChange={(e) => handleFormChange('mission', e.target.value)}
                placeholder={'Tuliskan misi program studi...\nContoh:\n1. Menyelenggarakan pendidikan berkualitas...\n2. Melaksanakan penelitian...'}
                className={TEXTAREA_CLS}
              />
              <p className="mt-1 text-xs text-gray-400">{form.mission.length} karakter</p>
            </div>
          </div>

        </div>
      </Drawer>

      {/* ─── Detail Drawer ─────────────────────────────────────────────────── */}
      <Drawer
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailItem(null); }}
        title="Detail Visi & Misi"
        footer={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDetailOpen(false);
                if (detailItem) openEdit(detailItem);
              }}
            >
              <Pencil size={14} className="mr-1" /> Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (detailItem) { setDeleteId(detailItem.id); setConfirmDeleteOpen(true); setDetailOpen(false); }
              }}
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
                {detailItem.code.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">{detailItem.name}</h2>
                <p className="text-xs text-gray-400 font-mono">{detailItem.code} · Kurikulum {detailItem.curriculumYear}</p>
                <div className="mt-1"><StatusBadge active={detailItem.isActive} /></div>
              </div>
            </div>

            {detailItem.description && (
              <div className="py-2 border-b border-gray-50">
                <p className="text-xs font-medium text-gray-400 mb-1">Deskripsi</p>
                <p className="text-sm text-gray-700">{detailItem.description}</p>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Visi</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                {detailItem.vision ? (
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{detailItem.vision}</p>
                ) : (
                  <p className="text-xs text-gray-400 italic">Belum diisi</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Misi</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                {detailItem.mission ? (
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{detailItem.mission}</p>
                ) : (
                  <p className="text-xs text-gray-400 italic">Belum diisi</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 py-2 border-t border-gray-50 pt-4">
              <span className="text-xs font-medium text-gray-400 w-28 shrink-0">Dibuat</span>
              <span className="text-xs text-gray-600">{new Date(detailItem.createdAt).toLocaleString('id-ID')}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Memuat...</div>
        )}
      </Drawer>

      {/* ─── CPL Mapping Modal ────────────────────────────────────────────── */}
      <Modal
        open={cplMapOpen}
        onOpenChange={(open) => { if (!open) { setCplMapOpen(false); setCplMapProfile(null); } }}
        title={`Pemetaan CPL — ${cplMapProfile?.name ?? ''}`}
      >
        <div className="space-y-5">

          {/* Section 1: CPL yang sudah terpetakan */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">CPL Terpetakan</p>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {mappedCplsData?.data?.length ?? 0} CPL
              </span>
            </div>

            {mappedLoading ? (
              <div className="text-xs text-center text-gray-400 py-6">Memuat...</div>
            ) : (mappedCplsData?.data?.length ?? 0) === 0 ? (
              <div className="text-xs text-center text-gray-400 py-6 border border-dashed border-gray-200 rounded-xl">
                Belum ada CPL yang dipetakan ke profil ini
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {(mappedCplsData?.data as Cpl[] ?? []).map((cpl) => (
                  <div key={cpl.id} className="flex items-center justify-between gap-2 px-3 py-2.5 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-bold text-primary shrink-0">{cpl.code}</span>
                      <span className="text-sm text-gray-700 truncate">{cpl.name}</span>
                      <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-medium">
                        {CPL_CATEGORY_LABELS[cpl.category] ?? cpl.category}
                      </span>
                    </div>
                    <button
                      onClick={() => unlinkCplMutation.mutate(cpl.id)}
                      disabled={unlinkCplMutation.isPending}
                      className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                      title="Lepas pemetaan"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Tambah pemetaan */}
          <div className="border-t pt-5 space-y-4">
            <p className="text-sm font-semibold text-gray-700">Tambah Pemetaan</p>

            {/* Link CPL existing */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Hubungkan CPL yang sudah ada</p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Combobox
                    placeholder="Pilih CPL..."
                    value={linkCplId}
                    onChange={setLinkCplId}
                    options={(allCplsData?.data as Cpl[] ?? [])
                      .filter((c) => !(mappedCplsData?.data as Cpl[] ?? []).some((m) => m.id === c.id))
                      .map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }))}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!linkCplId || linkCplMutation.isPending}
                  onClick={() => linkCplId && linkCplMutation.mutate(linkCplId)}
                >
                  {linkCplMutation.isPending ? 'Menghubungkan...' : 'Hubungkan'}
                </Button>
              </div>
            </div>

            {/* Create new CPL */}
            {!showNewCplForm ? (
              <button
                onClick={() => setShowNewCplForm(true)}
                className="flex items-center gap-2 text-sm text-primary hover:underline font-medium"
              >
                <Plus size={14} /> Buat CPL baru dan petakan
              </button>
            ) : (
              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                  <Plus size={12} /> CPL Baru
                  <span className="font-normal text-gray-400">
                    — akan dipetakan ke {cplMapProfile?.name}
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Kode"
                    placeholder="CPL-01"
                    value={newCplForm.code}
                    onChange={(e) => setNewCplForm((p) => ({ ...p, code: e.target.value }))}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
                    <select
                      value={newCplForm.category}
                      onChange={(e) => setNewCplForm((p) => ({ ...p, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      {Object.entries(CPL_CATEGORY_LABELS).map(([val, lbl]) => (
                        <option key={val} value={val}>{lbl}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Input
                  label="Nama CPL"
                  placeholder="Mampu menerapkan..."
                  value={newCplForm.name}
                  onChange={(e) => setNewCplForm((p) => ({ ...p, name: e.target.value }))}
                />
                <Input
                  label="Deskripsi (opsional)"
                  placeholder="Deskripsi singkat..."
                  value={newCplForm.description}
                  onChange={(e) => setNewCplForm((p) => ({ ...p, description: e.target.value }))}
                />
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setShowNewCplForm(false)}>Batal</Button>
                  <Button
                    size="sm"
                    disabled={!newCplForm.code.trim() || !newCplForm.name.trim() || createCplMutation.isPending}
                    onClick={() => cplMapProfile && createCplMutation.mutate({
                      code: newCplForm.code.trim(),
                      name: newCplForm.name.trim(),
                      category: newCplForm.category,
                      description: newCplForm.description.trim() || undefined,
                      curriculumYear: cplMapProfile.curriculumYear,
                      graduateProfileId: cplMapProfile.id,
                    })}
                  >
                    {createCplMutation.isPending ? 'Menyimpan...' : 'Buat & Petakan'}
                  </Button>
                </div>
              </div>
            )}
          </div>

        </div>
      </Modal>

      {/* ─── Confirm Delete ───────────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Hapus Profil Lulusan"
        description="Apakah Anda yakin ingin menghapus profil ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
