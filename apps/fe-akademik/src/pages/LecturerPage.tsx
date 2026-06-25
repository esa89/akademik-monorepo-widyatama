import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Input, Button, Drawer, Switch } from '@widyatama/ui';
import type { DataTableOptions, Header } from '@widyatama/ui';
import * as XLSX from 'xlsx';
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
  FileSpreadsheet, AlertTriangle, Upload, ChevronRight, ChevronLeft, Loader2,
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

interface LecturerImportRow {
  nidn: string;
  nrk: string;
  name: string;
  valid: boolean;
  error?: string;
}

type ImportStep = 1 | 2;

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

  // ─── State: Import via Excel ──────────────────────────────────────────────
  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>(1);
  const [importFacultyId, setImportFacultyId] = useState('');
  const [importProdiId, setImportProdiId] = useState('');
  const [importRows, setImportRows] = useState<LecturerImportRow[]>([]);
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; failed: string[] } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

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

  const { data: importStudyPrograms } = useQuery({
    queryKey: ['study-programs', 'import-lecturer', importFacultyId],
    queryFn: () => studyProgramService.getAll({ page: 1, limit: 100, facultyId: importFacultyId }),
    enabled: importOpen && !!importFacultyId,
  });

  // Auto-select "Teknik" faculty when import drawer opens
  useEffect(() => {
    if (importOpen && faculties?.data && !importFacultyId) {
      const teknik = faculties.data.find((f) => f.name.toLowerCase().includes('teknik'));
      if (teknik) setImportFacultyId(teknik.id);
    }
  }, [importOpen, faculties?.data]);

  // Auto-select "Teknik Informatika" prodi
  useEffect(() => {
    if (importOpen && importStudyPrograms?.data && !importProdiId) {
      const ti = importStudyPrograms.data.find((sp) => sp.name.toLowerCase().includes('informatika'));
      if (ti) setImportProdiId(ti.id);
    }
  }, [importOpen, importStudyPrograms?.data]);

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

  // ─── Import via Excel ─────────────────────────────────────────────────────

  const resetImport = () => {
    setImportStep(1);
    setImportFacultyId('');
    setImportProdiId('');
    setImportRows([]);
    setImportProgress(null);
    setImportResult(null);
    if (importFileRef.current) importFileRef.current.value = '';
  };

  const openImport = () => { resetImport(); setImportOpen(true); };

  const handleImportXlsx = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb  = XLSX.read(new Uint8Array(evt.target?.result as ArrayBuffer), { type: 'array' });
        const ws  = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        const parsed: LecturerImportRow[] = rows
          .map((row) => ({
            nidn: String(row[0] ?? '').trim(),
            nrk:  String(row[1] ?? '').trim(),
            name: String(row[2] ?? '').trim(),
          }))
          .filter((r) => r.nidn && r.nidn.toLowerCase() !== 'nidn')
          .map((r) => {
            const valid = r.nidn.length >= 3 && r.nrk.length >= 2 && r.name.length >= 2;
            return { ...r, valid, error: !valid ? 'NIDN, NRK, atau Nama tidak valid' : undefined };
          });

        setImportRows(parsed);
      } catch {
        showToast('error', 'Gagal membaca file XLSX.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (importFileRef.current) importFileRef.current.value = '';
  };

  const runImport = async () => {
    const validRows = importRows.filter((r) => r.valid);
    setImportProgress({ done: 0, total: validRows.length });
    setImportResult(null);

    const failed: string[] = [];
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        await lecturerService.create({
          nidn:           row.nidn,
          nrk:            row.nrk,
          name:           row.name,
          email:          `${row.nidn}@widyatama.ac.id`,
          lastEducation:  'S2',
          academicPosition: 'TENAGA_PENGAJAR',
          facultyId:      importFacultyId,
          studyProgramId: importProdiId,
          isActive:       true,
          username:       row.nidn,
          password:       `${row.nidn}@Wt`,
        });
      } catch {
        failed.push(row.nidn);
      }
      setImportProgress({ done: i + 1, total: validRows.length });
    }

    setImportResult({ success: validRows.length - failed.length, failed });
    queryClient.invalidateQueries({ queryKey: ['lecturers'] });
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

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master Dosen</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data dosen dan akun Authentik SSO</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={openImport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-yellow-400 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 text-sm font-medium transition-colors"
            >
              <FileSpreadsheet size={15} />
              Tambah via Excel
            </button>
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              SEMENTARA
            </span>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 text-sm font-medium transition-colors"
          >
            <Plus size={15} />
            Tambah Dosen
          </button>
        </div>
      </div>

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

      {/* ─── Import via Excel Drawer ────────────────────────────────────── */}
      <Drawer
        open={importOpen}
        onClose={() => { setImportOpen(false); resetImport(); }}
        title="Tambah Dosen via Excel"
        footer={
          importResult ? (
            <div className="flex justify-end gap-3">
              <Button onClick={() => { setImportOpen(false); resetImport(); }}>Selesai</Button>
            </div>
          ) : importProgress ? null : importStep === 1 ? (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setImportOpen(false); resetImport(); }}>Batal</Button>
              <Button onClick={() => setImportStep(2)} disabled={!importFacultyId || !importProdiId}>
                Lanjut <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => { setImportRows([]); setImportStep(1); }}>
                <ChevronLeft size={14} className="mr-1" /> Kembali
              </Button>
              <Button onClick={runImport} disabled={importRows.filter((r) => r.valid).length === 0}>
                <Upload size={14} className="mr-1" />
                Import {importRows.filter((r) => r.valid).length} Dosen
              </Button>
            </div>
          )
        }
      >
        <div className="space-y-4 p-1">

          {/* Peringatan fitur sementara */}
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
            <AlertTriangle size={15} className="text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-yellow-800">Fitur Sementara</p>
              <p className="text-xs text-yellow-700 mt-0.5">
                Email, username, dan password dibuat otomatis dari NIDN. Pendidikan terakhir default S2. Semua data dapat diperbarui setelah import.
              </p>
            </div>
          </div>

          {/* STEP 1 — Pilih Fakultas & Prodi */}
          {importStep === 1 && !importResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">1</span>
                Pilih Tujuan
              </div>

              <div>
                <label className={LABEL_CLS}>Fakultas <span className="text-red-500">*</span></label>
                <select
                  value={importFacultyId}
                  onChange={(e) => { setImportFacultyId(e.target.value); setImportProdiId(''); }}
                  className={SELECT_CLS}
                >
                  <option value="">Pilih fakultas</option>
                  {faculties?.data?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              <div>
                <label className={LABEL_CLS}>Program Studi <span className="text-red-500">*</span></label>
                <select
                  value={importProdiId}
                  onChange={(e) => setImportProdiId(e.target.value)}
                  disabled={!importFacultyId}
                  className={`${SELECT_CLS} disabled:opacity-50`}
                >
                  <option value="">Pilih program studi</option>
                  {importStudyPrograms?.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-1.5">Format file Excel:</p>
                <div className="overflow-auto">
                  <table className="text-[11px] w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="px-2 py-1 text-left border border-gray-300 font-semibold">Kolom A</th>
                        <th className="px-2 py-1 text-left border border-gray-300 font-semibold">Kolom B</th>
                        <th className="px-2 py-1 text-left border border-gray-300 font-semibold">Kolom C</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white">
                        <td className="px-2 py-1 border border-gray-200 text-gray-500 italic">NIDN (header, opsional)</td>
                        <td className="px-2 py-1 border border-gray-200 text-gray-500 italic">NRK (header, opsional)</td>
                        <td className="px-2 py-1 border border-gray-200 text-gray-500 italic">Nama (header, opsional)</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="px-2 py-1 border border-gray-200">0412345678</td>
                        <td className="px-2 py-1 border border-gray-200">WT00001</td>
                        <td className="px-2 py-1 border border-gray-200">Budi Santoso</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="px-2 py-1 border border-gray-200">0498765432</td>
                        <td className="px-2 py-1 border border-gray-200">WT00002</td>
                        <td className="px-2 py-1 border border-gray-200">Siti Rahayu</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="text-[11px] text-gray-400 mt-1.5 space-y-0.5">
                  <p>• Email: <span className="font-mono">NIDN@widyatama.ac.id</span></p>
                  <p>• Username: NIDN &nbsp;|&nbsp; Password: <span className="font-mono">NIDN@Wt</span></p>
                  <p>• Pendidikan terakhir: S2 &nbsp;|&nbsp; Jabatan: Tenaga Pengajar</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Upload & Preview */}
          {importStep === 2 && !importProgress && !importResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">2</span>
                Upload File &amp; Preview
              </div>

              {/* Info batch */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
                  {faculties?.data?.find((f) => f.id === importFacultyId)?.name}
                </span>
                <span className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full font-medium">
                  {importStudyPrograms?.data?.find((p) => p.id === importProdiId)?.name}
                </span>
              </div>

              {/* Upload button */}
              <input ref={importFileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportXlsx} />
              <button
                type="button"
                onClick={() => importFileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-primary hover:text-primary transition-colors"
              >
                <FileSpreadsheet size={16} />
                {importRows.length > 0 ? 'Ganti File Excel' : 'Pilih File Excel (.xlsx / .xls)'}
              </button>

              {/* Preview table */}
              {importRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-600">
                      Preview: {importRows.filter((r) => r.valid).length} valid,{' '}
                      <span className="text-red-500">{importRows.filter((r) => !r.valid).length} error</span>
                    </p>
                    <p className="text-[11px] text-gray-400">{importRows.length} baris ditemukan</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-y-auto max-h-64">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600 w-28">NIDN</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600 w-24">NRK</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Nama</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600 w-12">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importRows.map((row, i) => (
                            <tr key={i} className={`border-b border-gray-50 ${!row.valid ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                              <td className="px-3 py-1.5 font-mono text-gray-700">{row.nidn}</td>
                              <td className="px-3 py-1.5 font-mono text-gray-500">{row.nrk}</td>
                              <td className="px-3 py-1.5 text-gray-800 max-w-[140px] truncate">{row.name}</td>
                              <td className="px-3 py-1.5 text-center">
                                {row.valid
                                  ? <CheckCircle2 size={12} className="text-emerald-500 inline" />
                                  : <XCircle size={12} className="text-red-500 inline" title={row.error} />}
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

          {/* PROGRESS */}
          {importProgress && !importResult && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 size={32} className="text-primary animate-spin" />
              <div className="w-full">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Mengimport dosen...</span>
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

          {/* RESULT */}
          {importResult && (
            <div className="space-y-3">
              <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                importResult.failed.length === 0
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <CheckCircle2 size={18} className={importResult.failed.length === 0 ? 'text-emerald-600' : 'text-yellow-600'} />
                <div>
                  <p className={`text-sm font-semibold ${importResult.failed.length === 0 ? 'text-emerald-800' : 'text-yellow-800'}`}>
                    Import selesai
                  </p>
                  <p className="text-xs mt-0.5 text-gray-600">
                    {importResult.success} dosen berhasil ditambahkan.
                    {importResult.failed.length > 0 && ` ${importResult.failed.length} gagal (NIDN mungkin sudah terdaftar).`}
                  </p>
                  {importResult.failed.length > 0 && (
                    <p className="text-xs mt-1 text-red-600 font-mono">
                      Gagal: {importResult.failed.slice(0, 5).join(', ')}
                      {importResult.failed.length > 5 && ` +${importResult.failed.length - 5} lainnya`}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center">
                Email, pendidikan, dan jabatan dapat diperbarui di detail masing-masing dosen.
              </p>
            </div>
          )}
        </div>
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
