import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Input, Button, Modal, Switch } from '@widyatama/ui';
import type { DataTableOptions } from '@widyatama/ui';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { curriculumService } from '@/services/curriculum.service';
import { studyProgramService } from '@/services/studyProgram.service';
import type { Curriculum } from '@/types';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';

export default function CurriculumPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [options, setOptions] = useState({ page: 1, itemsPerPage: 10, sortBy: 'createdAt' as keyof Curriculum, sortDesc: true });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ studyProgramId: '', code: '', name: '', description: '', year: new Date().getFullYear(), totalSemester: 8, totalSks: 144 });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['curriculums', options.page, options.itemsPerPage, debouncedSearch],
    queryFn: () => curriculumService.getAll({ page: options.page, limit: options.itemsPerPage, search: debouncedSearch || undefined }),
  });

  const { data: studyPrograms } = useQuery({
    queryKey: ['study-programs-all'],
    queryFn: () => studyProgramService.getAll({ page: 1, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: curriculumService.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['curriculums'] }); setModalOpen(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof curriculumService.update>[1] }) => curriculumService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['curriculums'] }); setModalOpen(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: curriculumService.remove,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['curriculums'] }); setConfirmOpen(false); },
  });

  const resetForm = () => {
    setForm({ studyProgramId: '', code: '', name: '', description: '', year: new Date().getFullYear(), totalSemester: 8, totalSks: 144 });
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setModalOpen(true); };
  const openEdit = (item: Curriculum) => {
    setForm({ studyProgramId: item.studyProgramId, code: item.code, name: item.name, description: item.description || '', year: item.year, totalSemester: item.totalSemester, totalSks: item.totalSks });
    setEditingId(item.id);
    setModalOpen(true);
  };
  const openDelete = (id: string) => { setDeleteId(id); setConfirmOpen(true); };

  const handleSubmit = () => {
    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(form);
  };

  const toggleStatus = (item: Curriculum) => {
    updateMutation.mutate({ id: item.id, data: { isActive: !item.isActive } });
  };

  return (
    <div>
      <PageHeader title="Kurikulum" description="Kelola data kurikulum" action={{ label: 'Tambah Kurikulum', onClick: openCreate, icon: <Plus size={16} /> }} />
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input placeholder="Cari kurikulum..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>
      <DataTable<Curriculum>
        headers={[
          { key: 'code', title: 'Kode', sortable: true },
          { key: 'name', title: 'Nama', sortable: true },
          { key: 'year', title: 'Tahun', sortable: true },
          { key: 'totalSemester', title: 'Semester', sortable: true },
          { key: 'totalSks', title: 'Total SKS', sortable: true },
          { key: 'studyProgram', title: 'Program Studi', render: (item) => item.studyProgram?.name || '-' },
          { key: 'isActive', title: 'Status', render: (item) => <StatusBadge active={item.isActive} /> },
          { key: 'id', title: 'Aksi', render: (item) => (
            <div className="flex items-center gap-2">
              <Switch checked={item.isActive} onCheckedChange={() => toggleStatus(item)} size="sm" />
              <button onClick={() => openEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil size={16} /></button>
              <button onClick={() => openDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
            </div>
          )},
        ]}
        items={data?.data ?? []} totalItems={data?.meta.total ?? 0} loading={isLoading} options={options}
        onOptionsChange={(opts: DataTableOptions<Curriculum>) =>
          setOptions({
            page: opts.page,
            itemsPerPage: opts.itemsPerPage,
            sortBy: (opts.sortBy ?? 'createdAt') as keyof Curriculum,
            sortDesc: opts.sortDesc ?? true,
          })
        }
      />
      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editingId ? 'Edit Kurikulum' : 'Tambah Kurikulum'}>
        <div className="space-y-4 py-2">
          <select className="w-full px-3 py-2 border rounded-md text-sm" value={form.studyProgramId} onChange={(e) => setForm({ ...form, studyProgramId: e.target.value })}>
            <option value="">Pilih Program Studi</option>
            {studyPrograms?.data.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <Input label="Kode" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Input label="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Tahun" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Total Semester" type="number" value={form.totalSemester} onChange={(e) => setForm({ ...form, totalSemester: Number(e.target.value) })} />
            <Input label="Total SKS" type="number" value={form.totalSks} onChange={(e) => setForm({ ...form, totalSks: Number(e.target.value) })} />
          </div>
          <Input label="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>Simpan</Button>
        </div>
      </Modal>
      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} title="Hapus Kurikulum" description="Apakah Anda yakin ingin menghapus kurikulum ini?" loading={deleteMutation.isPending} />
    </div>
  );
}
