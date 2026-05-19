import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@widyatama/ui';
import { Input } from '@widyatama/ui';
import { Button } from '@widyatama/ui';
import { Modal } from '@widyatama/ui';
import { Switch } from '@widyatama/ui';
import type { DataTableOptions } from '@widyatama/ui';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { facultyService } from '@/services/faculty.service';
import type { Faculty } from '@/types';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';

export default function FacultyPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [options, setOptions] = useState({ page: 1, itemsPerPage: 10, sortBy: 'createdAt' as keyof Faculty, sortDesc: true });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', name: '', description: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['faculties', options.page, options.itemsPerPage, debouncedSearch, options.sortBy, options.sortDesc],
    queryFn: () => facultyService.getAll({
      page: options.page,
      limit: options.itemsPerPage,
      search: debouncedSearch || undefined,
      sortBy: String(options.sortBy),
      sortOrder: options.sortDesc ? 'desc' : 'asc',
    }),
  });

  const createMutation = useMutation({
    mutationFn: facultyService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
      setModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof facultyService.update>[1] }) => facultyService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
      setModalOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: facultyService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
      setConfirmOpen(false);
    },
  });

  const resetForm = () => {
    setForm({ code: '', name: '', description: '' });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (item: Faculty) => {
    setForm({ code: item.code, name: item.name, description: item.description || '' });
    setEditingId(item.id);
    setModalOpen(true);
  };

  const openDelete = (id: string) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const toggleStatus = (item: Faculty) => {
    updateMutation.mutate({ id: item.id, data: { isActive: !item.isActive } });
  };

  return (
    <div>
      <PageHeader
        title="Fakultas"
        description="Kelola data fakultas"
        action={{ label: 'Tambah Fakultas', onClick: openCreate, icon: <Plus size={16} /> }}
      />

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Cari fakultas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable<Faculty>
        headers={[
          { key: 'code', title: 'Kode', sortable: true },
          { key: 'name', title: 'Nama Fakultas', sortable: true },
          {
            key: 'isActive',
            title: 'Status',
            render: (item) => <StatusBadge active={item.isActive} />,
          },
          {
            key: 'createdAt',
            title: 'Dibuat',
            sortable: true,
            render: (item) => new Date(item.createdAt).toLocaleDateString('id-ID'),
          },
          {
            key: 'id',
            title: 'Aksi',
            render: (item) => (
              <div className="flex items-center gap-2">
                <Switch checked={item.isActive} onCheckedChange={() => toggleStatus(item)} size="sm" />
                <button onClick={() => openEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                  <Pencil size={16} />
                </button>
                <button onClick={() => openDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            ),
          },
        ]}
        items={data?.data ?? []}
        totalItems={data?.meta.total ?? 0}
        loading={isLoading}
        options={options}
        onOptionsChange={(opts: DataTableOptions<Faculty>) =>
          setOptions({
            page: opts.page,
            itemsPerPage: opts.itemsPerPage,
            sortBy: (opts.sortBy ?? 'createdAt') as keyof Faculty,
            sortDesc: opts.sortDesc ?? true,
          })
        }
      />

      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editingId ? 'Edit Fakultas' : 'Tambah Fakultas'}>
        <div className="space-y-4 py-2">
          <Input label="Kode" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Contoh: FT" />
          <Input label="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Fakultas Teknik" />
          <Input label="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi fakultas" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Hapus Fakultas"
        description="Apakah Anda yakin ingin menghapus fakultas ini? Tindakan ini tidak dapat dibatalkan."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
