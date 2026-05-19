import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Input, Button, Modal, Switch } from '@widyatama/ui';
import type { DataTableOptions } from '@widyatama/ui';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { studyProgramService } from '@/services/studyProgram.service';
import { facultyService } from '@/services/faculty.service';
import type { StudyProgram } from '@/types';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';

export default function StudyProgramPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [options, setOptions] = useState({ page: 1, itemsPerPage: 10, sortBy: 'createdAt' as keyof StudyProgram, sortDesc: true });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ facultyId: '', code: '', name: '', description: '', degree: '', accreditation: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['study-programs', options.page, options.itemsPerPage, debouncedSearch],
    queryFn: () => studyProgramService.getAll({ page: options.page, limit: options.itemsPerPage, search: debouncedSearch || undefined }),
  });

  const { data: faculties } = useQuery({
    queryKey: ['faculties-all'],
    queryFn: () => facultyService.getAll({ page: 1, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: studyProgramService.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['study-programs'] }); setModalOpen(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof studyProgramService.update>[1] }) => studyProgramService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['study-programs'] }); setModalOpen(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: studyProgramService.remove,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['study-programs'] }); setConfirmOpen(false); },
  });

  const resetForm = () => {
    setForm({ facultyId: '', code: '', name: '', description: '', degree: '', accreditation: '' });
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setModalOpen(true); };
  const openEdit = (item: StudyProgram) => {
    setForm({ facultyId: item.facultyId, code: item.code, name: item.name, description: item.description || '', degree: item.degree, accreditation: item.accreditation || '' });
    setEditingId(item.id);
    setModalOpen(true);
  };
  const openDelete = (id: string) => { setDeleteId(id); setConfirmOpen(true); };

  const handleSubmit = () => {
    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(form);
  };

  const toggleStatus = (item: StudyProgram) => {
    updateMutation.mutate({ id: item.id, data: { isActive: !item.isActive } });
  };

  return (
    <div>
      <PageHeader title="Program Studi" description="Kelola data program studi" action={{ label: 'Tambah Program Studi', onClick: openCreate, icon: <Plus size={16} /> }} />
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input placeholder="Cari program studi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>
      <DataTable<StudyProgram>
        headers={[
          { key: 'code', title: 'Kode', sortable: true },
          { key: 'name', title: 'Nama', sortable: true },
          { key: 'faculty', title: 'Fakultas', render: (item) => item.faculty?.name || '-' },
          { key: 'degree', title: 'Jenjang', sortable: true },
          { key: 'accreditation', title: 'Akreditasi', sortable: true },
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
        onOptionsChange={(opts: DataTableOptions<StudyProgram>) =>
          setOptions({
            page: opts.page,
            itemsPerPage: opts.itemsPerPage,
            sortBy: (opts.sortBy ?? 'createdAt') as keyof StudyProgram,
            sortDesc: opts.sortDesc ?? true,
          })
        }
      />
      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editingId ? 'Edit Program Studi' : 'Tambah Program Studi'}>
        <div className="space-y-4 py-2">
          <select className="w-full px-3 py-2 border rounded-md text-sm" value={form.facultyId} onChange={(e) => setForm({ ...form, facultyId: e.target.value })}>
            <option value="">Pilih Fakultas</option>
            {faculties?.data.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <Input label="Kode" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Input label="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Jenjang" value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} placeholder="S1 / S2 / S3 / D3 / D4" />
          <Input label="Akreditasi" value={form.accreditation} onChange={(e) => setForm({ ...form, accreditation: e.target.value })} placeholder="A / B / C" />
          <Input label="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>Simpan</Button>
        </div>
      </Modal>
      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} title="Hapus Program Studi" description="Apakah Anda yakin ingin menghapus program studi ini?" loading={deleteMutation.isPending} />
    </div>
  );
}
