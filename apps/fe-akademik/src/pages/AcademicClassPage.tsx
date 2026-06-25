import { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as XLSX from 'xlsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Input, Button, Drawer, Switch } from '@widyatama/ui';
import type { DataTableOptions, Header } from '@widyatama/ui';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { academicClassService } from '@/services/academicClass.service';
import { academicSemesterService } from '@/services/academicSemester.service';
import { courseService } from '@/services/course.service';
import { lecturerService } from '@/services/lecturer.service';
import { studentService } from '@/services/student.service';
import { obeService } from '@/services/obeService';
import { SearchCombobox } from '@/components/common/SearchCombobox';
import type { AcademicClass } from '@/types';
import {
  School, Search, Plus, Pencil, Trash2,
  CheckCircle2, XCircle, Users, BookOpen,
  GraduationCap, Upload, FileSpreadsheet, Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface XlsxStudentRow {
  nim: string;
  studentId: string | null;
  name: string | null;
  nilaiAkhir: number | null;
}

// ─── Grade helpers ────────────────────────────────────────────────────────────

function getGradeFromScore(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'B-';
  if (score >= 60) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'E';
}

function gradeBadgeClass(grade: string | null | undefined) {
  const map: Record<string, string> = {
    'A':  'bg-emerald-100 text-emerald-700 border-emerald-200',
    'A-': 'bg-emerald-50 text-emerald-600 border-emerald-200',
    'B+': 'bg-blue-100 text-blue-700 border-blue-200',
    'B':  'bg-blue-50 text-blue-700 border-blue-200',
    'B-': 'bg-indigo-50 text-indigo-600 border-indigo-200',
    'C+': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'C':  'bg-yellow-50 text-yellow-600 border-yellow-100',
    'D':  'bg-orange-50 text-orange-700 border-orange-200',
    'E':  'bg-red-50 text-red-700 border-red-200',
  };
  return grade ? (map[grade] ?? 'bg-gray-100 text-gray-600') : 'bg-gray-100 text-gray-400';
}

// ─── OBE score seeding ────────────────────────────────────────────────────────
// Nilai akhir langsung di-assign ke semua komponen CPMK.
// Karena Σ(nilaiAkhir * weight_i / 100) = nilaiAkhir × (Σweight / 100) = nilaiAkhir
// ketika total bobot = 100%, nilai akhir yang dihasilkan akan sama persis.

function seedScoresFromFinal(
  studentId: string,
  nilaiAkhir: number,
  entries: { cpmkId: string; assessmentComponentId: string; weight: number }[],
): { studentId: string; cpmkId: string; assessmentComponentId: string; score: number }[] {
  const score = Math.max(0, Math.min(100, Math.round(nilaiAkhir)));
  return entries.map((e) => ({
    studentId,
    cpmkId: e.cpmkId,
    assessmentComponentId: e.assessmentComponentId,
    score,
  }));
}

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['NIM', 'Nilai Akhir'],
    ['2100001', 85],
    ['2100002', 78],
  ]);
  ws['!cols'] = [{ wch: 16 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, 'template_nilai_kelas.xlsx');
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const classSchema = z.object({
  semesterId:          z.string().min(1, 'Semester akademik wajib dipilih'),
  courseId:            z.string().min(1, 'Mata kuliah wajib dipilih'),
  name:                z.string().min(1, 'Nama kelas wajib diisi').max(200),
  capacity:            z.number({ invalid_type_error: 'Kapasitas harus berupa angka' })
                        .int().min(1, 'Kapasitas minimal 1').max(200, 'Kapasitas maksimal 200'),
  isActive:            z.boolean(),
  primaryLecturerId:   z.string().min(1, 'Dosen utama wajib dipilih'),
  assistantLecturerId: z.string().optional(),
  studentIds:          z.array(z.string()).optional(),
});

type ClassFormData = z.infer<typeof classSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const LABEL_CLS = 'block text-sm font-medium text-gray-700 mb-1.5';

// ─── Sub-components ───────────────────────────────────────────────────────────

function CapacityBadge({ current, max }: { current: number; max: number }) {
  const pct = (current / max) * 100;
  const cls = pct >= 100 ? 'bg-red-50 text-red-700 border-red-200'
    : pct >= 80 ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}>
      {current}/{max}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AcademicClassPage() {
  const queryClient = useQueryClient();

  const [search, setSearch]     = useState('');
  const debouncedSearch         = useDebounce(search);
  const [options, setOptions]   = useState<DataTableOptions<AcademicClass>>({
    page: 1, itemsPerPage: 10, sortBy: 'name' as keyof AcademicClass, sortDesc: false,
  });
  const [filterSemesterId, setFilterSemesterId] = useState('');
  const [filterCourseId, setFilterCourseId]     = useState('');
  const [filterStatus, setFilterStatus]         = useState('');

  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [xlsxRows, setXlsxRows]       = useState<XlsxStudentRow[]>([]);
  const [isSaving, setIsSaving]       = useState(false);

  const [detailOpen, setDetailOpen]         = useState(false);
  const [detailId, setDetailId]             = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteId, setDeleteId]             = useState<string | null>(null);
  const [toastMsg, setToastMsg]             = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const xlsxInputRef = useRef<HTMLInputElement>(null);

  // Label untuk SearchCombobox di edit mode (supaya langsung tampil tanpa buka dropdown)
  const [displayValues, setDisplayValues] = useState({
    semesterId: '', courseId: '', primaryLecturerId: '', assistantLecturerId: '',
  });

  // ─── Form ────────────────────────────────────────────────────────────────

  const {
    register, control, handleSubmit, reset, watch, setValue,
    formState: { errors },
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      semesterId: '', courseId: '', name: '', capacity: 40,
      isActive: true, primaryLecturerId: '', assistantLecturerId: '', studentIds: [],
    },
  });

  const watchedStudentIds = watch('studentIds') ?? [];
  const watchedCapacity   = watch('capacity');

  // ─── Queries ─────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['academic-classes', options.page, options.itemsPerPage, debouncedSearch, filterSemesterId, filterCourseId, filterStatus],
    queryFn: () => academicClassService.getAll({
      page: options.page, limit: options.itemsPerPage,
      search: debouncedSearch || undefined,
      semesterId: filterSemesterId || undefined,
      courseId: filterCourseId || undefined,
      isActive: filterStatus === '' ? undefined : filterStatus === 'true',
    }),
  });

  const { data: activeData } = useQuery({
    queryKey: ['academic-classes', 'stat-active'],
    queryFn:  () => academicClassService.getAll({ isActive: true, limit: 1 }),
  });

  // Semester dan MK masih diload untuk filter bar (ringan)
  const { data: semesters } = useQuery({
    queryKey: ['academic-semesters', 'filter-list'],
    queryFn:  () => academicSemesterService.getAll({ page: 1, limit: 50 }),
  });

  const { data: courses } = useQuery({
    queryKey: ['courses', 'filter-list'],
    queryFn:  () => courseService.getAll({ page: 1, limit: 50 }),
  });

  // ─── Fetch functions untuk SearchCombobox ────────────────────────────────

  const fetchSemesters = async ({ search, page, limit }: { search: string; page: number; limit: number }) => {
    const res = await academicSemesterService.getAll({ search: search || undefined, page, limit });
    return {
      data: (res.data ?? []).map((s) => ({ value: s.id, label: s.name, sublabel: s.academicYear })),
      hasMore: (res.meta?.page ?? 0) < (res.meta?.totalPages ?? 1),
    };
  };

  const fetchCourses = async ({ search, page, limit }: { search: string; page: number; limit: number }) => {
    const res = await courseService.getAll({ search: search || undefined, page, limit });
    return {
      data: (res.data ?? []).map((c) => ({ value: c.id, label: c.name, sublabel: `${c.code} · ${c.sks} SKS` })),
      hasMore: (res.meta?.page ?? 0) < (res.meta?.totalPages ?? 1),
    };
  };

  const fetchLecturers = async ({ search, page, limit }: { search: string; page: number; limit: number }) => {
    const res = await lecturerService.getAll({ search: search || undefined, page, limit, isActive: true });
    return {
      data: (res.data ?? []).map((l) => ({
        value: l.id,
        label: formatLecturerName(l),
        sublabel: `NIDN: ${l.nidn}`,
      })),
      hasMore: (res.meta?.page ?? 0) < (res.meta?.totalPages ?? 1),
    };
  };

  const { data: allStudents } = useQuery({
    queryKey: ['students', 'all-active'],
    queryFn:  () => studentService.getAll({ page: 1, limit: 500, studentStatus: 'AKTIF' }),
    enabled:  drawerOpen,
  });

  const { data: detailData } = useQuery({
    queryKey: ['academic-classes', 'detail', detailId],
    queryFn:  () => academicClassService.getById(detailId!),
    enabled:  !!detailId && detailOpen,
  });

  // Query detail saat mode edit — untuk mengisi studentIds yang tidak ada di list endpoint
  const { data: editDetailData, isLoading: editDetailLoading } = useQuery({
    queryKey: ['academic-classes', 'edit-detail', editingId],
    queryFn:  () => academicClassService.getById(editingId!),
    enabled:  !!editingId && drawerOpen,
  });

  // Isi studentIds dari detail saat data tiba
  useEffect(() => {
    if (editDetailData?.data && editingId) {
      const students = (editDetailData.data as AcademicClass).students ?? [];
      setValue('studentIds', students.map((s) => s.studentId));
    }
  }, [editDetailData, editingId]);

  // ─── Mutations ────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: academicClassService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
      setConfirmDeleteOpen(false);
      showToast('success', 'Kelas perkuliahan berhasil dihapus.');
    },
    onError: (err: any) => {
      setConfirmDeleteOpen(false);
      showToast('error', err.response?.data?.message || 'Gagal menghapus kelas perkuliahan');
    },
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const resetForm = () => {
    reset({
      semesterId: '', courseId: '', name: '', capacity: 40,
      isActive: true, primaryLecturerId: '', assistantLecturerId: '', studentIds: [],
    });
    setEditingId(null);
    setStudentSearch('');
    setXlsxRows([]);
    setDisplayValues({ semesterId: '', courseId: '', primaryLecturerId: '', assistantLecturerId: '' });
  };

  const openCreate = () => { resetForm(); setDrawerOpen(true); };

  const openEdit = (row: AcademicClass) => {
    setEditingId(row.id);
    const primaryLecturer   = row.lecturers?.find((l) => l.role === 'PRIMARY');
    const assistantLecturer = row.lecturers?.find((l) => l.role === 'ASSISTANT');
    reset({
      semesterId:          row.semesterId,
      courseId:            row.courseId,
      name:                row.name,
      capacity:            row.capacity,
      isActive:            row.isActive,
      primaryLecturerId:   primaryLecturer?.lecturerId ?? '',
      assistantLecturerId: assistantLecturer?.lecturerId ?? '',
      studentIds:          row.students?.map((s) => s.studentId) ?? [],
    });
    // Set display labels agar SearchCombobox langsung tampil label yang benar
    setDisplayValues({
      semesterId:          row.semester?.name ?? '',
      courseId:            row.course?.name ?? '',
      primaryLecturerId:   formatLecturerName(primaryLecturer?.lecturer),
      assistantLecturerId: formatLecturerName(assistantLecturer?.lecturer),
    });
    setStudentSearch('');
    setXlsxRows([]);
    setDrawerOpen(true);
  };

  const onSubmit = async (formData: ClassFormData) => {
    setIsSaving(true);
    try {
      const lecturerList: { lecturerId: string; role: string }[] = [
        { lecturerId: formData.primaryLecturerId, role: 'PRIMARY' },
      ];
      if (formData.assistantLecturerId) {
        lecturerList.push({ lecturerId: formData.assistantLecturerId, role: 'ASSISTANT' });
      }
      const payload = {
        semesterId: formData.semesterId,
        courseId:   formData.courseId,
        code:       formData.name.trim(),
        name:       formData.name.trim(),
        capacity:   formData.capacity,
        isActive:   formData.isActive,
        lecturers:  lecturerList,
        studentIds: formData.studentIds ?? [],
      };

      let classId: string;
      if (editingId) {
        await academicClassService.update(editingId, payload);
        classId = editingId;
      } else {
        const res = await academicClassService.create(payload);
        classId = res.data.id;
      }

      // Auto-seed nilai CPMK di OBE jika ada data Nilai Akhir dari XLSX
      const rowsWithScore = xlsxRows.filter((r) => r.studentId && r.nilaiAkhir !== null);
      if (rowsWithScore.length > 0) {
        const weightsRes = await obeService.getWeightsByCourse(formData.courseId);
        const weightEntries = weightsRes.data ?? [];
        if (weightEntries.length > 0) {
          const allScoreEntries = rowsWithScore.flatMap((r) =>
            seedScoresFromFinal(r.studentId!, r.nilaiAkhir!, weightEntries)
          );
          await obeService.bulkSaveScores({
            classId,
            courseId: formData.courseId,
            scores: allScoreEntries,
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
      setDrawerOpen(false);
      resetForm();
      showToast('success', editingId ? 'Kelas perkuliahan berhasil diperbarui.' : 'Kelas perkuliahan berhasil dibuat.');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Gagal menyimpan kelas perkuliahan');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    const current = watchedStudentIds;
    if (current.includes(studentId)) {
      setValue('studentIds', current.filter((id) => id !== studentId), { shouldValidate: true });
    } else if (current.length < watchedCapacity) {
      setValue('studentIds', [...current, studentId], { shouldValidate: true });
    }
  };

  // ─── XLSX Upload (NIM + Nilai) ────────────────────────────────────────────

  const toFloat = (v: any): number | null => {
    const n = parseFloat(String(v ?? '').trim());
    return isNaN(n) ? null : Math.min(100, Math.max(0, n));
  };

  const handleXlsxUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb   = XLSX.read(new Uint8Array(evt.target?.result as ArrayBuffer), { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        const studentMap = new Map(
          (allStudents?.data ?? []).map((s) => [s.nim.trim(), s]),
        );

        const parsed: XlsxStudentRow[] = rows
          .map((row) => ({
            nim:        String(row[0] ?? '').trim(),
            studentId:  null as string | null,
            name:       null as string | null,
            nilaiAkhir: toFloat(row[1]),
          }))
          .filter((r) => r.nim && r.nim.toLowerCase() !== 'nim' && r.nim.toLowerCase() !== 'npm')
          .map((r) => {
            const student = studentMap.get(r.nim);
            return { ...r, studentId: student?.id ?? null, name: student?.name ?? null };
          });

        setXlsxRows(parsed);

        const found  = parsed.filter((r) => r.studentId).map((r) => r.studentId as string);
        const merged = [...new Set([...watchedStudentIds, ...found])];
        setValue('studentIds', merged, { shouldValidate: true });
      } catch {
        showToast('error', 'Gagal membaca file XLSX. Pastikan format file benar.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (xlsxInputRef.current) xlsxInputRef.current.value = '';
  };

  const formatLecturerName = (lecturer: { name: string; frontTitle: string | null; backTitle: string | null } | null | undefined) => {
    if (!lecturer) return '—';
    return [lecturer.frontTitle, lecturer.name, lecturer.backTitle ? `, ${lecturer.backTitle}` : ''].filter(Boolean).join(' ').trim();
  };

  const filteredStudents = (allStudents?.data ?? []).filter((s) => {
    if (!studentSearch) return true;
    const q = studentSearch.toLowerCase();
    return s.nim.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
  });


  // ─── Table Headers ─────────────────────────────────────────────────────────

  const headers: Header<AcademicClass>[] = [
    {
      key: 'name', title: 'Nama Kelas', sortable: true,
      render: (row) => (
        <div className="cursor-pointer" onClick={() => { setDetailId(row.id); setDetailOpen(true); }}>
          <p className="text-sm font-semibold text-gray-800 hover:text-primary">{row.name}</p>
        </div>
      ),
    },
    {
      key: 'courseId', title: 'Mata Kuliah',
      render: (row) => (
        <div>
          <p className="text-xs font-medium text-gray-700">{row.course?.name ?? '—'}</p>
          <p className="text-[11px] text-gray-400">{row.course?.code ?? ''} · {row.course?.sks ?? 0} SKS</p>
        </div>
      ),
    },
    {
      key: 'semesterId', title: 'Semester',
      render: (row) => (
        <div>
          <p className="text-xs font-medium text-gray-700">{row.semester?.name ?? '—'}</p>
          <p className="text-[11px] text-gray-400">{row.semester?.academicYear ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'lecturers' as keyof AcademicClass, title: 'Dosen Pengampu',
      render: (row) => {
        const primary   = row.lecturers?.find((l) => l.role === 'PRIMARY');
        const assistant = row.lecturers?.find((l) => l.role === 'ASSISTANT');
        return (
          <div>
            <p className="text-xs font-medium text-gray-700">{formatLecturerName(primary?.lecturer)}</p>
            {assistant && <p className="text-[11px] text-gray-400">Asisten: {formatLecturerName(assistant?.lecturer)}</p>}
          </div>
        );
      },
    },
    {
      key: 'capacity', title: 'Mahasiswa / Kapasitas',
      render: (row) => <CapacityBadge current={row.totalStudents ?? 0} max={row.capacity} />,
    },
    {
      key: 'isActive', title: 'Status',
      render: (row) => <StatusBadge active={row.isActive} />,
    },
    {
      key: 'id', title: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit Kelas">
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

      <PageHeader
        title="Kelas Perkuliahan"
        description="Kelola kelas perkuliahan, dosen pengampu, dan mahasiswa"
        action={{ label: 'Tambah Kelas', onClick: openCreate, icon: <Plus size={16} /> }}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Kelas"   value={total}       icon={<School size={18} />}       color="blue"   />
        <StatCard label="Kelas Aktif"   value={activeTotal} icon={<CheckCircle2 size={18} />} color="green"  />
        <StatCard label="Semester"      value={semesters?.meta?.total ?? 0} icon={<BookOpen size={18} />}     color="purple" />
        <StatCard label="Mata Kuliah"   value={courses?.meta?.total ?? 0}   icon={<GraduationCap size={18} />} color="yellow" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="text" placeholder="Cari nama kelas atau mata kuliah..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <select value={filterSemesterId} onChange={(e) => setFilterSemesterId(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white min-w-[180px]">
            <option value="">Semua Semester</option>
            {semesters?.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filterCourseId} onChange={(e) => setFilterCourseId(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white min-w-[180px]">
            <option value="">Semua Mata Kuliah</option>
            {courses?.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
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
        title={editingId ? 'Edit Kelas Perkuliahan' : 'Tambah Kelas Perkuliahan'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setDrawerOpen(false); resetForm(); }}>Batal</Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSaving}>
              {isSaving ? (
                <><Loader2 size={14} className="mr-1 animate-spin" />Menyimpan...</>
              ) : editingId ? 'Simpan Perubahan' : 'Buat Kelas'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6 p-1">

          {/* Section 1: Data Kelas */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <School size={15} className="text-primary" /> Data Kelas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className={LABEL_CLS}>Semester Akademik <span className="text-red-500">*</span></label>
                <Controller name="semesterId" control={control}
                  render={({ field }) => (
                    <SearchCombobox
                      value={field.value}
                      onChange={field.onChange}
                      displayValue={displayValues.semesterId}
                      placeholder="Pilih semester..."
                      error={!!errors.semesterId}
                      fetchOptions={fetchSemesters}
                    />
                  )}
                />
                {errors.semesterId && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{errors.semesterId.message}</p>}
              </div>

              <div>
                <label className={LABEL_CLS}>Mata Kuliah <span className="text-red-500">*</span></label>
                <Controller name="courseId" control={control}
                  render={({ field }) => (
                    <SearchCombobox
                      value={field.value}
                      onChange={field.onChange}
                      displayValue={displayValues.courseId}
                      placeholder="Pilih mata kuliah..."
                      error={!!errors.courseId}
                      fetchOptions={fetchCourses}
                    />
                  )}
                />
                {errors.courseId && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{errors.courseId.message}</p>}
              </div>

              <div>
                <label className={LABEL_CLS}>Nama Kelas <span className="text-red-500">*</span></label>
                <Input {...register('name')} placeholder="A / B / C / Reguler / Karyawan"
                  className={errors.name ? 'border-red-400' : ''} />
                {errors.name && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{errors.name.message}</p>}
              </div>

              <div>
                <label className={LABEL_CLS}>Kapasitas <span className="text-red-500">*</span></label>
                <Input type="number" {...register('capacity', { valueAsNumber: true })} placeholder="40" min={1} max={200}
                  className={errors.capacity ? 'border-red-400' : ''} />
                {errors.capacity && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{errors.capacity.message}</p>}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Controller name="isActive" control={control}
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                />
                <label className="text-sm font-medium text-gray-700">Status Aktif</label>
              </div>
            </div>
          </div>

          {/* Section 2: Dosen Pengampu */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <GraduationCap size={15} className="text-primary" /> Dosen Pengampu
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLS}>Dosen Utama <span className="text-red-500">*</span></label>
                <Controller name="primaryLecturerId" control={control}
                  render={({ field }) => (
                    <SearchCombobox
                      value={field.value}
                      onChange={field.onChange}
                      displayValue={displayValues.primaryLecturerId}
                      placeholder="Pilih dosen utama..."
                      error={!!errors.primaryLecturerId}
                      fetchOptions={fetchLecturers}
                    />
                  )}
                />
                {errors.primaryLecturerId && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><XCircle size={11} />{errors.primaryLecturerId.message}</p>}
              </div>
              <div>
                <label className={LABEL_CLS}>Dosen Asisten <span className="text-gray-400 font-normal">(opsional)</span></label>
                <Controller name="assistantLecturerId" control={control}
                  render={({ field }) => (
                    <SearchCombobox
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      displayValue={displayValues.assistantLecturerId}
                      placeholder="Tidak ada asisten..."
                      fetchOptions={fetchLecturers}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Mahasiswa */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Users size={15} className="text-primary" /> Mahasiswa
            </h3>

            {/* Counter + Clear */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-gray-500 flex items-center gap-1.5">
                {editDetailLoading && editingId ? (
                  <><Loader2 size={12} className="animate-spin text-primary" />Memuat daftar mahasiswa...</>
                ) : (
                  <>Dipilih: <span className={`font-semibold ${watchedStudentIds.length > watchedCapacity ? 'text-red-600' : 'text-gray-800'}`}>
                    {watchedStudentIds.length}
                  </span> / {watchedCapacity} mahasiswa</>
                )}
              </span>
              {watchedStudentIds.length > 0 && (
                <button type="button" onClick={() => { setValue('studentIds', []); setXlsxRows([]); }}
                  className="text-xs text-red-500 hover:underline">
                  Hapus semua
                </button>
              )}
            </div>

            {/* Upload XLSX */}
            <div className="mb-3 space-y-2">
              <input ref={xlsxInputRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={handleXlsxUpload} />

              <div className="flex gap-2">
                <button type="button" onClick={() => xlsxInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-xs font-medium text-gray-500 hover:border-primary hover:text-primary transition-colors">
                  <Upload size={14} />
                  {xlsxRows.length > 0 ? 'Ganti File XLSX' : 'Upload Excel (NIM + Nilai Akhir)'}
                </button>
                <button type="button" onClick={downloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors whitespace-nowrap">
                  <FileSpreadsheet size={14} />
                  Template
                </button>
              </div>

              {/* Format hint */}
              <div className="px-3 py-2 bg-blue-50 rounded-lg border border-blue-100 text-[11px] text-blue-700 space-y-0.5">
                <p className="font-semibold text-blue-800 mb-1">Format Excel (2 kolom):</p>
                <p>
                  <span className="font-mono bg-white border border-blue-200 px-1 rounded">A</span> NIM &nbsp;·&nbsp;
                  <span className="font-mono bg-white border border-blue-200 px-1 rounded">B</span> Nilai Akhir <span className="text-blue-500">(angka 0–100)</span>
                </p>
                <p className="text-blue-500 mt-0.5">• Nilai Akhir = akumulasi nilai numerik (bukan huruf mutu)</p>
                <p className="text-blue-500">• Nilai CPMK akan otomatis terisi berdasarkan nilai akhir</p>
              </div>

              {/* Preview tabel setelah upload */}
              {xlsxRows.length > 0 && (() => {
                const found   = xlsxRows.filter((r) => r.studentId);
                const missing = xlsxRows.filter((r) => !r.studentId);
                const hasScores = xlsxRows.some((r) => r.nilaiAkhir !== null);
                return (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span>
                        <span className="text-emerald-600 font-semibold">{found.length} ditemukan</span>
                        {missing.length > 0 && <span className="text-red-500 ml-1.5">{missing.length} tidak ditemukan</span>}
                        {hasScores && <span className="text-blue-600 ml-1.5">· nilai CPMK akan di-seed otomatis</span>}
                      </span>
                      <button type="button" onClick={() => {
                        setXlsxRows([]);
                        setValue('studentIds', watchedStudentIds.filter((id) => !found.map((r) => r.studentId).includes(id)));
                      }} className="text-red-400 hover:text-red-600 hover:underline">hapus</button>
                    </div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="overflow-y-auto max-h-48">
                        <table className="w-full text-[11px]">
                          <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-2 py-1.5 text-left font-semibold text-gray-500">NIM</th>
                              <th className="px-2 py-1.5 text-left font-semibold text-gray-500">Nama</th>
                              <th className="px-2 py-1.5 text-center font-semibold text-gray-500">Nilai Akhir</th>
                              <th className="px-2 py-1.5 text-center font-semibold text-gray-500">Grade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {xlsxRows.map((row, i) => {
                              const grade = row.nilaiAkhir !== null ? getGradeFromScore(row.nilaiAkhir) : null;
                              return (
                                <tr key={i} className={`border-b border-gray-50 ${!row.studentId ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                                  <td className="px-2 py-1.5 font-mono text-gray-600">{row.nim}</td>
                                  <td className="px-2 py-1.5 text-gray-700 max-w-[140px] truncate">
                                    {row.name ?? <span className="text-red-400 italic">Tidak ditemukan</span>}
                                  </td>
                                  <td className="px-2 py-1.5 text-center font-semibold text-gray-700">
                                    {row.nilaiAkhir !== null ? row.nilaiAkhir : <span className="text-gray-300">—</span>}
                                  </td>
                                  <td className="px-2 py-1.5 text-center">
                                    {grade ? (
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${gradeBadgeClass(grade)}`}>
                                        {grade}
                                      </span>
                                    ) : <span className="text-gray-300">—</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Search mahasiswa */}
            <div className="relative mb-2">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="text" placeholder="Cari NIM atau nama mahasiswa..."
                value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>

            {/* Daftar mahasiswa */}
            <div className="border border-gray-200 rounded-lg overflow-y-auto max-h-52">
              {filteredStudents.length === 0 ? (
                <div className="flex items-center justify-center h-16 text-xs text-gray-400">
                  {studentSearch ? 'Tidak ada mahasiswa yang cocok' : 'Belum ada data mahasiswa aktif'}
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const selected  = watchedStudentIds.includes(student.id);
                  const atCapacity = !selected && watchedStudentIds.length >= watchedCapacity;
                  return (
                    <label key={student.id}
                      className={`flex items-center gap-3 px-3 py-2 border-b border-gray-50 last:border-0 transition-colors
                        ${atCapacity ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
                        ${selected ? 'bg-primary/5' : ''}`}>
                      <input type="checkbox" checked={selected}
                        onChange={() => toggleStudent(student.id)}
                        disabled={atCapacity}
                        className="rounded border-gray-300 text-primary focus:ring-primary/30" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{student.name}</p>
                        <p className="text-[11px] text-gray-400">{student.nim} · {student.studyProgram?.name ?? '—'}</p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </Drawer>

      {/* ─── Detail Drawer ─────────────────────────────────────────────────── */}
      <Drawer
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailId(null); }}
        title="Detail Kelas Perkuliahan"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setDetailOpen(false);
              if (detailData?.data) openEdit(detailData.data as any);
            }}>
              <Pencil size={14} className="mr-1" /> Edit
            </Button>
          </div>
        }
      >
        {detailData?.data ? (() => {
          const cls = detailData.data as AcademicClass;
          return (
            <div className="space-y-4 p-1">
              <div>
                <h2 className="text-base font-bold text-gray-800">{cls.name}</h2>
                <p className="text-sm text-gray-500">{cls.course?.name} · {cls.semester?.name}</p>
                <div className="mt-1.5"><StatusBadge active={cls.isActive} /></div>
              </div>
              {[
                ['Mata Kuliah', `${cls.course?.name ?? '—'} (${cls.course?.sks ?? 0} SKS)`],
                ['Semester', `${cls.semester?.name ?? '—'} — ${cls.semester?.academicYear ?? ''}`],
                ['Kapasitas', `${cls.totalStudents ?? 0} / ${cls.capacity} mahasiswa`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-medium text-gray-400 w-28 shrink-0">{label}</span>
                  <span className="text-sm text-gray-800">{value}</span>
                </div>
              ))}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Dosen Pengampu</p>
                {cls.lecturers?.map((l) => (
                  <div key={l.id} className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${l.role === 'PRIMARY' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {l.role === 'PRIMARY' ? 'Utama' : 'Asisten'}
                    </span>
                    <span className="text-xs text-gray-700">{formatLecturerName(l.lecturer)}</span>
                  </div>
                ))}
              </div>
              {cls.students && cls.students.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Mahasiswa &amp; Nilai ({cls.students.length})</p>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-[11px] min-w-[400px]">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-500">NIM</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-500">Nama</th>
                          <th className="px-2 py-1.5 text-center font-semibold text-gray-500">Hadir</th>
                          <th className="px-2 py-1.5 text-center font-semibold text-gray-500">UTS</th>
                          <th className="px-2 py-1.5 text-center font-semibold text-gray-500">UAS</th>
                          <th className="px-2 py-1.5 text-center font-semibold text-gray-500">NA</th>
                          <th className="px-2 py-1.5 text-center font-semibold text-gray-500">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="max-h-48 overflow-y-auto">
                        {cls.students.map((s) => (
                          <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-2 py-1.5 font-mono text-gray-500">{s.student?.nim ?? '—'}</td>
                            <td className="px-2 py-1.5 text-gray-700 max-w-[100px] truncate">{s.student?.name ?? '—'}</td>
                            <td className="px-2 py-1.5 text-center text-gray-600">{s.kehadiran ?? '—'}</td>
                            <td className="px-2 py-1.5 text-center text-gray-600">{s.uts ?? '—'}</td>
                            <td className="px-2 py-1.5 text-center text-gray-600">{s.uas ?? '—'}</td>
                            <td className="px-2 py-1.5 text-center font-semibold text-gray-800">{s.nilaiAkhir?.toFixed(1) ?? '—'}</td>
                            <td className="px-2 py-1.5 text-center">
                              {s.grade ? (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${gradeBadgeClass(s.grade)}`}>
                                  {s.grade}
                                </span>
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })() : (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Memuat...</div>
        )}
      </Drawer>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Hapus Kelas Perkuliahan"
        description="Apakah Anda yakin ingin menghapus kelas ini? Semua data dosen dan mahasiswa dalam kelas ini akan ikut terhapus."
        confirmLabel="Hapus"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
