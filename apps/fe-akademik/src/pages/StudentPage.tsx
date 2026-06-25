import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Input, Button, Drawer, Switch } from '@widyatama/ui';
import type { DataTableOptions, Header } from '@widyatama/ui';
import * as XLSX from 'xlsx';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { studentService } from '@/services/student.service';
import { facultyService } from '@/services/faculty.service';
import { studyProgramService } from '@/services/studyProgram.service';
import { curriculumService } from '@/services/curriculum.service';
import { academicSemesterService } from '@/services/academicSemester.service';
import type { Student, StudentStatus, Gender, AdmissionPath, Agama } from '@/types';
import {
  Users, Search, Plus, Pencil, Trash2, GraduationCap,
  CheckCircle2, XCircle, Clock, UserMinus, LogOut, BookOpen,
  FileSpreadsheet, AlertTriangle, Upload, ChevronRight, ChevronLeft,
  Loader2,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: 'LAKI_LAKI', label: 'Laki-laki' },
  { value: 'PEREMPUAN', label: 'Perempuan' },
];

const STUDENT_STATUS_OPTIONS = [
  { value: 'AKTIF',              label: 'Aktif' },
  { value: 'CUTI',               label: 'Cuti' },
  { value: 'NON_AKTIF',          label: 'Non Aktif' },
  { value: 'LULUS',              label: 'Lulus' },
  { value: 'DROP_OUT',           label: 'Drop Out' },
  { value: 'MENGUNDURKAN_DIRI',  label: 'Mengundurkan Diri' },
];

const AGAMA_OPTIONS = [
  { value: 'ISLAM',              label: 'Islam' },
  { value: 'KRISTEN_PROTESTAN',  label: 'Kristen Protestan' },
  { value: 'KRISTEN_KATOLIK',    label: 'Kristen Katolik' },
  { value: 'HINDU',              label: 'Hindu' },
  { value: 'BUDDHA',             label: 'Buddha' },
  { value: 'KONGHUCU',           label: 'Konghucu' },
];

const ADMISSION_PATH_OPTIONS = [
  { value: 'REGULER',         label: 'Reguler' },
  { value: 'KELAS_KARYAWAN',  label: 'Kelas Karyawan' },
  { value: 'RPL',             label: 'RPL' },
  { value: 'PASCA_SARJANA',   label: 'Pasca Sarjana' },
];

const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

const SELECT_CLS = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white';
const LABEL_CLS  = 'block text-sm font-medium text-gray-700 mb-1.5';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nimToAngkatan(nim: string): number {
  const digits = nim.replace(/\D/g, '');
  if (digits.length >= 2) {
    const prefix = parseInt(digits.substring(0, 2), 10);
    if (!isNaN(prefix)) return 2000 + prefix;
  }
  return new Date().getFullYear();
}

interface ImportRow {
  nim: string;
  name: string;
  entryYear: number;
  valid: boolean;
  error?: string;
}

type ImportStep = 1 | 2;

// ─── Badges ───────────────────────────────────────────────────────────────────

function StudentStatusBadge({ status }: { status: StudentStatus }) {
  const map: Record<StudentStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    AKTIF:              { label: 'Aktif',              cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={11} /> },
    CUTI:               { label: 'Cuti',               cls: 'bg-yellow-50 text-yellow-700 border-yellow-200',   icon: <Clock size={11} /> },
    NON_AKTIF:          { label: 'Non Aktif',          cls: 'bg-gray-100 text-gray-600 border-gray-200',         icon: <UserMinus size={11} /> },
    LULUS:              { label: 'Lulus',              cls: 'bg-blue-50 text-blue-700 border-blue-200',          icon: <GraduationCap size={11} /> },
    DROP_OUT:           { label: 'Drop Out',           cls: 'bg-red-50 text-red-600 border-red-200',             icon: <XCircle size={11} /> },
    MENGUNDURKAN_DIRI:  { label: 'Mengundurkan Diri',  cls: 'bg-orange-50 text-orange-700 border-orange-200',   icon: <LogOut size={11} /> },
  };
  const { label, cls, icon } = map[status] ?? map.NON_AKTIF;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}>
      {icon}{label}
    </span>
  );
}

function AdmissionPathBadge({ path }: { path: AdmissionPath }) {
  const label = ADMISSION_PATH_OPTIONS.find((o) => o.value === path)?.label ?? path;
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-100">
      {label}
    </span>
  );
}

// ─── Form State ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  nim: '', name: '', birthPlace: '', birthDate: '',
  gender: 'LAKI_LAKI', agama: '' as Agama | '', email: '', phoneNumber: '',
  facultyId: '', studyProgramId: '', curriculumId: '', academicSemesterId: '',
  entryYear: String(new Date().getFullYear()), admissionPath: 'REGULER',
  studentStatus: 'AKTIF', isActive: true,
};
type FormState = typeof EMPTY_FORM;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentPage() {
  const queryClient = useQueryClient();

  const [search, setSearch]       = useState('');
  const debouncedSearch           = useDebounce(search);
  const [options, setOptions]     = useState<DataTableOptions<Student>>({
    page: 1, itemsPerPage: 10, sortBy: 'createdAt' as keyof Student, sortDesc: true,
  });
  const [filterFaculty, setFilterFaculty]           = useState('');
  const [filterProdi, setFilterProdi]               = useState('');
  const [filterYear, setFilterYear]                 = useState('');
  const [filterStatus, setFilterStatus]             = useState('');
  const [filterGender, setFilterGender]             = useState('');

  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [form, setForm]               = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState<Partial<Record<keyof FormState | 'api', string>>>({});
  const [touched, setTouched]         = useState<Partial<Record<keyof FormState, boolean>>>({});

  const [detailOpen, setDetailOpen]   = useState(false);
  const [detailId, setDetailId]       = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [toastMsg, setToastMsg]       = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ─── State: Import via Excel ──────────────────────────────────────────────
  const [importOpen, setImportOpen]       = useState(false);
  const [importStep, setImportStep]       = useState<ImportStep>(1);
  const [importFacultyId, setImportFacultyId]   = useState('');
  const [importProdiId, setImportProdiId]       = useState('');
  const [importGender, setImportGender]         = useState<'LAKI_LAKI' | 'PEREMPUAN'>('LAKI_LAKI');
  const [importRows, setImportRows]             = useState<ImportRow[]>([]);
  const [importProgress, setImportProgress]     = useState<{ done: number; total: number } | null>(null);
  const [importResult, setImportResult]         = useState<{ success: number; failed: string[] } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // ─── Queries ────────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['students', options.page, options.itemsPerPage, debouncedSearch,
      filterFaculty, filterProdi, filterYear, filterStatus, filterGender],
    queryFn: () => studentService.getAll({
      page: options.page, limit: options.itemsPerPage,
      search: debouncedSearch || undefined,
      facultyId: filterFaculty || undefined,
      studyProgramId: filterProdi || undefined,
      entryYear: filterYear ? Number(filterYear) : undefined,
      studentStatus: filterStatus || undefined,
      gender: filterGender || undefined,
    }),
  });

  const { data: activeData }  = useQuery({ queryKey: ['students', 'stat-active'], queryFn: () => studentService.getAll({ studentStatus: 'AKTIF', limit: 1 }) });
  const { data: lulusData }   = useQuery({ queryKey: ['students', 'stat-lulus'],  queryFn: () => studentService.getAll({ studentStatus: 'LULUS', limit: 1 }) });
  const { data: cutiData }    = useQuery({ queryKey: ['students', 'stat-cuti'],   queryFn: () => studentService.getAll({ studentStatus: 'CUTI', limit: 1 }) });

  const { data: faculties }   = useQuery({ queryKey: ['faculties', 'all'], queryFn: () => facultyService.getAll({ page: 1, limit: 100 }) });

  const { data: filterStudyPrograms } = useQuery({
    queryKey: ['study-programs', 'filter-student', filterFaculty],
    queryFn:  () => studyProgramService.getAll({ page: 1, limit: 100, facultyId: filterFaculty }),
    enabled:  !!filterFaculty,
  });

  const { data: drawerStudyPrograms, isLoading: isLoadingProdi } = useQuery({
    queryKey: ['study-programs', 'drawer', form.facultyId],
    queryFn:  () => studyProgramService.getAll({ page: 1, limit: 100, facultyId: form.facultyId }),
    enabled:  !!form.facultyId,
  });

  const { data: drawerCurriculums, isLoading: isLoadingKurikulum } = useQuery({
    queryKey: ['curriculums', 'drawer', form.studyProgramId],
    queryFn:  () => curriculumService.getAll({ page: 1, limit: 100, studyProgramId: form.studyProgramId }),
    enabled:  !!form.studyProgramId,
  });

  const { data: academicSemesters } = useQuery({
    queryKey: ['academic-semesters', 'all'],
    queryFn:  () => academicSemesterService.getAll({ page: 1, limit: 50, sortBy: 'startDate', sortOrder: 'desc' }),
    enabled:  drawerOpen,
  });

  const { data: detailData } = useQuery({
    queryKey: ['students', 'detail', detailId],
    queryFn:  () => studentService.getById(detailId!),
    enabled:  !!detailId && detailOpen,
  });

  // Prodi untuk import drawer (filtered by importFacultyId)
  const { data: importStudyPrograms } = useQuery({
    queryKey: ['study-programs', 'import', importFacultyId],
    queryFn:  () => studyProgramService.getAll({ page: 1, limit: 100, facultyId: importFacultyId }),
    enabled:  importOpen && !!importFacultyId,
  });

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: studentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setDrawerOpen(false); resetForm();
      showToast('success', 'Data mahasiswa berhasil ditambahkan.');
    },
    onError: (err: any) =>
      setFormErrors((p) => ({ ...p, api: err.response?.data?.message || 'Gagal menyimpan data mahasiswa' })),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof studentService.update>[1] }) =>
      studentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setDrawerOpen(false); resetForm();
      showToast('success', 'Data mahasiswa berhasil diperbarui.');
    },
    onError: (err: any) =>
      setFormErrors((p) => ({ ...p, api: err.response?.data?.message || 'Gagal memperbarui data' })),
  });

  const deleteMutation = useMutation({
    mutationFn: studentService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setConfirmDeleteOpen(false);
      showToast('success', 'Mahasiswa berhasil dihapus.');
    },
  });

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM); setFormErrors({}); setTouched({}); setEditingId(null);
  };

  const openCreate = () => { resetForm(); setDrawerOpen(true); };

  const openEdit = (row: Student) => {
    setEditingId(row.id);
    setForm({
      nim: row.nim, name: row.name,
      birthPlace: row.birthPlace ?? '', birthDate: row.birthDate?.slice(0, 10) ?? '',
      gender: row.gender, agama: row.agama ?? '', email: row.email ?? '', phoneNumber: row.phoneNumber ?? '',
      facultyId: row.facultyId, studyProgramId: row.studyProgramId,
      curriculumId: row.curriculumId ?? '', academicSemesterId: row.academicSemesterId ?? '',
      entryYear: String(row.entryYear), admissionPath: row.admissionPath,
      studentStatus: row.studentStatus, isActive: row.isActive,
    });
    setDrawerOpen(true);
  };

  const validateField = (field: keyof FormState, value: string | boolean, currentForm: FormState): string | undefined => {
    switch (field) {
      case 'nim': {
        const v = String(value).trim();
        if (!v) return 'NIM wajib diisi';
        if (v.length < 5) return 'NIM minimal 5 karakter';
        return undefined;
      }
      case 'name': {
        const v = String(value).trim();
        if (!v) return 'Nama lengkap wajib diisi';
        if (v.length < 2) return 'Nama minimal 2 karakter';
        return undefined;
      }
      case 'gender':        return !value ? 'Jenis kelamin wajib dipilih' : undefined;
      case 'facultyId':     return !value ? 'Fakultas wajib dipilih' : undefined;
      case 'studyProgramId':return !value ? 'Program Studi wajib dipilih' : undefined;
      case 'entryYear':     return !value ? 'Angkatan wajib dipilih' : undefined;
      case 'studentStatus': return !value ? 'Status mahasiswa wajib dipilih' : undefined;
      case 'email': {
        const v = String(value).trim();
        if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Format email tidak valid';
        return undefined;
      }
      default: return undefined;
    }
  };

  const handleFormChange = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'facultyId') { next.studyProgramId = ''; next.curriculumId = ''; }
      if (field === 'studyProgramId') next.curriculumId = '';

      if (touched[field]) {
        const err = validateField(field, value, next);
        setFormErrors((p) => ({ ...p, [field]: err, api: undefined }));
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
    if (!form.nim.trim())           errs.nim           = 'NIM wajib diisi';
    else if (form.nim.trim().length < 5) errs.nim      = 'NIM minimal 5 karakter';
    if (!form.name.trim())          errs.name          = 'Nama lengkap wajib diisi';
    if (!form.gender)               errs.gender        = 'Jenis kelamin wajib dipilih';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
                                    errs.email         = 'Format email tidak valid';
    if (!form.facultyId)            errs.facultyId     = 'Fakultas wajib dipilih';
    if (!form.studyProgramId)       errs.studyProgramId= 'Program Studi wajib dipilih';
    if (!form.entryYear)            errs.entryYear     = 'Angkatan wajib dipilih';
    if (!form.studentStatus)        errs.studentStatus = 'Status mahasiswa wajib dipilih';
    return errs;
  };

  const handleSubmit = () => {
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      const allTouched = Object.fromEntries(Object.keys(errs).map((k) => [k, true]));
      setTouched((p) => ({ ...p, ...allTouched }));
      return;
    }

    const payload = {
      nim: form.nim, name: form.name,
      birthPlace: form.birthPlace || undefined, birthDate: form.birthDate || undefined,
      gender: form.gender, agama: form.agama || undefined, email: form.email || undefined, phoneNumber: form.phoneNumber || undefined,
      facultyId: form.facultyId, studyProgramId: form.studyProgramId,
      curriculumId: form.curriculumId || undefined,
      academicSemesterId: form.academicSemesterId || undefined,
      entryYear: Number(form.entryYear), admissionPath: form.admissionPath,
      studentStatus: form.studentStatus, isActive: form.isActive,
    };

    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  // ─── Import via Excel ─────────────────────────────────────────────────────

  const resetImport = () => {
    setImportStep(1);
    setImportFacultyId('');
    setImportProdiId('');
    setImportGender('LAKI_LAKI');
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
        const wb   = XLSX.read(new Uint8Array(evt.target?.result as ArrayBuffer), { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        const parsed: ImportRow[] = rows
          .map((row) => ({ nim: String(row[0] ?? '').trim(), name: String(row[1] ?? '').trim() }))
          .filter((r) => r.nim && r.nim.toLowerCase() !== 'nim')
          .map((r) => {
            const entryYear = nimToAngkatan(r.nim);
            const valid = r.nim.length >= 3 && r.name.length >= 2;
            return { nim: r.nim, name: r.name, entryYear, valid, error: !valid ? 'NIM atau Nama tidak valid' : undefined };
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
        await studentService.create({
          nim:           row.nim,
          name:          row.name,
          gender:        importGender,
          facultyId:     importFacultyId,
          studyProgramId: importProdiId,
          entryYear:     row.entryYear,
          studentStatus: 'AKTIF',
          admissionPath: 'REGULER',
          isActive:      true,
        });
      } catch {
        failed.push(row.nim);
      }
      setImportProgress({ done: i + 1, total: validRows.length });
    }

    setImportResult({ success: validRows.length - failed.length, failed });
    queryClient.invalidateQueries({ queryKey: ['students'] });
  };

  // ─── Table ────────────────────────────────────────────────────────────────

  const headers: Header<Student>[] = [
    {
      key: 'nim', title: 'NIM', sortable: true,
      render: (row) => <span className="font-mono text-xs font-semibold text-gray-800">{row.nim}</span>,
    },
    {
      key: 'name', title: 'Nama', sortable: true,
      render: (row) => (
        <div className="cursor-pointer" onClick={() => { setDetailId(row.id); setDetailOpen(true); }}>
          <p className="text-sm font-semibold text-gray-800">{row.name}</p>
          <p className="text-xs text-gray-400">{row.email ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'studyProgramId', title: 'Program Studi',
      render: (row) => <span className="text-xs text-gray-700">{row.studyProgram?.name ?? '—'}</span>,
    },
    {
      key: 'entryYear', title: 'Angkatan', sortable: true,
      render: (row) => <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">{row.entryYear}</span>,
    },
    {
      key: 'studentStatus', title: 'Status Mahasiswa',
      render: (row) => <StudentStatusBadge status={row.studentStatus} />,
    },
    {
      key: 'gender', title: 'Jenis Kelamin',
      render: (row) => <span className="text-xs text-gray-600">{row.gender === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}</span>,
    },
    {
      key: 'id', title: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
            <Pencil size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); setConfirmDeleteOpen(true); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Hapus">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const total       = data?.meta?.total ?? 0;
  const activeTotal = activeData?.meta?.total ?? 0;
  const lulusTotal  = lulusData?.meta?.total ?? 0;
  const cutiTotal   = cutiData?.meta?.total ?? 0;

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

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master Mahasiswa</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data mahasiswa program studi</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tombol import sementara */}
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
            Tambah Mahasiswa
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Mahasiswa" value={total}       icon={<Users size={18} />}          color="blue"    />
        <StatCard label="Aktif"           value={activeTotal} icon={<CheckCircle2 size={18} />}   color="green"   />
        <StatCard label="Lulus"           value={lulusTotal}  icon={<GraduationCap size={18} />}  color="emerald" />
        <StatCard label="Cuti"            value={cutiTotal}   icon={<Clock size={18} />}           color="yellow"  />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="text" placeholder="Cari NIM, nama, email..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>

          <select value={filterFaculty} onChange={(e) => { setFilterFaculty(e.target.value); setFilterProdi(''); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white min-w-[150px]">
            <option value="">Semua Fakultas</option>
            {faculties?.data?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>

          <select value={filterProdi} onChange={(e) => setFilterProdi(e.target.value)}
            disabled={!filterFaculty}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white min-w-[150px] disabled:opacity-50">
            <option value="">Semua Prodi</option>
            {filterStudyPrograms?.data?.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
          </select>

          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
            <option value="">Semua Angkatan</option>
            {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
            <option value="">Semua Status</option>
            {STUDENT_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
            <option value="">Semua Jenis Kelamin</option>
            {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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

      {/* ─── Create / Edit Drawer ───────────────────────────────────────── */}
      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); resetForm(); }}
        title={editingId ? 'Edit Mahasiswa' : 'Tambah Mahasiswa Baru'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setDrawerOpen(false); resetForm(); }}>Batal</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Tambah Mahasiswa')}
            </Button>
          </div>
        }
      >
        <div className="space-y-6 p-1">
          {formErrors.api && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <XCircle size={15} className="shrink-0" /> {formErrors.api}
            </div>
          )}

          {/* Section 1: Data Mahasiswa */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Users size={15} className="text-primary" /> Data Mahasiswa
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="sm:col-span-2">
                <label className={LABEL_CLS}>NIM <span className="text-red-500">*</span></label>
                <Input value={form.nim} onChange={(e) => handleFormChange('nim', e.target.value)} onBlur={() => handleBlur('nim')}
                  placeholder="240611001" className={formErrors.nim ? 'border-red-400' : ''} />
                {formErrors.nim && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.nim}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL_CLS}>Nama Lengkap <span className="text-red-500">*</span></label>
                <Input value={form.name} onChange={(e) => handleFormChange('name', e.target.value)} onBlur={() => handleBlur('name')}
                  placeholder="Budi Santoso" className={formErrors.name ? 'border-red-400' : ''} />
                {formErrors.name && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.name}</p>}
              </div>

              <div>
                <label className={LABEL_CLS}>Tempat Lahir</label>
                <Input value={form.birthPlace} onChange={(e) => handleFormChange('birthPlace', e.target.value)} placeholder="Bandung" />
              </div>

              <div>
                <label className={LABEL_CLS}>Tanggal Lahir</label>
                <Input type="date" value={form.birthDate} onChange={(e) => handleFormChange('birthDate', e.target.value)} />
              </div>

              <div>
                <label className={LABEL_CLS}>Jenis Kelamin <span className="text-red-500">*</span></label>
                <select value={form.gender} onChange={(e) => handleFormChange('gender', e.target.value)}
                  onBlur={() => handleBlur('gender')}
                  className={`${SELECT_CLS} ${formErrors.gender ? 'border-red-400' : ''}`}>
                  <option value="">Pilih jenis kelamin</option>
                  {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {formErrors.gender && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.gender}</p>}
              </div>

              <div>
                <label className={LABEL_CLS}>Agama</label>
                <select value={form.agama} onChange={(e) => handleFormChange('agama', e.target.value)}
                  className={SELECT_CLS}>
                  <option value="">Pilih agama</option>
                  {AGAMA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div>
                <label className={LABEL_CLS}>Email</label>
                <Input type="email" value={form.email} onChange={(e) => handleFormChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')} placeholder="budi@student.widyatama.ac.id"
                  className={formErrors.email ? 'border-red-400' : ''} />
                {formErrors.email && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.email}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL_CLS}>Nomor HP</label>
                <Input value={form.phoneNumber} onChange={(e) => handleFormChange('phoneNumber', e.target.value)} placeholder="081234567890" />
              </div>
            </div>
          </div>

          {/* Section 2: Akademik */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <BookOpen size={15} className="text-primary" /> Data Akademik
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className={LABEL_CLS}>Fakultas <span className="text-red-500">*</span></label>
                <select value={form.facultyId} onChange={(e) => handleFormChange('facultyId', e.target.value)}
                  onBlur={() => handleBlur('facultyId')}
                  className={`${SELECT_CLS} ${formErrors.facultyId ? 'border-red-400' : ''}`}>
                  <option value="">Pilih fakultas</option>
                  {faculties?.data?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                {formErrors.facultyId && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.facultyId}</p>}
              </div>

              <div>
                <label className={LABEL_CLS}>Program Studi <span className="text-red-500">*</span></label>
                <select value={form.studyProgramId} onChange={(e) => handleFormChange('studyProgramId', e.target.value)}
                  onBlur={() => handleBlur('studyProgramId')}
                  disabled={!form.facultyId || isLoadingProdi}
                  className={`${SELECT_CLS} disabled:opacity-50 ${formErrors.studyProgramId ? 'border-red-400' : ''}`}>
                  <option value="">
                    {isLoadingProdi ? 'Memuat...' : 'Pilih program studi'}
                  </option>
                  {drawerStudyPrograms?.data?.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                </select>
                {formErrors.studyProgramId && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.studyProgramId}</p>}
              </div>

              <div>
                <label className={LABEL_CLS}>Kurikulum</label>
                <select value={form.curriculumId} onChange={(e) => handleFormChange('curriculumId', e.target.value)}
                  disabled={!form.studyProgramId || isLoadingKurikulum}
                  className={`${SELECT_CLS} disabled:opacity-50`}>
                  <option value="">
                    {isLoadingKurikulum ? 'Memuat...' : 'Pilih kurikulum'}
                  </option>
                  {drawerCurriculums?.data?.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
                </select>
              </div>

              <div>
                <label className={LABEL_CLS}>Angkatan <span className="text-red-500">*</span></label>
                <select value={form.entryYear} onChange={(e) => handleFormChange('entryYear', e.target.value)}
                  onBlur={() => handleBlur('entryYear')}
                  className={`${SELECT_CLS} ${formErrors.entryYear ? 'border-red-400' : ''}`}>
                  <option value="">Pilih angkatan</option>
                  {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                {formErrors.entryYear && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.entryYear}</p>}
              </div>

              <div>
                <label className={LABEL_CLS}>Semester Masuk</label>
                <select value={form.academicSemesterId} onChange={(e) => handleFormChange('academicSemesterId', e.target.value)}
                  className={SELECT_CLS}>
                  <option value="">Pilih semester masuk</option>
                  {academicSemesters?.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className={LABEL_CLS}>Jalur Masuk</label>
                <select value={form.admissionPath} onChange={(e) => handleFormChange('admissionPath', e.target.value)}
                  className={SELECT_CLS}>
                  {ADMISSION_PATH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Status */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-primary" /> Status Mahasiswa
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLS}>Status Mahasiswa <span className="text-red-500">*</span></label>
                <select value={form.studentStatus} onChange={(e) => handleFormChange('studentStatus', e.target.value)}
                  onBlur={() => handleBlur('studentStatus')}
                  className={`${SELECT_CLS} ${formErrors.studentStatus ? 'border-red-400' : ''}`}>
                  {STUDENT_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {formErrors.studentStatus && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{formErrors.studentStatus}</p>}
              </div>

              <div className="flex items-center gap-3 pt-7">
                <Switch checked={form.isActive} onCheckedChange={(v) => handleFormChange('isActive', v)} />
                <label className="text-sm font-medium text-gray-700">Status Aktif</label>
              </div>
            </div>
          </div>
        </div>
      </Drawer>

      {/* ─── Detail Drawer ─────────────────────────────────────────────── */}
      <Drawer
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailId(null); }}
        title="Detail Mahasiswa"
        size="md"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setDetailOpen(false); if (detailData?.data) openEdit(detailData.data); }}>
              <Pencil size={14} className="mr-1" /> Edit
            </Button>
            <Button variant="outline" onClick={() => { setDeleteId(detailId); setConfirmDeleteOpen(true); setDetailOpen(false); }}
              className="text-red-600 border-red-200 hover:bg-red-50">
              <Trash2 size={14} className="mr-1" /> Hapus
            </Button>
          </div>
        }
      >
        {detailData?.data ? (() => {
          const s = detailData.data;
          return (
            <div className="space-y-4 p-1">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold uppercase shrink-0">
                  {s.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-800">{s.name}</h2>
                  <p className="text-sm text-gray-500 font-mono">{s.nim}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <StudentStatusBadge status={s.studentStatus} />
                    <AdmissionPathBadge path={s.admissionPath} />
                  </div>
                </div>
              </div>

              <div className="space-y-0">
                {[
                  ['Jenis Kelamin',  s.gender === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'],
                  ['Agama',         s.agama ? (AGAMA_OPTIONS.find((o) => o.value === s.agama)?.label ?? s.agama) : '—'],
                  ['Email',          s.email ?? '—'],
                  ['No. HP',         s.phoneNumber ?? '—'],
                  ['Tempat/Tgl Lahir', [s.birthPlace, s.birthDate?.slice(0, 10)].filter(Boolean).join(', ') || '—'],
                  ['Fakultas',       s.faculty?.name ?? '—'],
                  ['Program Studi',  s.studyProgram?.name ?? '—'],
                  ['Kurikulum',      s.curriculum ? `${s.curriculum.name} (${s.curriculum.year})` : '—'],
                  ['Angkatan',       String(s.entryYear)],
                  ['Semester Masuk', s.academicSemester?.name ?? '—'],
                  ['Dibuat',         new Date(s.createdAt).toLocaleString('id-ID')],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-medium text-gray-400 w-32 shrink-0">{label}</span>
                    <span className="text-sm text-gray-800 break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })() : (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Memuat...</div>
        )}
      </Drawer>

      {/* ─── Import via Excel Drawer ────────────────────────────────────── */}
      <Drawer
        open={importOpen}
        onClose={() => { setImportOpen(false); resetImport(); }}
        title="Tambah Mahasiswa via Excel"
        footer={
          importResult ? (
            <div className="flex justify-end gap-3">
              <Button onClick={() => { setImportOpen(false); resetImport(); }}>Selesai</Button>
            </div>
          ) : importProgress ? null : importStep === 1 ? (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setImportOpen(false); resetImport(); }}>Batal</Button>
              <Button
                onClick={() => setImportStep(2)}
                disabled={!importFacultyId || !importProdiId}
              >
                Lanjut <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => { setImportRows([]); setImportStep(1); }}>
                <ChevronLeft size={14} className="mr-1" /> Kembali
              </Button>
              <Button
                onClick={runImport}
                disabled={importRows.filter(r => r.valid).length === 0}
              >
                <Upload size={14} className="mr-1" />
                Import {importRows.filter(r => r.valid).length} Mahasiswa
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
                Fitur ini bersifat sementara untuk import data awal. Jenis kelamin akan diatur secara default dan dapat diperbarui setelah import.
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

              <div>
                <label className={LABEL_CLS}>Default Jenis Kelamin <span className="text-xs text-gray-400 font-normal">(berlaku untuk seluruh batch)</span></label>
                <select
                  value={importGender}
                  onChange={(e) => setImportGender(e.target.value as 'LAKI_LAKI' | 'PEREMPUAN')}
                  className={SELECT_CLS}
                >
                  <option value="LAKI_LAKI">Laki-laki</option>
                  <option value="PEREMPUAN">Perempuan</option>
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
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white">
                        <td className="px-2 py-1 border border-gray-200 text-gray-500 italic">NIM (header, opsional)</td>
                        <td className="px-2 py-1 border border-gray-200 text-gray-500 italic">Nama (header, opsional)</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="px-2 py-1 border border-gray-200">2400001</td>
                        <td className="px-2 py-1 border border-gray-200">Budi Santoso</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="px-2 py-1 border border-gray-200">2400002</td>
                        <td className="px-2 py-1 border border-gray-200">Siti Rahayu</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Angkatan dihitung otomatis dari 2 digit pertama NIM (24xxx → 2024)
                </p>
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
                  {faculties?.data?.find(f => f.id === importFacultyId)?.name}
                </span>
                <span className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full font-medium">
                  {importStudyPrograms?.data?.find(p => p.id === importProdiId)?.name}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                  {importGender === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}
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
                      Preview: {importRows.filter(r => r.valid).length} valid,{' '}
                      <span className="text-red-500">{importRows.filter(r => !r.valid).length} error</span>
                    </p>
                    <p className="text-[11px] text-gray-400">{importRows.length} baris ditemukan</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-y-auto max-h-64">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600 w-28">NIM</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Nama</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600 w-16">Angkatan</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600 w-12">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importRows.map((row, i) => (
                            <tr key={i} className={`border-b border-gray-50 ${!row.valid ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                              <td className="px-3 py-1.5 font-mono text-gray-700">{row.nim}</td>
                              <td className="px-3 py-1.5 text-gray-800 max-w-[140px] truncate">{row.name}</td>
                              <td className="px-3 py-1.5 text-center text-gray-600">{row.entryYear}</td>
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
                  <span>Mengimport mahasiswa...</span>
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
                    {importResult.success} mahasiswa berhasil ditambahkan.
                    {importResult.failed.length > 0 && ` ${importResult.failed.length} gagal (NIM mungkin sudah terdaftar).`}
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
                Jenis kelamin dapat diperbarui di detail masing-masing mahasiswa.
              </p>
            </div>
          )}
        </div>
      </Drawer>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Hapus Mahasiswa"
        description="Apakah Anda yakin ingin menghapus data mahasiswa ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
