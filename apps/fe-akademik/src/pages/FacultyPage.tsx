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
import { facultyService } from '@/services/faculty.service';
import type { Faculty } from '@/types';
import { Plus, Search, Pencil, Trash2, Building2, CheckCircle2 } from 'lucide-react';

export default function FacultyPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [options, setOptions] = useState({ page: 1, itemsPerPage: 10, sortBy: 'createdAt' as keyof Faculty, sortDesc: true });
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  const { data: activeData } = useQuery({
    queryKey: ['faculties', 'active-count'],
    queryFn: () => facultyService.getAll({ isActive: true, limit: 1 }),
  });

  const createMutation = useMutation({
    mutationFn: facultyService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
      setDrawerOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof facultyService.update>[1] }) =>
      facultyService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
      setDrawerOpen(false);
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
    setDrawerOpen(true);
  };

  const openEdit = (item: Faculty) => {
    setForm({ code: item.code, name: item.name, description: item.description || '' });
    setEditingId(item.id);
    setDrawerOpen(true);
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

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fakultas"
        description="Kelola data fakultas"
        action={{ label: 'Tambah Fakultas', onClick: openCreate, icon: <Plus size={16} /> }}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Fakultas"
          value={data?.meta.total}
          icon={<Building2 size={22} />}
          iconBg="bg-blue-100 text-blue-600"
          sub="Seluruh fakultas terdaftar"
        />
        <StatCard
          title="Fakultas Aktif"
          value={activeData?.meta.total}
          icon={<CheckCircle2 size={22} />}
          iconBg="bg-green-100 text-green-600"
          sub="Fakultas dengan status aktif"
        />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <Input
          placeholder="Cari fakultas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <DataTable<Faculty>
        headers={[
          { key: 'code', title: 'Kode', sortable: true, render: (item) => <CodeChip code={item.code} /> },
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

      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); resetForm(); }}
        title={editingId ? 'Edit Fakultas' : 'Tambah Fakultas'}
        description={editingId ? 'Ubah informasi fakultas' : 'Isi data untuk menambahkan fakultas baru'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setDrawerOpen(false); resetForm(); }}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Kode"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="Contoh: FT"
          />
          <Input
            label="Nama Fakultas"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Contoh: Fakultas Teknik"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              placeholder="Deskripsi fakultas (opsional)"
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
        title="Hapus Fakultas"
        description="Apakah Anda yakin ingin menghapus fakultas ini? Tindakan ini tidak dapat dibatalkan."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
