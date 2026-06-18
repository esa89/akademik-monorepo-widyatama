import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Input, Button, Drawer, Switch } from '@widyatama/ui';
import type { DataTableOptions } from '@widyatama/ui';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { CodeChip } from '@/components/common/CodeChip';
import { useDebounce } from '@/hooks/useDebounce';
import { courseService } from '@/services/course.service';
import { curriculumService } from '@/services/curriculum.service';
import { facultyService } from '@/services/faculty.service';
import { studyProgramService } from '@/services/studyProgram.service';
import type { Course } from '@/types';
import {
  Plus, Search, Pencil, Trash2, BookMarked, CheckCircle2,
  Globe, Building2, GraduationCap, FileSpreadsheet, Upload,
  ChevronRight, ChevronLeft, Loader2, XCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type CourseType = 'umum' | 'fakultas' | 'prodi';
type ImportStep = 1 | 2;

interface CourseImportRow {
  code: string;
  name: string;
  sks: number | null;
  semester: number | null;
  description: string;
  valid: boolean;
  error?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COURSE_TYPES: { value: CourseType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'umum',     label: 'Umum',        icon: <Globe size={14} />,         desc: 'Tidak terikat prodi/fakultas' },
  { value: 'fakultas', label: 'Per Fakultas', icon: <Building2 size={14} />,    desc: 'Berlaku untuk satu fakultas' },
  { value: 'prodi',    label: 'Per Prodi',    icon: <GraduationCap size={14} />, desc: 'Berlaku untuk program studi' },
];

const SELECT_CLS = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';
const LABEL_CLS = 'block text-sm font-medium text-gray-700 mb-1.5';

// ─── Component ────────────────────────────────────────────────────────────────

export default function CoursePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [options, setOptions] = useState({ page: 1, itemsPerPage: 10, sortBy: 'createdAt' as keyof Course, sortDesc: true });

  // ─── Form (create/edit) ───────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [courseType, setCourseType] = useState<CourseType>('umum');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedStudyProgramId, setSelectedStudyProgramId] = useState('');
  const [form, setForm] = useState({ curriculumId: '', facultyId: '', code: '', name: '', description: '', sks: 3, semester: 1 });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ─── Import state ─────────────────────────────────────────────────────────
  const [importOpen, setImportOpen]       = useState(false);
  const [importStep, setImportStep]       = useState<ImportStep>(1);
  const [importType, setImportType]       = useState<CourseType>('umum');
  const [importFacultyId, setImportFacultyId]       = useState('');
  const [importStudyProgramId, setImportStudyProgramId] = useState('');
  const [importCurriculumId, setImportCurriculumId] = useState('');
  const [importRows, setImportRows]       = useState<CourseImportRow[]>([]);
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null);
  const [importResult, setImportResult]   = useState<{ success: number; failed: string[] } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // ─── Queries ─────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['courses', options.page, options.itemsPerPage, debouncedSearch],
    queryFn: () => courseService.getAll({ page: options.page, limit: options.itemsPerPage, search: debouncedSearch || undefined }),
  });

  const { data: activeData } = useQuery({
    queryKey: ['courses', 'active-count'],
    queryFn: () => courseService.getAll({ isActive: true, limit: 1 }),
  });

  const anyDrawer = drawerOpen || importOpen;

  const { data: faculties } = useQuery({
    queryKey: ['faculties', 'all'],
    queryFn: () => facultyService.getAll({ page: 1, limit: 100 }),
    enabled: anyDrawer,
  });

  const activeFacultyId = drawerOpen ? selectedFacultyId : importFacultyId;
  const activeType      = drawerOpen ? courseType : importType;

  const { data: studyPrograms } = useQuery({
    queryKey: ['study-programs', 'by-faculty', activeFacultyId],
    queryFn: () => studyProgramService.getAll({ page: 1, limit: 100, facultyId: activeFacultyId }),
    enabled: anyDrawer && activeType === 'prodi' && !!activeFacultyId,
  });

  const { data: curriculaUniv } = useQuery({
    queryKey: ['curriculums', 'univ'],
    queryFn: () => curriculumService.getAll({ limit: 100, scope: 'universitas' }),
    enabled: anyDrawer,
  });

  const { data: curriculaFak } = useQuery({
    queryKey: ['curriculums', 'fak', activeFacultyId],
    queryFn: () => curriculumService.getAll({ limit: 100, scope: 'fakultas', facultyId: activeFacultyId }),
    enabled: anyDrawer && (activeType === 'fakultas' || activeType === 'prodi') && !!activeFacultyId,
  });

  const { data: curriculaProdi } = useQuery({
    queryKey: ['curriculums', 'prodi', drawerOpen ? selectedStudyProgramId : importStudyProgramId],
    queryFn: () => curriculumService.getAll({ limit: 100, studyProgramId: drawerOpen ? selectedStudyProgramId : importStudyProgramId }),
    enabled: anyDrawer && activeType === 'prodi' && !!(drawerOpen ? selectedStudyProgramId : importStudyProgramId),
  });

  // ─── Mutations ────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: courseService.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); setDrawerOpen(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof courseService.update>[1] }) =>
      courseService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); setDrawerOpen(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: courseService.remove,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); setConfirmOpen(false); },
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const resetForm = () => {
    setForm({ curriculumId: '', facultyId: '', code: '', name: '', description: '', sks: 3, semester: 1 });
    setCourseType('umum');
    setSelectedFacultyId('');
    setSelectedStudyProgramId('');
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setDrawerOpen(true); };

  const openEdit = (item: Course) => {
    let type: CourseType;
    if (item.curriculum?.studyProgramId) type = 'prodi';
    else if (item.facultyId || item.curriculum?.facultyId) type = 'fakultas';
    else type = 'umum';
    setCourseType(type);
    setSelectedFacultyId(item.facultyId ?? item.curriculum?.facultyId ?? item.studyProgram?.facultyId ?? '');
    setSelectedStudyProgramId(item.studyProgram?.id ?? '');
    setForm({
      curriculumId: item.curriculumId ?? '',
      facultyId: item.facultyId ?? '',
      code: item.code, name: item.name,
      description: item.description || '',
      sks: item.sks, semester: item.semester,
    });
    setEditingId(item.id);
    setDrawerOpen(true);
  };

  const handleTypeChange = (t: CourseType) => {
    setCourseType(t);
    setSelectedFacultyId('');
    setSelectedStudyProgramId('');
    setForm((f) => ({ ...f, facultyId: '', curriculumId: '' }));
  };

  const handleFacultyChange = (id: string) => {
    setSelectedFacultyId(id);
    setSelectedStudyProgramId('');
    setForm((f) => ({ ...f, facultyId: courseType === 'fakultas' ? id : '', curriculumId: '' }));
  };

  const handleStudyProgramChange = (id: string) => {
    setSelectedStudyProgramId(id);
    setForm((f) => ({ ...f, curriculumId: '' }));
  };

  const handleSubmit = () => {
    const payload = {
      code: form.code, name: form.name,
      description: form.description || undefined,
      sks: form.sks, semester: form.semester,
      curriculumId: form.curriculumId || undefined,
      facultyId: courseType === 'fakultas' ? selectedFacultyId || undefined : undefined,
    };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  const toggleStatus = (item: Course) => {
    updateMutation.mutate({ id: item.id, data: { isActive: !item.isActive } });
  };

  // ─── Import Helpers ───────────────────────────────────────────────────────

  const resetImport = () => {
    setImportStep(1);
    setImportType('umum');
    setImportFacultyId('');
    setImportStudyProgramId('');
    setImportCurriculumId('');
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
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        const parsed: CourseImportRow[] = rows
          .map((row) => ({
            code:        String(row[0] ?? '').trim(),
            name:        String(row[1] ?? '').trim(),
            sks:         parseInt(String(row[2] ?? ''), 10) || null,
            semester:    parseInt(String(row[3] ?? ''), 10) || null,
            description: String(row[4] ?? '').trim(),
            valid:       false,
          }))
          .filter((r) => r.code && r.code.toLowerCase() !== 'kode' && r.code.toLowerCase() !== 'code')
          .map((r) => {
            if (!r.code) return { ...r, valid: false, error: 'Kode wajib diisi' };
            if (!r.name) return { ...r, valid: false, error: 'Nama wajib diisi' };
            if (!r.sks || r.sks < 1 || r.sks > 12) return { ...r, valid: false, error: 'SKS tidak valid (1–12)' };
            if (!r.semester || r.semester < 1 || r.semester > 14) return { ...r, valid: false, error: 'Semester tidak valid (1–14)' };
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
        await courseService.create({
          code:         row.code,
          name:         row.name,
          sks:          row.sks!,
          semester:     row.semester!,
          description:  row.description || undefined,
          curriculumId: importCurriculumId || undefined,
          facultyId:    importType === 'fakultas' ? importFacultyId || undefined : undefined,
        });
      } catch {
        failed.push(row.code);
      }
      setImportProgress({ done: i + 1, total: valid.length });
    }

    setImportResult({ success: valid.length - failed.length, failed });
    queryClient.invalidateQueries({ queryKey: ['courses'] });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const validImportCount = importRows.filter((r) => r.valid).length;

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

      {/* Header dengan 2 tombol */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mata Kuliah</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola data mata kuliah</p>
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
            Tambah Mata Kuliah
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Total Mata Kuliah" value={data?.meta.total} icon={<BookMarked size={22} />} iconBg="bg-blue-100 text-blue-600" sub="Seluruh mata kuliah terdaftar" />
        <StatCard title="Mata Kuliah Aktif" value={activeData?.meta.total} icon={<CheckCircle2 size={22} />} iconBg="bg-green-100 text-green-600" sub="Mata kuliah dengan status aktif" />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <Input placeholder="Cari mata kuliah..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <DataTable<Course>
        headers={[
          { key: 'code', title: 'Kode', sortable: true, render: (item) => <CodeChip code={item.code} /> },
          { key: 'name', title: 'Nama', sortable: true },
          { key: 'sks', title: 'SKS', sortable: true },
          { key: 'semester', title: 'Semester', sortable: true },
          {
            key: 'curriculum', title: 'Lingkup',
            render: (item) => {
              if (item.curriculumId) return <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">{item.studyProgram?.name ?? item.curriculum?.name ?? '-'}</span>;
              if (item.facultyId) return <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{item.faculty?.name ?? '-'}</span>;
              return <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Umum</span>;
            },
          },
          { key: 'isActive', title: 'Status', render: (item) => <StatusBadge active={item.isActive} /> },
          {
            key: 'id', title: 'Aksi',
            render: (item) => (
              <div className="flex items-center gap-2">
                <Switch checked={item.isActive} onCheckedChange={() => toggleStatus(item)} size="sm" />
                <button onClick={() => openEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil size={16} /></button>
                <button onClick={() => { setDeleteId(item.id); setConfirmOpen(true); }} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
              </div>
            ),
          },
        ]}
        items={data?.data ?? []}
        totalItems={data?.meta.total ?? 0}
        loading={isLoading}
        options={options}
        onOptionsChange={(opts: DataTableOptions<Course>) =>
          setOptions({ page: opts.page, itemsPerPage: opts.itemsPerPage, sortBy: (opts.sortBy ?? 'createdAt') as keyof Course, sortDesc: opts.sortDesc ?? true })
        }
      />

      {/* ─── Create / Edit Drawer ─────────────────────────────────────────── */}
      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); resetForm(); }}
        title={editingId ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah'}
        description={editingId ? 'Ubah informasi mata kuliah' : 'Isi data untuk menambahkan mata kuliah baru'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setDrawerOpen(false); resetForm(); }}>Batal</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>{isSaving ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <label className={LABEL_CLS}>Jenis Mata Kuliah</label>
            <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50 gap-1">
              {COURSE_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => handleTypeChange(t.value)}
                  className={`flex-1 flex flex-col items-center gap-0.5 rounded-md py-2 px-1 text-xs font-medium transition-all border ${
                    courseType === t.value ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}>
                  <span className={courseType === t.value ? 'text-blue-600' : ''}>{t.icon}</span>
                  <span>{t.label}</span>
                  <span className={`text-[10px] font-normal leading-tight text-center ${courseType === t.value ? 'text-blue-500' : 'text-gray-400'}`}>{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {(courseType === 'fakultas' || courseType === 'prodi') && (
            <div>
              <label className={LABEL_CLS}>Fakultas</label>
              <select className={SELECT_CLS} value={selectedFacultyId} onChange={(e) => handleFacultyChange(e.target.value)}>
                <option value="">Pilih Fakultas</option>
                {faculties?.data.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          )}

          {courseType === 'prodi' && selectedFacultyId && (
            <div>
              <label className={LABEL_CLS}>Program Studi</label>
              <select className={SELECT_CLS} value={selectedStudyProgramId} onChange={(e) => handleStudyProgramChange(e.target.value)}>
                <option value="">Pilih Program Studi</option>
                {studyPrograms?.data.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          {courseType === 'umum' && (
            <div>
              <label className={LABEL_CLS}>Kurikulum Universitas <span className="text-gray-400 font-normal">(opsional)</span></label>
              <select className={SELECT_CLS} value={form.curriculumId} onChange={(e) => setForm({ ...form, curriculumId: e.target.value })}>
                <option value="">Tidak terikat kurikulum</option>
                {curriculaUniv?.data?.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
              </select>
            </div>
          )}

          {courseType === 'fakultas' && selectedFacultyId && (
            <div>
              <label className={LABEL_CLS}>Kurikulum <span className="text-gray-400 font-normal">(opsional)</span></label>
              <select className={SELECT_CLS} value={form.curriculumId} onChange={(e) => setForm({ ...form, curriculumId: e.target.value })}>
                <option value="">Tidak terikat kurikulum</option>
                {curriculaUniv?.data && curriculaUniv.data.length > 0 && (
                  <optgroup label="Kurikulum Universitas">
                    {curriculaUniv.data.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
                  </optgroup>
                )}
                {curriculaFak?.data && curriculaFak.data.length > 0 && (
                  <optgroup label="Kurikulum Fakultas">
                    {curriculaFak.data.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
                  </optgroup>
                )}
              </select>
            </div>
          )}

          {courseType === 'prodi' && selectedStudyProgramId && (
            <div>
              <label className={LABEL_CLS}>Kurikulum</label>
              <select className={SELECT_CLS} value={form.curriculumId} onChange={(e) => setForm({ ...form, curriculumId: e.target.value })}>
                <option value="">Pilih Kurikulum</option>
                {curriculaUniv?.data && curriculaUniv.data.length > 0 && (
                  <optgroup label="Kurikulum Universitas">
                    {curriculaUniv.data.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
                  </optgroup>
                )}
                {curriculaFak?.data && curriculaFak.data.length > 0 && (
                  <optgroup label="Kurikulum Fakultas">
                    {curriculaFak.data.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
                  </optgroup>
                )}
                {curriculaProdi?.data && curriculaProdi.data.length > 0 && (
                  <optgroup label="Kurikulum Program Studi">
                    {curriculaProdi.data.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
                  </optgroup>
                )}
              </select>
            </div>
          )}

          <div className="border-t border-gray-100 pt-1" />

          <Input label="Kode" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Contoh: MPK-101" />
          <Input label="Nama Mata Kuliah" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Pendidikan Agama" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="SKS" type="number" value={form.sks} onChange={(e) => setForm({ ...form, sks: Number(e.target.value) })} />
            <Input label="Semester" type="number" value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
            <textarea rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              placeholder="Deskripsi mata kuliah (opsional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
      </Drawer>

      {/* ─── Import Excel Drawer ──────────────────────────────────────────── */}
      <Drawer
        open={importOpen}
        onClose={() => { setImportOpen(false); resetImport(); }}
        title="Import Mata Kuliah via Excel"
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
              <Button
                onClick={runImport}
                disabled={validImportCount === 0}
              >
                <Upload size={14} className="mr-1" />
                Import {validImportCount} Mata Kuliah
              </Button>
            </div>
          )
        }
      >
        <div className="space-y-4 p-1">

          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs mb-2">
            {(['1. Scope & Kurikulum', '2. Upload & Preview'] as const).map((label, idx) => {
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

          {/* Step 1: Scope */}
          {importStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLS}>Jenis Mata Kuliah yang Diimport</label>
                <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50 gap-1">
                  {COURSE_TYPES.map((t) => (
                    <button key={t.value} type="button"
                      onClick={() => { setImportType(t.value); setImportFacultyId(''); setImportStudyProgramId(''); setImportCurriculumId(''); }}
                      className={`flex-1 flex flex-col items-center gap-0.5 rounded-md py-2 px-1 text-xs font-medium transition-all border ${
                        importType === t.value ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-transparent text-gray-400 hover:text-gray-600'
                      }`}>
                      <span className={importType === t.value ? 'text-blue-600' : ''}>{t.icon}</span>
                      <span>{t.label}</span>
                      <span className={`text-[10px] font-normal leading-tight text-center ${importType === t.value ? 'text-blue-500' : 'text-gray-400'}`}>{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {(importType === 'fakultas' || importType === 'prodi') && (
                <div>
                  <label className={LABEL_CLS}>Fakultas</label>
                  <select className={SELECT_CLS} value={importFacultyId}
                    onChange={(e) => { setImportFacultyId(e.target.value); setImportStudyProgramId(''); setImportCurriculumId(''); }}>
                    <option value="">Pilih Fakultas</option>
                    {faculties?.data.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              )}

              {importType === 'prodi' && importFacultyId && (
                <div>
                  <label className={LABEL_CLS}>Program Studi</label>
                  <select className={SELECT_CLS} value={importStudyProgramId}
                    onChange={(e) => { setImportStudyProgramId(e.target.value); setImportCurriculumId(''); }}>
                    <option value="">Pilih Program Studi</option>
                    {studyPrograms?.data.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              {/* Kurikulum */}
              {importType === 'umum' && (
                <div>
                  <label className={LABEL_CLS}>Kurikulum <span className="text-gray-400 font-normal">(opsional)</span></label>
                  <select className={SELECT_CLS} value={importCurriculumId} onChange={(e) => setImportCurriculumId(e.target.value)}>
                    <option value="">Tidak terikat kurikulum</option>
                    {curriculaUniv?.data?.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
                  </select>
                </div>
              )}

              {importType === 'fakultas' && importFacultyId && (
                <div>
                  <label className={LABEL_CLS}>Kurikulum <span className="text-gray-400 font-normal">(opsional)</span></label>
                  <select className={SELECT_CLS} value={importCurriculumId} onChange={(e) => setImportCurriculumId(e.target.value)}>
                    <option value="">Tidak terikat kurikulum</option>
                    {curriculaUniv?.data && curriculaUniv.data.length > 0 && (
                      <optgroup label="Kurikulum Universitas">
                        {curriculaUniv.data.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
                      </optgroup>
                    )}
                    {curriculaFak?.data && curriculaFak.data.length > 0 && (
                      <optgroup label="Kurikulum Fakultas">
                        {curriculaFak.data.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
                      </optgroup>
                    )}
                  </select>
                </div>
              )}

              {importType === 'prodi' && importStudyProgramId && (
                <div>
                  <label className={LABEL_CLS}>Kurikulum <span className="text-gray-400 font-normal">(opsional)</span></label>
                  <select className={SELECT_CLS} value={importCurriculumId} onChange={(e) => setImportCurriculumId(e.target.value)}>
                    <option value="">Tidak terikat kurikulum</option>
                    {curriculaUniv?.data && curriculaUniv.data.length > 0 && (
                      <optgroup label="Kurikulum Universitas">
                        {curriculaUniv.data.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
                      </optgroup>
                    )}
                    {curriculaFak?.data && curriculaFak.data.length > 0 && (
                      <optgroup label="Kurikulum Fakultas">
                        {curriculaFak.data.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
                      </optgroup>
                    )}
                    {curriculaProdi?.data && curriculaProdi.data.length > 0 && (
                      <optgroup label="Kurikulum Program Studi">
                        {curriculaProdi.data.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
                      </optgroup>
                    )}
                  </select>
                </div>
              )}

              {/* Ringkasan scope */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-700 space-y-0.5">
                <p className="font-semibold text-blue-800">Semua mata kuliah dalam Excel akan diimport sebagai:</p>
                <p>• Jenis: <span className="font-medium">{COURSE_TYPES.find((t) => t.value === importType)?.label}</span></p>
                {importFacultyId && <p>• Fakultas: <span className="font-medium">{faculties?.data.find((f) => f.id === importFacultyId)?.name ?? '—'}</span></p>}
                {importStudyProgramId && <p>• Prodi: <span className="font-medium">{studyPrograms?.data.find((s) => s.id === importStudyProgramId)?.name ?? '—'}</span></p>}
                {importCurriculumId && <p>• Kurikulum: <span className="font-medium">{
                  [...(curriculaUniv?.data ?? []), ...(curriculaFak?.data ?? []), ...(curriculaProdi?.data ?? [])].find((c) => c.id === importCurriculumId)?.name ?? '—'
                }</span></p>}
              </div>
            </div>
          )}

          {/* Step 2: Upload & Preview */}
          {importStep === 2 && !importProgress && !importResult && (
            <div className="space-y-4">
              {/* Format info */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-2">Format kolom Excel:</p>
                <div className="overflow-x-auto">
                  <table className="text-[11px] w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        {['A: Kode*', 'B: Nama MK*', 'C: SKS*', 'D: Semester*', 'E: Deskripsi'].map((h) => (
                          <th key={h} className="px-2 py-1 text-left border border-gray-300 font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white">
                        <td className="px-2 py-1 border border-gray-200 font-mono">IF101</td>
                        <td className="px-2 py-1 border border-gray-200">Algoritma dan Pemrograman</td>
                        <td className="px-2 py-1 border border-gray-200">3</td>
                        <td className="px-2 py-1 border border-gray-200">1</td>
                        <td className="px-2 py-1 border border-gray-200 text-gray-400">opsional</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">* Kolom wajib diisi. Baris pertama boleh header atau langsung data.</p>
              </div>

              {/* Upload */}
              <input ref={importFileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportXlsx} />
              <button type="button" onClick={() => importFileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-primary hover:text-primary transition-colors">
                <FileSpreadsheet size={16} />
                {importRows.length > 0 ? 'Ganti File Excel' : 'Pilih File Excel (.xlsx / .xls)'}
              </button>

              {/* Preview */}
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
                            <th className="px-2 py-2 text-center font-semibold text-gray-600 w-10">SKS</th>
                            <th className="px-2 py-2 text-center font-semibold text-gray-600 w-16">Semester</th>
                            <th className="px-2 py-2 text-center font-semibold text-gray-600 w-10">OK</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importRows.map((row, i) => (
                            <tr key={i} className={`border-b border-gray-50 ${!row.valid ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                              <td className="px-2 py-1.5 font-mono text-gray-700">{row.code}</td>
                              <td className="px-2 py-1.5 text-gray-700 max-w-[160px] truncate">{row.name || <span className="text-gray-300 italic">—</span>}</td>
                              <td className="px-2 py-1.5 text-center text-gray-600">{row.sks ?? '—'}</td>
                              <td className="px-2 py-1.5 text-center text-gray-600">{row.semester ?? '—'}</td>
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
                  <span>Mengimport mata kuliah...</span>
                  <span>{importProgress.done} / {importProgress.total}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(importProgress.done / importProgress.total) * 100}%` }} />
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
                  {importResult.success} mata kuliah berhasil ditambahkan.
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

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Hapus Mata Kuliah"
        description="Apakah Anda yakin ingin menghapus mata kuliah ini? Tindakan ini tidak dapat dibatalkan."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
