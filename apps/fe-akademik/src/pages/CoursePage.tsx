import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Input, Button, Modal, Switch } from '@widyatama/ui';
import type { DataTableOptions } from '@widyatama/ui';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { courseService } from '@/services/course.service';
import { curriculumService } from '@/services/curriculum.service';
import type { Course } from '@/types';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';

export default function CoursePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [options, setOptions] = useState({ page: 1, itemsPerPage: 10, sortBy: 'createdAt' as keyof Course, sortDesc: true });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ curriculumId: '', code: '', name: '', description: '', sks: 3, semester: 1 });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['courses', options.page, options.itemsPerPage, debouncedSearch],
    queryFn: () => courseService.getAll({ page: options.page, limit: options.itemsPerPage, search: debouncedSearch || undefined }),
  });

  const { data: curriculums } = useQuery({
    queryKey: ['curriculums-all'],
    queryFn: () => curriculumService.getAll({ page: 1, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: courseService.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); setModalOpen(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof courseService.update>[1] }) => courseService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); setModalOpen(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: courseService.remove,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); setConfirmOpen(false); },
  });

  const resetForm = () => {
    setForm({ curriculumId: '', code: '', name: '', description: '', sks: 3, semester: 1 });
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setModalOpen(true); };
  const openEdit = (item: Course) => {
    setForm({ curriculumId: item.curriculumId, code: item.code, name: item.name, description: item.description || '', sks: item.sks, semester: item.semester });
    setEditingId(item.id);
    setModalOpen(true);
  };
  const openDelete = (id: string) => { setDeleteId(id); setConfirmOpen(true); };

  const handleSubmit = () => {
    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(form);
  };

  const toggleStatus = (item: Course) => {
    updateMutation.mutate({ id: item.id, data: { isActive: !item.isActive } });
  };

  return (
    <div>
      <PageHeader title="Mata Kuliah" description="Kelola data mata kuliah" action={{ label: 'Tambah Mata Kuliah', onClick: openCreate, icon: <Plus size={16} /> }} />
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input placeholder="Cari mata kuliah..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>
      <DataTable<Course>
        headers={[
          { key: 'code', title: 'Kode', sortable: true },
          { key: 'name', title: 'Nama', sortable: true },
          { key: 'sks', title: 'SKS', sortable: true },
          { key: 'semester', title: 'Semester', sortable: true },
          { key: 'curriculum', title: 'Kurikulum', render: (item) => item.curriculum?.name || '-' },
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
        onOptionsChange={(opts: DataTableOptions<Course>) =>
          setOptions({
            page: opts.page,
            itemsPerPage: opts.itemsPerPage,
            sortBy: (opts.sortBy ?? 'createdAt') as keyof Course,
            sortDesc: opts.sortDesc ?? true,
          })
        }
      />
      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editingId ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah'}>
        <div className="space-y-4 py-2">
          <select className="w-full px-3 py-2 border rounded-md text-sm" value={form.curriculumId} onChange={(e) => setForm({ ...form, curriculumId: e.target.value })}>
            <option value="">Pilih Kurikulum</option>
            {curriculums?.data.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Input label="Kode" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Input label="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="SKS" type="number" value={form.sks} onChange={(e) => setForm({ ...form, sks: Number(e.target.value) })} />
            <Input label="Semester" type="number" value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })} />
          </div>
          <Input label="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>Simpan</Button>
        </div>
      </Modal>
      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} title="Hapus Mata Kuliah" description="Apakah Anda yakin ingin menghapus mata kuliah ini?" loading={deleteMutation.isPending} />
    </div>
  );
}
