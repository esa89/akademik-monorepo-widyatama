import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Input, Button, Drawer, Switch } from '@widyatama/ui';
import type { DataTableOptions, Header } from '@widyatama/ui';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { lecturerService } from '@/services/lecturer.service';
import { facultyService } from '@/services/faculty.service';
import { studyProgramService } from '@/services/studyProgram.service';
import type { Lecturer, AuthentikStatus } from '@/types';
import {
  Users, Search, Plus, Pencil, Trash2, RefreshCw, KeyRound,
  GraduationCap, CheckCircle2, AlertCircle, XCircle, UserCheck,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const LAST_EDUCATION_OPTIONS = [
  { value: 'S1', label: 'S1' }, { value: 'S2', label: 'S2' }, { value: 'S3', label: 'S3' },
  { value: 'D4', label: 'D4' }, { value: 'PROFESI', label: 'Profesi' },
  { value: 'SPESIALIS_1', label: 'Spesialis 1' }, { value: 'SPESIALIS_2', label: 'Spesialis 2' },
  { value: 'LAINNYA', label: 'Lainnya' },
];

const ACADEMIC_POSITION_OPTIONS = [
  { value: 'TENAGA_PENGAJAR', label: 'Tenaga Pengajar' },
  { value: 'ASISTEN_AHLI', label: 'Asisten Ahli' },
  { value: 'LEKTOR', label: 'Lektor' },
  { value: 'LEKTOR_KEPALA', label: 'Lektor Kepala' },
  { value: 'GURU_BESAR', label: 'Guru Besar' },
];

const SELECT_CLS = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white';
const LABEL_CLS = 'block text-sm font-medium text-gray-700 mb-1.5';

// ─── Sub-components ───────────────────────────────────────────────────────────

function AuthentikBadge({ status }: { status: AuthentikStatus }) {
  const map: Record<AuthentikStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    ACTIVE:     { label: 'Active',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={11} /> },
    NOT_SYNCED: { label: 'Not Synced',  cls: 'bg-yellow-50 text-yellow-700 border-yellow-200',   icon: <AlertCircle size={11} /> },
    DISABLED:   { label: 'Disabled',    cls: 'bg-red-50 text-red-600 border-red-200',             icon: <XCircle size={11} /> },
  };
  const { label, cls, icon } = map[status] ?? map.NOT_SYNCED;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}>
      {icon}{label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const EMPTY_FORM = {
  nidn: '', nrk: '', name: '', frontTitle: '', backTitle: '',
  email: '', phoneNumber: '', lastEducation: 'S2', academicPosition: 'TENAGA_PENGAJAR',
  facultyId: '', studyProgramId: '', isActive: true, username: '', password: '', confirmPassword: '',
};

type FormState = typeof EMPTY_FORM;

export default function LecturerPage() {
  const queryClient = useQueryClient();

  // List state
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [options, setOptions] = useState<DataTableOptions<Lecturer>>({
    page: 1, itemsPerPage: 10, sortBy: 'name' as keyof Lecturer, sortDesc: false,
  });
  const [filterFacultyId, setFilterFacultyId] = useState('');
  const [filterStudyProgramId, setFilterStudyProgramId] = useState('');
  const [filterLastEdu, setFilterLastEdu] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAuthentik, setFilterAuthentik] = useState('');

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState | 'api', string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [drawerStudyProgramId, setDrawerStudyProgramId] = useState('');

  // Detail / action state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resetPwdOpen, setResetPwdOpen] = useState(false);
  const [resetPwdId, setResetPwdId] = useState<string | null>(null);
  const [resetPwd, setResetPwd] = useState({ newPassword: '', confirm: '' });
  const [syncId, setSyncId] = useState<string | null>(null);
  const [confirmSyncOpen, setConfirmSyncOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['lecturers', options.page, options.itemsPerPage, debouncedSearch,
      filterFacultyId, filterStudyProgramId, filterLastEdu, filterStatus, filterAuthentik],
    queryFn: () => lecturerService.getAll({
      page: options.page, limit: options.itemsPerPage,
      search: debouncedSearch || undefined,
      facultyId: filterFacultyId || undefined,
      studyProgramId: filterStudyProgramId || undefined,
      lastEducation: filterLastEdu || undefined,
      isActive: filterStatus === '' ? undefined : filterStatus === 'true',
      authentikStatus: filterAuthentik || undefined,
    }),
  });

  const { data: activeData } = useQuery({
    queryKey: ['lecturers', 'stat-active'],
    queryFn: () => lecturerService.getAll({ isActive: true, limit: 1 }),
  });

  const { data: syncedData } = useQuery({
    queryKey: ['lecturers', 'stat-synced'],
    queryFn: () => lecturerService.getAll({ authentikStatus: 'ACTIVE', limit: 1 }),
  });

  const { data: notSyncedData } = useQuery({
    queryKey: ['lecturers', 'stat-not-synced'],
    queryFn: () => lecturerService.getAll({ authentikStatus: 'NOT_SYNCED', limit: 1 }),
  });

  const { data: faculties } = useQuery({
    queryKey: ['faculties', 'all'],
    queryFn: () => facultyService.getAll({ page: 1, limit: 100 }),
  });

  const { data: drawerStudyPrograms } = useQuery({
    queryKey: ['study-programs', 'drawer', form.facultyId],
    queryFn: () => studyProgramService.getAll({ page: 1, limit: 100, facultyId: form.facultyId }),
    enabled: drawerOpen && !!form.facultyId,
  });

  const { data: filterStudyPrograms } = useQuery({
    queryKey: ['study-programs', 'filter', filterFacultyId],
    queryFn: () => studyProgramService.getAll({ page: 1, limit: 100, facultyId: filterFacultyId }),
    enabled: !!filterFacultyId,
  });

  const { data: detailData } = useQuery({
    queryKey: ['lecturers', 'detail', detailId],
    queryFn: () => lecturerService.getById(detailId!),
    enabled: !!detailId && detailOpen,
  });

  // ─── Mutations ────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: lecturerService.create,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['lecturers'] });
      setDrawerOpen(false);
      resetForm();
      if (result.data?.authentikCreated === false) {
        showToast('error', `Data dosen tersimpan, namun akun Authentik gagal dibuat. Gunakan tombol Sinkronisasi.`);
      } else {
        showToast('success', 'Data dosen dan akun Authentik berhasil dibuat.');
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal menyimpan data dosen';
      setFormErrors((p) => ({ ...p, api: msg }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof lecturerService.update>[1] }) =>
      lecturerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturers'] });
      setDrawerOpen(false);
      resetForm();
      showToast('success', 'Data dosen berhasil diperbarui.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal memperbarui data';
      setFormErrors((p) => ({ ...p, api: msg }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: lecturerService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturers'] });
      setConfirmDeleteOpen(false);
      showToast('success', 'Dosen berhasil dihapus.');
    },
  });

  const syncMutation = useMutation({
    mutationFn: lecturerService.syncAuthentik,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturers'] });
      setConfirmSyncOpen(false);
      showToast('success', 'Berhasil disinkronkan ke Authentik.');
    },
    onError: (err: any) => {
      setConfirmSyncOpen(false);
      showToast('error', err.response?.data?.message || 'Sinkronisasi gagal.');
    },
  });

  const resetPwdMutation = useMutation({
    mutationFn: ({ id, pwd }: { id: string; pwd: string }) => lecturerService.resetPassword(id, pwd),
    onSuccess: () => {
      setResetPwdOpen(false);
      setResetPwd({ newPassword: '', confirm: '' });
      showToast('success', 'Password berhasil direset.');
    },
    onError: (err: any) => showToast('error', err.response?.data?.message || 'Reset password gagal.'),
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setTouched({});
    setEditingId(null);
    setDrawerStudyProgramId('');
  };

  const openCreate = () => {
    resetForm();
    setDrawerOpen(true);
  };

  const openEdit = (row: Lecturer) => {
    setEditingId(row.id);
    setForm({
      nidn: row.nidn, nrk: row.nrk, name: row.name,
      frontTitle: row.frontTitle ?? '', backTitle: row.backTitle ?? '',
      email: row.email, phoneNumber: row.phoneNumber ?? '',
      lastEducation: row.lastEducation, academicPosition: row.academicPosition,
      facultyId: row.facultyId, studyProgramId: row.studyProgramId,
      isActive: row.isActive, username: row.identityUsername ?? '',
      password: '', confirmPassword: '',
    });
    setDrawerOpen(true);
  };

  const validateField = (field: keyof FormState, value: string | boolean, currentForm: FormState): string | undefined => {
    switch (field) {
      case 'nidn':     return !String(value).trim() ? 'NIDN wajib diisi' : undefined;
      case 'nrk':      return !String(value).trim() ? 'NRK wajib diisi' : undefined;
      case 'name':     return !String(value).trim() ? 'Nama wajib diisi' : undefined;
      case 'email': {
        const v = String(value).trim();
        if (!v) return 'Email wajib diisi';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Format email tidak valid';
        return undefined;
      }
      case 'lastEducation':  return !value ? 'Pendidikan terakhir wajib dipilih' : undefined;
      case 'facultyId':      return !value ? 'Fakultas wajib dipilih' : undefined;
      case 'studyProgramId': return !value ? 'Program Studi wajib dipilih' : undefined;
      case 'username':  return !editingId && !String(value).trim() ? 'Username wajib diisi' : undefined;
      case 'password': {
        if (editingId) return undefined;
        const v = String(value);
        if (!v) return 'Password wajib diisi';
        if (v.length < 8) return 'Password minimal 8 karakter';
        if (!/[a-zA-Z]/.test(v)) return 'Password harus mengandung huruf';
        if (!/\d/.test(v)) return 'Password harus mengandung angka';
        return undefined;
      }
      case 'confirmPassword': {
        if (editingId) return undefined;
        if (!String(value)) return 'Konfirmasi password wajib diisi';
        if (String(value) !== currentForm.password) return 'Konfirmasi password tidak cocok';
        return undefined;
      }
      default: return undefined;
    }
  };

  const handleFormChange = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'nidn' && !editingId && typeof value === 'string') {
        next.username = value;
        next.password = value ? `${value}@Wt` : '';
        next.confirmPassword = value ? `${value}@Wt` : '';
      }
      if (field === 'facultyId') next.studyProgramId = '';

      // Validasi real-time hanya untuk field yang sudah pernah disentuh
      if (touched[field]) {
        const err = validateField(field, value, next);
        setFormErrors((p) => ({ ...p, [field]: err, api: undefined }));
        // Re-validasi confirmPassword saat password berubah
        if (field === 'password' && touched.confirmPassword) {
          const cErr = !next.confirmPassword
            ? 'Konfirmasi password wajib diisi'
            : next.confirmPassword !== String(value) ? 'Konfirmasi password tidak cocok' : undefined;
          setFormErrors((p) => ({ ...p, confirmPassword: cErr }));
        }
      } else {
        setFormErrors((p) => ({ ...p, api: undefined }));
      }

      return next;
    });
  };

  const handleBlur = (field: keyof FormState) => {
    setTouched((p) => ({ ...p, [field]: true }));
    const err = validateField(field, form[field] as string | boolean, form);
    setFormErrors((p) => ({ ...p, [field]: err }));
  };

  const validateForm = (): Partial<Record<keyof FormState, string>> => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.nidn.trim()) errs.nidn = 'NIDN wajib diisi';
    if (!form.nrk.trim()) errs.nrk = 'NRK wajib diisi';
    if (!form.name.trim()) errs.name = 'Nama wajib diisi';
    if (!form.email.trim()) {
      errs.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Format email tidak valid';
    }
    if (!form.lastEducation) errs.lastEducation = 'Pendidikan terakhir wajib dipilih';
    if (!form.facultyId) errs.facultyId = 'Fakultas wajib dipilih';
    if (!form.studyProgramId) errs.studyProgramId = 'Program Studi wajib dipilih';
    if (!editingId) {
      if (!form.username.trim()) errs.username = 'Username wajib diisi';
      if (!form.password) {
        errs.password = 'Password wajib diisi';
      } else if (form.password.length < 8) {
        errs.password = 'Password minimal 8 karakter';
      } else if (!/[a-zA-Z]/.test(form.password)) {
        errs.password = 'Password harus mengandung huruf';
      } else if (!/\d/.test(form.password)) {
        errs.password = 'Password harus mengandung angka';
      }
      if (!form.confirmPassword) {
        errs.confirmPassword = 'Konfirmasi password wajib diisi';
      } else if (form.password !== form.confirmPassword) {
        errs.confirmPassword = 'Konfirmasi password tidak cocok';
      }
    }
    return errs;
  };

  const handleSubmit = () => {
    const errs = validateForm();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: {
          nidn: form.nidn, nrk: form.nrk, name: form.name,
          frontTitle: form.frontTitle || undefined, backTitle: form.backTitle || undefined,
          email: form.email, phoneNumber: form.phoneNumber || undefined,
          lastEducation: form.lastEducation, academicPosition: form.academicPosition,
          facultyId: form.facultyId, studyProgramId: form.studyProgramId,
          isActive: form.isActive,
        },
      });
    } else {
      createMutation.mutate({
        nidn: form.nidn, nrk: form.nrk, name: form.name,
        frontTitle: form.frontTitle || undefined, backTitle: form.backTitle || undefined,
        email: form.email, phoneNumber: form.phoneNumber || undefined,
        lastEducation: form.lastEducation, academicPosition: form.academicPosition,
        facultyId: form.facultyId, studyProgramId: form.studyProgramId,
        isActive: form.isActive, username: form.username, password: form.password,
      });
    }
  };

  const handleResetPwd = () => {
    if (resetPwd.newPassword.length < 8) { showToast('error', 'Password minimal 8 karakter'); return; }
    if (!/[a-zA-Z]/.test(resetPwd.newPassword) || !/\d/.test(resetPwd.newPassword)) {
      showToast('error', 'Password harus mengandung huruf dan angka'); return;
    }
    if (resetPwd.newPassword !== resetPwd.confirm) { showToast('error', 'Konfirmasi password tidak cocok'); return; }
    resetPwdMutation.mutate({ id: resetPwdId!, pwd: resetPwd.newPassword });
  };

  // ─── Table Headers ────────────────────────────────────────────────────────

  const headers: Header<Lecturer>[] = [
    {
      key: 'nidn', title: 'NIDN', sortable: true,
      render: (row) => <span className="font-mono text-xs font-medium text-gray-800">{row.nidn}</span>,
    },
    {
      key: 'nrk', title: 'NRK',
      render: (row) => <span className="font-mono text-xs text-gray-500">{row.nrk}</span>,
    },
    {
      key: 'name', title: 'Nama', sortable: true,
      render: (row) => (
        <div className="cursor-pointer" onClick={() => { setDetailId(row.id); setDetailOpen(true); }}>
          <p className="text-sm font-semibold text-gray-800">
            {row.frontTitle ? `${row.frontTitle} ` : ''}{row.name}{row.backTitle ? `, ${row.backTitle}` : ''}
          </p>
          <p className="text-xs text-gray-400">{row.identityUsername ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'lastEducation', title: 'Pend. Terakhir',
      render: (row) => (
        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100 font-medium">
          {LAST_EDUCATION_OPTIONS.find((o) => o.value === row.lastEducation)?.label ?? row.lastEducation}
        </span>
      ),
    },
    {
      key: 'facultyId', title: 'Fakultas',
      render: (row) => <span className="text-xs text-gray-600">{row.faculty?.name ?? '—'}</span>,
    },
    {
      key: 'studyProgramId', title: 'Program Studi',
      render: (row) => <span className="text-xs text-gray-600">{row.studyProgram?.name ?? '—'}</span>,
    },
    {
      key: 'isActive', title: 'Status',
      render: (row) => <StatusBadge active={row.isActive} />,
    },
    {
      key: 'authentikStatus', title: 'SSO Status',
      render: (row) => <AuthentikBadge status={row.authentikStatus} />,
    },
    {
      key: 'createdAt', title: 'Dibuat', sortable: true,
      render: (row) => (
        <span className="text-xs text-gray-400">
          {new Date(row.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'id', title: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setResetPwdId(row.id); setResetPwdOpen(true); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
            title="Reset Password"
          >
            <KeyRound size={14} />
          </button>
          {row.authentikStatus !== 'ACTIVE' && (
            <button
              onClick={(e) => { e.stopPropagation(); setSyncId(row.id); setConfirmSyncOpen(true); }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Sinkronkan ke Authentik"
            >
              <RefreshCw size={14} />
            </button>
          )}
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

  const total = data?.meta?.total ?? 0;
  const activeTotal = activeData?.meta?.total ?? 0;
  const syncedTotal = syncedData?.meta?.total ?? 0;
  const notSyncedTotal = notSyncedData?.meta?.total ?? 0;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in
          ${toastMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toastMsg.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toastMsg.text}
        </div>
      )}

      <PageHeader
        title="Master Dosen"
        description="Kelola data dosen dan akun Authentik SSO"
        action={{ label: 'Tambah Dosen', onClick: openCreate, icon: <Plus size={16} /> }}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Dosen"    value={total}         icon={<Users size={18} />}     color="blue"   />
        <StatCard label="Aktif"          value={activeTotal}   icon={<UserCheck size={18} />} color="green"  />
        <StatCard label="SSO Aktif" value={syncedTotal}  icon={<CheckCircle2 size={18}/>} color="emerald"/>
        <StatCard label="Belum Sinkron"  value={notSyncedTotal} icon={<AlertCircle size={18}/>} color="yellow" />
      </div>

      {/* Filters + Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari NIDN, NRK, nama, email, username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <select
            value={filterFacultyId}
            onChange={(e) => { setFilterFacultyId(e.target.value); setFilterStudyProgramId(''); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white min-w-[160px]"
          >
            <option value="">Semua Fakultas</option>
            {faculties?.data?.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <select
            value={filterStudyProgramId}
            onChange={(e) => setFilterStudyProgramId(e.target.value)}
            disabled={!filterFacultyId}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white min-w-[160px] disabled:opacity-50"
          >
            <option value="">Semua Prodi</option>
            {filterStudyPrograms?.data?.map((sp) => (
              <option key={sp.id} value={sp.id}>{sp.name}</option>
            ))}
          </select>

          <select
            value={filterLastEdu}
            onChange={(e) => setFilterLastEdu(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
          >
            <option value="">Semua Pendidikan</option>
            {LAST_EDUCATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
          >
            <option value="">Semua Status</option>
            <option value="true">Aktif</option>
            <option value="false">Tidak Aktif</option>
          </select>

          <select
            value={filterAuthentik}
            onChange={(e) => setFilterAuthentik(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
          >
            <option value="">Semua Authentik</option>
            <option value="ACTIVE">Active</option>
            <option value="NOT_SYNCED">Not Synced</option>
            <option value="DISABLED">Disabled</option>
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
        title={editingId ? 'Edit Dosen' : 'Tambah Dosen Baru'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setDrawerOpen(false); resetForm(); }}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Buat Dosen')}
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

          {/* Section 1: Data Dosen */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <GraduationCap size={15} className="text-primary" /> Data Dosen
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className={LABEL_CLS}>NIDN <span className="text-red-500">*</span></label>
                <Input
                  value={form.nidn}
                  onChange={(e) => handleFormChange('nidn', e.target.value)}
                  onBlur={() => handleBlur('nidn')}
                  placeholder="0412345678"
                  className={formErrors.nidn ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}
                />
                {formErrors.nidn && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.nidn}</p>}
              </div>

              <div>
                <label className={LABEL_CLS}>NRK <span className="text-red-500">*</span></label>
                <Input
                  value={form.nrk}
                  onChange={(e) => handleFormChange('nrk', e.target.value)}
                  onBlur={() => handleBlur('nrk')}
                  placeholder="WT00001"
                  className={formErrors.nrk ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}
                />
                {formErrors.nrk && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.nrk}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL_CLS}>Nama Lengkap <span className="text-red-500">*</span></label>
                <Input
                  value={form.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  placeholder="Esa Fauzi"
                  className={formErrors.name ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}
                />
                {formErrors.name && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.name}</p>}
              </div>

              <div>
                <label className={LABEL_CLS}>Gelar Depan</label>
                <Input value={form.frontTitle} onChange={(e) => handleFormChange('frontTitle', e.target.value)} placeholder="Dr." />
              </div>

              <div>
                <label className={LABEL_CLS}>Gelar Belakang</label>
                <Input value={form.backTitle} onChange={(e) => handleFormChange('backTitle', e.target.value)} placeholder="M.Kom." />
              </div>

              <div>
                <label className={LABEL_CLS}>Email <span className="text-red-500">*</span></label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="dosen@widyatama.ac.id"
                  className={formErrors.email ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}
                />
                {formErrors.email && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.email}</p>}
              </div>

              <div>
                <label className={LABEL_CLS}>Nomor HP</label>
                <Input value={form.phoneNumber} onChange={(e) => handleFormChange('phoneNumber', e.target.value)} placeholder="081234567890" />
              </div>

              <div>
                <label className={LABEL_CLS}>Pendidikan Terakhir <span className="text-red-500">*</span></label>
                <select
                  value={form.lastEducation}
                  onChange={(e) => handleFormChange('lastEducation', e.target.value)}
                  onBlur={() => handleBlur('lastEducation')}
                  className={`${SELECT_CLS} ${formErrors.lastEducation ? 'border-red-400' : ''}`}
                >
                  <option value="">Pilih pendidikan</option>
                  {LAST_EDUCATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {formErrors.lastEducation && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.lastEducation}</p>}
              </div>

              <div>
                <label className={LABEL_CLS}>Jabatan Akademik</label>
                <select
                  value={form.academicPosition}
                  onChange={(e) => handleFormChange('academicPosition', e.target.value)}
                  className={SELECT_CLS}
                >
                  {ACADEMIC_POSITION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div>
                <label className={LABEL_CLS}>Fakultas <span className="text-red-500">*</span></label>
                <select
                  value={form.facultyId}
                  onChange={(e) => handleFormChange('facultyId', e.target.value)}
                  onBlur={() => handleBlur('facultyId')}
                  className={`${SELECT_CLS} ${formErrors.facultyId ? 'border-red-400' : ''}`}
                >
                  <option value="">Pilih fakultas</option>
                  {faculties?.data?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                {formErrors.facultyId && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.facultyId}</p>}
              </div>

              <div>
                <label className={LABEL_CLS}>Program Studi <span className="text-red-500">*</span></label>
                <select
                  value={form.studyProgramId}
                  onChange={(e) => handleFormChange('studyProgramId', e.target.value)}
                  onBlur={() => handleBlur('studyProgramId')}
                  disabled={!form.facultyId}
                  className={`${SELECT_CLS} disabled:opacity-50 ${formErrors.studyProgramId ? 'border-red-400' : ''}`}
                >
                  <option value="">Pilih program studi</option>
                  {drawerStudyPrograms?.data?.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                </select>
                {formErrors.studyProgramId && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.studyProgramId}</p>}
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={form.isActive} onCheckedChange={(v) => handleFormChange('isActive', v)} />
                <label className="text-sm font-medium text-gray-700">Status Aktif</label>
              </div>
            </div>
          </div>

          {/* Section 2: Login Info — only on create */}
          {!editingId && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <KeyRound size={15} className="text-primary" /> Informasi Login
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Default: Username = NIDN, Password = NIDN@Wt (dapat diubah sebelum disimpan)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={LABEL_CLS}>Username <span className="text-red-500">*</span></label>
                  <Input
                    value={form.username}
                    onChange={(e) => handleFormChange('username', e.target.value)}
                    onBlur={() => handleBlur('username')}
                    placeholder="0412345678"
                    className={formErrors.username ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}
                  />
                  {formErrors.username && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.username}</p>}
                </div>

                <div>
                  <label className={LABEL_CLS}>Password Awal <span className="text-red-500">*</span></label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => handleFormChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    placeholder="Min. 8 karakter, huruf + angka"
                    className={formErrors.password ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}
                  />
                  {formErrors.password && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.password}</p>}
                </div>

                <div>
                  <label className={LABEL_CLS}>Konfirmasi Password <span className="text-red-500">*</span></label>
                  <Input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => handleFormChange('confirmPassword', e.target.value)}
                    onBlur={() => handleBlur('confirmPassword')}
                    placeholder="Ulangi password"
                    className={formErrors.confirmPassword ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}
                  />
                  {formErrors.confirmPassword && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.confirmPassword}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* ─── Detail Drawer ────────────────────────────────────────────────── */}
      <Drawer
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailId(null); }}
        title="Detail Dosen"
        size="md"
        footer={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => { setDetailOpen(false); if (detailData?.data) openEdit(detailData.data); }}>
              <Pencil size={14} className="mr-1" /> Edit
            </Button>
            <Button variant="outline" onClick={() => {
              setResetPwdId(detailId); setResetPwdOpen(true);
            }}>
              <KeyRound size={14} className="mr-1" /> Reset Password
            </Button>
            {detailData?.data?.authentikStatus !== 'ACTIVE' && (
              <Button variant="outline" onClick={() => { setSyncId(detailId); setConfirmSyncOpen(true); }}>
                <RefreshCw size={14} className="mr-1" /> Sinkronkan
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => { setDeleteId(detailId); setConfirmDeleteOpen(true); setDetailOpen(false); }}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 size={14} className="mr-1" /> Hapus
            </Button>
          </div>
        }
      >
        {detailData?.data ? (
          <div className="space-y-4 p-1">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold uppercase shrink-0">
                {detailData.data.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">
                  {detailData.data.frontTitle ? `${detailData.data.frontTitle} ` : ''}{detailData.data.name}
                  {detailData.data.backTitle ? `, ${detailData.data.backTitle}` : ''}
                </h2>
                <p className="text-sm text-gray-500">{detailData.data.academicPosition.replace(/_/g, ' ')}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge active={detailData.data.isActive} />
                  <AuthentikBadge status={detailData.data.authentikStatus} />
                </div>
              </div>
            </div>

            {[
              ['NIDN', detailData.data.nidn],
              ['NRK', detailData.data.nrk],
              ['Email', detailData.data.email],
              ['No. HP', detailData.data.phoneNumber ?? '—'],
              ['Pendidikan', LAST_EDUCATION_OPTIONS.find((o) => o.value === detailData.data.lastEducation)?.label],
              ['Fakultas', detailData.data.faculty?.name ?? '—'],
              ['Program Studi', detailData.data.studyProgram?.name ?? '—'],
              ['Username', detailData.data.identityUsername ?? '—'],
              ['Authentik ID', detailData.data.identityUserId ?? '—'],
              ['Dibuat', new Date(detailData.data.createdAt).toLocaleString('id-ID')],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs font-medium text-gray-400 w-28 shrink-0">{label}</span>
                <span className="text-sm text-gray-800 break-all">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Memuat...</div>
        )}
      </Drawer>

      {/* ─── Reset Password Dialog ────────────────────────────────────────── */}
      {resetPwdOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
              <KeyRound size={16} className="text-purple-600" /> Reset Password
            </h3>
            <p className="text-xs text-gray-400 mb-4">Password baru harus min. 8 karakter, mengandung huruf dan angka.</p>
            <div className="space-y-3">
              <div>
                <label className={LABEL_CLS}>Password Baru</label>
                <Input
                  type="password"
                  value={resetPwd.newPassword}
                  onChange={(e) => setResetPwd((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Min. 8 karakter"
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Konfirmasi Password</label>
                <Input
                  type="password"
                  value={resetPwd.confirm}
                  onChange={(e) => setResetPwd((p) => ({ ...p, confirm: e.target.value }))}
                  placeholder="Ulangi password baru"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <Button variant="outline" onClick={() => { setResetPwdOpen(false); setResetPwd({ newPassword: '', confirm: '' }); }}>
                Batal
              </Button>
              <Button onClick={handleResetPwd} disabled={resetPwdMutation.isPending}>
                {resetPwdMutation.isPending ? 'Mereset...' : 'Reset Password'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirm Delete ───────────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Hapus Dosen"
        description="Apakah Anda yakin ingin menghapus dosen ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />

      {/* ─── Confirm Sync ────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmSyncOpen}
        onClose={() => setConfirmSyncOpen(false)}
        onConfirm={() => syncId && syncMutation.mutate(syncId)}
        title="Sinkronkan ke Authentik"
        description="Akun Authentik akan dibuat atau diperbarui untuk dosen ini. Lanjutkan?"
        confirmLabel="Sinkronkan"
        isLoading={syncMutation.isPending}
      />
    </div>
  );
}
