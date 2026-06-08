import { useState } from 'react';
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
import { Plus, Search, Pencil, Trash2, BookMarked, CheckCircle2, Globe, Building2, GraduationCap } from 'lucide-react';

type CourseType = 'umum' | 'fakultas' | 'prodi';

const COURSE_TYPES: { value: CourseType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'umum',     label: 'Umum',        icon: <Globe size={14} />,         desc: 'Tidak terikat prodi/fakultas' },
  { value: 'fakultas', label: 'Per Fakultas', icon: <Building2 size={14} />,    desc: 'Berlaku untuk satu fakultas' },
  { value: 'prodi',    label: 'Per Prodi',    icon: <GraduationCap size={14} />, desc: 'Berlaku untuk program studi' },
];

const SELECT_CLS = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';
const LABEL_CLS = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function CoursePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [options, setOptions] = useState({ page: 1, itemsPerPage: 10, sortBy: 'createdAt' as keyof Course, sortDesc: true });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [courseType, setCourseType] = useState<CourseType>('umum');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedStudyProgramId, setSelectedStudyProgramId] = useState('');
  const [form, setForm] = useState({ curriculumId: '', facultyId: '', code: '', name: '', description: '', sks: 3, semester: 1 });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['courses', options.page, options.itemsPerPage, debouncedSearch],
    queryFn: () => courseService.getAll({ page: options.page, limit: options.itemsPerPage, search: debouncedSearch || undefined }),
  });

  const { data: activeData } = useQuery({
    queryKey: ['courses', 'active-count'],
    queryFn: () => courseService.getAll({ isActive: true, limit: 1 }),
  });

  const { data: faculties } = useQuery({
    queryKey: ['faculties', 'all'],
    queryFn: () => facultyService.getAll({ page: 1, limit: 100 }),
    enabled: drawerOpen,
  });

  const { data: studyPrograms } = useQuery({
    queryKey: ['study-programs', 'by-faculty', selectedFacultyId],
    queryFn: () => studyProgramService.getAll({ page: 1, limit: 100, facultyId: selectedFacultyId }),
    enabled: drawerOpen && courseType === 'prodi' && !!selectedFacultyId,
  });

  // Kurikulum level Universitas — untuk tipe 'umum', 'fakultas', dan 'prodi'
  const { data: curriculaUniv } = useQuery({
    queryKey: ['curriculums', 'univ'],
    queryFn: () => curriculumService.getAll({ limit: 100, scope: 'universitas' }),
    enabled: drawerOpen,
  });

  // Kurikulum level Fakultas — untuk tipe 'fakultas' dan 'prodi' setelah pilih fakultas
  const { data: curriculaFak } = useQuery({
    queryKey: ['curriculums', 'fak', selectedFacultyId],
    queryFn: () => curriculumService.getAll({ limit: 100, scope: 'fakultas', facultyId: selectedFacultyId }),
    enabled: drawerOpen && (courseType === 'fakultas' || courseType === 'prodi') && !!selectedFacultyId,
  });

  // Kurikulum level Prodi — hanya untuk tipe 'prodi' setelah pilih prodi
  const { data: curriculaProdi } = useQuery({
    queryKey: ['curriculums', 'prodi', selectedStudyProgramId],
    queryFn: () => curriculumService.getAll({ limit: 100, studyProgramId: selectedStudyProgramId }),
    enabled: drawerOpen && courseType === 'prodi' && !!selectedStudyProgramId,
  });

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
    if (item.curriculum?.studyProgramId) {
      type = 'prodi';
    } else if (item.facultyId || item.curriculum?.facultyId) {
      type = 'fakultas';
    } else {
      type = 'umum';
    }
    setCourseType(type);
    setSelectedFacultyId(item.facultyId ?? item.curriculum?.facultyId ?? item.studyProgram?.facultyId ?? '');
    setSelectedStudyProgramId(item.studyProgram?.id ?? '');
    setForm({
      curriculumId: item.curriculumId ?? '',
      facultyId: item.facultyId ?? '',
      code: item.code,
      name: item.name,
      description: item.description || '',
      sks: item.sks,
      semester: item.semester,
    });
    setEditingId(item.id);
    setDrawerOpen(true);
  };

  const openDelete = (id: string) => { setDeleteId(id); setConfirmOpen(true); };

  const handleTypeChange = (t: CourseType) => {
    setCourseType(t);
    setSelectedFacultyId('');
    setSelectedStudyProgramId('');
    setForm((f) => ({ ...f, facultyId: '', curriculumId: '' }));
    // also clear when going to 'umum' since curriculum dropdown resets
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
      code: form.code,
      name: form.name,
      description: form.description || undefined,
      sks: form.sks,
      semester: form.semester,
      curriculumId: form.curriculumId || undefined,
      facultyId: courseType === 'fakultas' ? selectedFacultyId || undefined : undefined,
    };
    if (editingId) updateMutation.mutate({ id: editingId, data: payload });
    else createMutation.mutate(payload);
  };

  const toggleStatus = (item: Course) => {
    updateMutation.mutate({ id: item.id, data: { isActive: !item.isActive } });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mata Kuliah"
        description="Kelola data mata kuliah"
        action={{ label: 'Tambah Mata Kuliah', onClick: openCreate, icon: <Plus size={16} /> }}
      />

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
                <button onClick={() => openDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
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
          {/* Course type selector */}
          <div>
            <label className={LABEL_CLS}>Jenis Mata Kuliah</label>
            <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50 gap-1">
              {COURSE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleTypeChange(t.value)}
                  className={`flex-1 flex flex-col items-center gap-0.5 rounded-md py-2 px-1 text-xs font-medium transition-all border ${
                    courseType === t.value
                      ? 'bg-blue-50 border-blue-400 text-blue-700'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <span className={courseType === t.value ? 'text-blue-600' : ''}>{t.icon}</span>
                  <span>{t.label}</span>
                  <span className={`text-[10px] font-normal leading-tight text-center ${courseType === t.value ? 'text-blue-500' : 'text-gray-400'}`}>{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fakultas — untuk tipe 'fakultas' dan 'prodi' */}
          {(courseType === 'fakultas' || courseType === 'prodi') && (
            <div>
              <label className={LABEL_CLS}>Fakultas</label>
              <select className={SELECT_CLS} value={selectedFacultyId} onChange={(e) => handleFacultyChange(e.target.value)}>
                <option value="">Pilih Fakultas</option>
                {faculties?.data.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          )}

          {/* Program Studi — hanya untuk 'prodi' setelah pilih fakultas */}
          {courseType === 'prodi' && selectedFacultyId && (
            <div>
              <label className={LABEL_CLS}>Program Studi</label>
              <select className={SELECT_CLS} value={selectedStudyProgramId} onChange={(e) => handleStudyProgramChange(e.target.value)}>
                <option value="">Pilih Program Studi</option>
                {studyPrograms?.data.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          {/* Kurikulum — umum: kurikulum universitas saja */}
          {courseType === 'umum' && (
            <div>
              <label className={LABEL_CLS}>Kurikulum Universitas <span className="text-gray-400 font-normal">(opsional)</span></label>
              <select className={SELECT_CLS} value={form.curriculumId} onChange={(e) => setForm({ ...form, curriculumId: e.target.value })}>
                <option value="">Tidak terikat kurikulum</option>
                {curriculaUniv?.data?.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
              </select>
            </div>
          )}

          {/* Kurikulum — fakultas: universitas + fakultas */}
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

          {/* Kurikulum — prodi: universitas + fakultas + prodi, muncul setelah pilih prodi */}
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
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              placeholder="Deskripsi mata kuliah (opsional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
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
