import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { DataTable, Button, Modal, Input, Combobox } from '@widyatama/ui';
import type { Header, DataTableOptions } from '@widyatama/ui';
import { cplService } from '@/services/obe.service';
import { QUERY_KEYS, CPL_CATEGORY_LABELS } from '@/constants';
import { cplSchema, type CplFormData } from '@/schemas/obe.schema';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import type { Cpl, CplCategory } from '@/types';

const categoryOptions = Object.entries(CPL_CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

export default function CplPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Cpl | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tableOptions, setTableOptions] = useState<DataTableOptions<Cpl>>({
    page: 1,
    itemsPerPage: 10,
    sortBy: 'code' as keyof Cpl,
    sortDesc: false,
  });

  // Fetch CPL list
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.cpl({ page: tableOptions.page, limit: tableOptions.itemsPerPage, search, sortBy: String(tableOptions.sortBy), sortDesc: tableOptions.sortDesc }),
    queryFn: () => cplService.getAll({ page: tableOptions.page, limit: tableOptions.itemsPerPage, search, sortBy: String(tableOptions.sortBy), sortOrder: tableOptions.sortDesc ? 'desc' : 'asc' }),
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (formData: CplFormData) => {
      return editItem ? cplService.update(editItem.id, formData) : cplService.create(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cpl() });
      closeModal();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => cplService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cpl() });
      setDeleteId(null);
    },
  });

  // Form
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<CplFormData>({
    resolver: zodResolver(cplSchema),
    defaultValues: { code: '', name: '', category: 'SIKAP' as CplCategory, description: '', curriculumYear: new Date().getFullYear(), isActive: true },
  });

  const openCreate = () => {
    setEditItem(null);
    reset({ code: '', name: '', category: 'SIKAP' as CplCategory, description: '', curriculumYear: new Date().getFullYear(), isActive: true });
    setModalOpen(true);
  };

  const openEdit = (item: Cpl) => {
    setEditItem(item);
    reset({ code: item.code, name: item.name, category: item.category, description: item.description || '', curriculumYear: item.curriculumYear, isActive: item.isActive });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditItem(null); };

  const onSubmit = (formData: CplFormData) => saveMutation.mutate(formData);

  const categoryValue = watch('category');

  const headers: Header<Cpl>[] = [
    { key: 'code', title: 'Kode', sortable: true },
    { key: 'name', title: 'Nama', sortable: true },
    {
      key: 'category', title: 'Kategori', sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {CPL_CATEGORY_LABELS[row.category] || row.category}
        </span>
      ),
    },
    {
      key: 'curriculumYear', title: 'Tahun Kurikulum', sortable: true,
      render: (row) => <span className="text-gray-600">{row.curriculumYear}</span>,
    },
    {
      key: 'isActive', title: 'Status', sortable: true,
      render: (row) => <StatusBadge active={row.isActive} />,
    },
    {
      key: 'id' as keyof Cpl, title: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" iconLeft={<Pencil size={14} />} onClick={() => openEdit(row)} />
          <Button variant="ghost" size="sm" iconLeft={<Trash2 size={14} className="text-danger" />} onClick={() => setDeleteId(row.id)} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Capaian Pembelajaran Lulusan (CPL)"
        description="Kelola capaian pembelajaran lulusan program studi"
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'CPL' }]}
        action={{ label: 'Tambah CPL', onClick: openCreate, icon: <Plus size={16} /> }}
      />

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari CPL..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setTableOptions((prev) => ({ ...prev, page: 1 })); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Table */}
      {data?.data?.length === 0 && !search ? (
        <EmptyState
          title="Belum ada CPL"
          description="Mulai tambahkan Capaian Pembelajaran Lulusan untuk program studi Anda."
          action={<Button variant="primary" iconLeft={<Plus size={16} />} onClick={openCreate}>Tambah CPL</Button>}
        />
      ) : (
        <DataTable<Cpl>
          headers={headers}
          items={data?.data ?? []}
          totalItems={data?.meta?.total ?? 0}
          loading={isLoading}
          options={tableOptions}
          onOptionsChange={setTableOptions}
        />
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onOpenChange={(open) => { if (!open) closeModal(); }} title={editItem ? 'Edit CPL' : 'Tambah CPL'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Kode CPL" placeholder="CPL-01" error={!!errors.code} {...register('code')} />
          {errors.code && <p className="text-xs text-danger mt-1">{errors.code.message}</p>}

          <Input label="Nama CPL" placeholder="Mampu menerapkan..." error={!!errors.name} {...register('name')} />
          {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}

          <Combobox
            label="Kategori"
            placeholder="Pilih kategori..."
            value={categoryValue}
            onChange={(val) => setValue('category', val as CplCategory, { shouldValidate: true })}
            options={categoryOptions}
          />
          {errors.category && <p className="text-xs text-danger mt-1">{errors.category.message}</p>}

          <Input label="Deskripsi" placeholder="Deskripsi CPL (opsional)" error={!!errors.description} {...register('description')} />
          {errors.description && <p className="text-xs text-danger mt-1">{errors.description.message}</p>}

          <Input label="Tahun Kurikulum" type="number" placeholder="2024" error={!!errors.curriculumYear} {...register('curriculumYear')} />
          {errors.curriculumYear && <p className="text-xs text-danger mt-1">{errors.curriculumYear.message}</p>}

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" {...register('isActive')} className="rounded border-gray-300" />
            <label htmlFor="isActive" className="text-sm text-gray-700">Aktif</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={closeModal} type="button">Batal</Button>
            <Button variant="primary" type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Menyimpan...' : editItem ? 'Simpan Perubahan' : 'Tambah CPL'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Hapus CPL"
        description="Apakah Anda yakin ingin menghapus CPL ini? Tindakan ini tidak dapat dibatalkan."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
