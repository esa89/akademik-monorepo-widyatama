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
import { curriculumService } from '@/services/curriculum.service';
import { studyProgramService } from '@/services/studyProgram.service';
import { facultyService } from '@/services/faculty.service';
import type { Curriculum } from '@/types';
import { Plus, Search, Pencil, Trash2, BookOpen, CheckCircle2, Globe, Building2, GraduationCap } from 'lucide-react';

type CurriculumScope = 'universitas' | 'fakultas' | 'prodi';

const SCOPE_TYPES: { value: CurriculumScope; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'universitas', label: 'Universitas', icon: <Globe size={14} />, desc: 'Berlaku seluruh universitas' },
  { value: 'fakultas', label: 'Fakultas', icon: <Building2 size={14} />, desc: 'Berlaku satu fakultas' },
  { value: 'prodi', label: 'Program Studi', icon: <GraduationCap size={14} />, desc: 'Berlaku satu prodi' },
];

const SELECT_CLS = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';
const LABEL_CLS = 'block text-sm font-medium text-gray-700 mb-1.5';

const SCOPE_BADGE: Record<CurriculumScope, string> = {
  universitas: 'text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full',
  fakultas: 'text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full',
  prodi: 'text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full',
};

const SCOPE_LABEL: Record<CurriculumScope, string> = {
  universitas: 'Universitas',
  fakultas: 'Fakultas',
  prodi: 'Prodi',
};

export default function CurriculumPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [options, setOptions] = useState({ page: 1, itemsPerPage: 10, sortBy: 'createdAt' as keyof Curriculum, sortDesc: true });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [curriculumScope, setCurriculumScope] = useState<CurriculumScope>('prodi');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [form, setForm] = useState({
    studyProgramId: '',
    facultyId: '',
    code: '', name: '', description: '',
    year: new Date().getFullYear(),
    totalSemester: 8, totalSks: 144,
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['curriculums', options.page, options.itemsPerPage, debouncedSearch],
    queryFn: () => curriculumService.getAll({ page: options.page, limit: options.itemsPerPage, search: debouncedSearch || undefined }),
  });

  const { data: activeData } = useQuery({
    queryKey: ['curriculums', 'active-count'],
    queryFn: () => curriculumService.getAll({ isActive: true, limit: 1 }),
  });

  const { data: faculties } = useQuery({
    queryKey: ['faculties', 'all'],
    queryFn: () => facultyService.getAll({ page: 1, limit: 100 }),
    enabled: drawerOpen && (curriculumScope === 'fakultas' || curriculumScope === 'prodi'),
  });

  const { data: studyPrograms } = useQuery({
    queryKey: ['study-programs', 'by-faculty', selectedFacultyId],
    queryFn: () => studyProgramService.getAll({ page: 1, limit: 100, facultyId: selectedFacultyId }),
    enabled: drawerOpen && curriculumScope === 'prodi' && !!selectedFacultyId,
  });

  const createMutation = useMutation({
    mutationFn: curriculumService.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['curriculums'] }); setDrawerOpen(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof curriculumService.update>[1] }) =>
      curriculumService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['curriculums'] }); setDrawerOpen(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: curriculumService.remove,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['curriculums'] }); setConfirmOpen(false); },
  });

  const resetForm = () => {
    setForm({ studyProgramId: '', facultyId: '', code: '', name: '', description: '', year: new Date().getFullYear(), totalSemester: 8, totalSks: 144 });
    setCurriculumScope('prodi');
    setSelectedFacultyId('');
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setDrawerOpen(true); };

  const openEdit = (item: Curriculum) => {
    setCurriculumScope(item.scope);
    setSelectedFacultyId(item.studyProgram?.facultyId ?? item.facultyId ?? '');
    setForm({
      studyProgramId: item.studyProgramId ?? '',
      facultyId: item.facultyId ?? '',
      code: item.code,
      name: item.name,
      description: item.description || '',
      year: item.year,
      totalSemester: item.totalSemester,
      totalSks: item.totalSks,
    });
    setEditingId(item.id);
    setDrawerOpen(true);
  };

  const openDelete = (id: string) => { setDeleteId(id); setConfirmOpen(true); };

  const handleScopeChange = (scope: CurriculumScope) => {
    setCurriculumScope(scope);
    setSelectedFacultyId('');
    setForm((f) => ({ ...f, studyProgramId: '', facultyId: '' }));
  };

  const handleFacultyChange = (id: string) => {
    setSelectedFacultyId(id);
    setForm((f) => ({
      ...f,
      facultyId: curriculumScope === 'fakultas' ? id : '',
      studyProgramId: '',
    }));
  };

  const handleSubmit = () => {
    const payload = {
      code: form.code,
      name: form.name,
      description: form.description || undefined,
      year: form.year,
      totalSemester: form.totalSemester,
      totalSks: form.totalSks,
      studyProgramId: curriculumScope === 'prodi' && form.studyProgramId !== 'all' ? form.studyProgramId || undefined : undefined,
      facultyId: curriculumScope === 'fakultas' ? form.facultyId || undefined : undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
      return;
    }

    if (curriculumScope === 'prodi' && form.studyProgramId === 'all') {
      const programs = studyPrograms?.data ?? [];
      setIsBulkSaving(true);
      Promise.all(
        programs.map((sp) => curriculumService.create({ ...payload, studyProgramId: sp.id }))
      ).then(() => {
        queryClient.invalidateQueries({ queryKey: ['curriculums'] });
        setDrawerOpen(false);
        resetForm();
      }).finally(() => setIsBulkSaving(false));
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleStatus = (item: Curriculum) => {
    updateMutation.mutate({ id: item.id, data: { isActive: !item.isActive } });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending || isBulkSaving;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kurikulum"
        description="Kelola data kurikulum"
        action={{ label: 'Tambah Kurikulum', onClick: openCreate, icon: <Plus size={16} /> }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Kurikulum"
          value={data?.meta.total}
          icon={<BookOpen size={22} />}
          iconBg="bg-blue-100 text-blue-600"
          sub="Seluruh kurikulum terdaftar"
        />
        <StatCard
          title="Kurikulum Aktif"
          value={activeData?.meta.total}
          icon={<CheckCircle2 size={22} />}
          iconBg="bg-green-100 text-green-600"
          sub="Kurikulum dengan status aktif"
        />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <Input placeholder="Cari kurikulum..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <DataTable<Curriculum>
        headers={[
          { key: 'code', title: 'Kode', sortable: true, render: (item) => <CodeChip code={item.code} /> },
          { key: 'name', title: 'Nama', sortable: true },
          { key: 'year', title: 'Tahun', sortable: true },
          { key: 'totalSks', title: 'Total SKS', sortable: true },
          {
            key: 'scope', title: 'Lingkup',
            render: (item) => (
              <div className="flex flex-col gap-0.5">
                <span className={SCOPE_BADGE[item.scope]}>{SCOPE_LABEL[item.scope]}</span>
                {item.scope === 'prodi' && item.studyProgram && (
                  <span className="text-xs text-gray-500">{item.studyProgram.name}</span>
                )}
                {item.scope === 'fakultas' && item.faculty && (
                  <span className="text-xs text-gray-500">{item.faculty.name}</span>
                )}
              </div>
            ),
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
        onOptionsChange={(opts: DataTableOptions<Curriculum>) =>
          setOptions({
            page: opts.page,
            itemsPerPage: opts.itemsPerPage,
            sortBy: (opts.sortBy ?? 'createdAt') as keyof Curriculum,
            sortDesc: opts.sortDesc ?? true,
          })
        }
      />

      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); resetForm(); }}
        title={editingId ? 'Edit Kurikulum' : 'Tambah Kurikulum'}
        description={editingId ? 'Ubah informasi kurikulum' : 'Isi data untuk menambahkan kurikulum baru'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setDrawerOpen(false); resetForm(); }}>Batal</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Scope selector */}
          <div>
            <label className={LABEL_CLS}>Lingkup Kurikulum</label>
            <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50 gap-1">
              {SCOPE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => !editingId && handleScopeChange(t.value)}
                  className={`flex-1 flex flex-col items-center gap-0.5 rounded-md py-2 px-1 text-xs font-medium transition-all border ${
                    curriculumScope === t.value
                      ? 'bg-blue-50 border-blue-400 text-blue-700'
                      : editingId
                      ? 'border-transparent text-gray-300 cursor-not-allowed'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <span className={curriculumScope === t.value ? 'text-blue-600' : ''}>{t.icon}</span>
                  <span>{t.label}</span>
                  <span className={`text-[10px] font-normal leading-tight text-center ${curriculumScope === t.value ? 'text-blue-500' : 'text-gray-400'}`}>{t.desc}</span>
                </button>
              ))}
            </div>
            {editingId && <p className="text-xs text-gray-400 mt-1">Lingkup tidak dapat diubah setelah dibuat</p>}
          </div>

          {/* Fakultas dropdown — for 'fakultas' and 'prodi' scope */}
          {(curriculumScope === 'fakultas' || curriculumScope === 'prodi') && (
            <div>
              <label className={LABEL_CLS}>Fakultas</label>
              <select className={SELECT_CLS} value={selectedFacultyId} onChange={(e) => handleFacultyChange(e.target.value)}>
                <option value="">Pilih Fakultas</option>
                {faculties?.data.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          )}

          {/* Program Studi — only for 'prodi' scope after faculty is selected */}
          {curriculumScope === 'prodi' && selectedFacultyId && (
            <div>
              <label className={LABEL_CLS}>Program Studi</label>
              <select
                className={SELECT_CLS}
                value={form.studyProgramId}
                onChange={(e) => setForm({ ...form, studyProgramId: e.target.value })}
              >
                <option value="">Pilih Program Studi</option>
                {!editingId && <option value="all">— Semua Program Studi dalam Fakultas —</option>}
                {studyPrograms?.data.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          <div className="border-t border-gray-100 pt-1" />

          <Input label="Kode" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Contoh: KRKL-IF-2024" />
          <Input label="Nama Kurikulum" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Kurikulum 2024" />
          <Input label="Tahun" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Total Semester" type="number" value={form.totalSemester} onChange={(e) => setForm({ ...form, totalSemester: Number(e.target.value) })} />
            <Input label="Total SKS" type="number" value={form.totalSks} onChange={(e) => setForm({ ...form, totalSks: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              placeholder="Deskripsi kurikulum (opsional)"
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
        title="Hapus Kurikulum"
        description="Apakah Anda yakin ingin menghapus kurikulum ini? Tindakan ini tidak dapat dibatalkan."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
