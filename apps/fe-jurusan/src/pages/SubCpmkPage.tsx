import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { DataTable, Button, Modal, Input, Combobox } from '@widyatama/ui';
import type { Header, DataTableOptions } from '@widyatama/ui';
import { subCpmkService, cpmkService, courseService } from '@/services/obe.service';
import { QUERY_KEYS } from '@/constants';
import { subCpmkSchema, type SubCpmkFormData } from '@/schemas/obe.schema';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import type { SubCpmk } from '@/types';

export default function SubCpmkPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [cpmkFilter, setCpmkFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<SubCpmk | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tableOptions, setTableOptions] = useState<DataTableOptions<SubCpmk>>({
    page: 1, itemsPerPage: 10, sortBy: 'code' as keyof SubCpmk, sortDesc: false,
  });

  // Fetch Sub CPMK list
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.subCpmk({ page: tableOptions.page, limit: tableOptions.itemsPerPage, search, cpmkId: cpmkFilter || undefined, sortBy: String(tableOptions.sortBy), sortOrder: tableOptions.sortDesc ? 'desc' : 'asc' }),
    queryFn: () => subCpmkService.getAll({ page: tableOptions.page, limit: tableOptions.itemsPerPage, search, cpmkId: cpmkFilter || undefined, sortBy: String(tableOptions.sortBy), sortOrder: tableOptions.sortDesc ? 'desc' : 'asc' }),
  });

  // Fetch CPMK for filter/form
  const { data: cpmkData } = useQuery({
    queryKey: QUERY_KEYS.cpmk({ limit: 100 }),
    queryFn: () => cpmkService.getAll({ limit: 100 }),
  });

  // Fetch courses for form
  const { data: coursesData } = useQuery({
    queryKey: QUERY_KEYS.courses({ limit: 100 }),
    queryFn: () => courseService.getAll({ limit: 100 }),
  });

  const cpmkOptions = (cpmkData?.data ?? []).map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }));
  const courseOptions = (coursesData?.data ?? []).map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }));

  // Create/Update
  const saveMutation = useMutation({
    mutationFn: (formData: SubCpmkFormData) => editItem ? subCpmkService.update(editItem.id, formData) : subCpmkService.create(formData),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subCpmk() }); closeModal(); },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => subCpmkService.remove(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subCpmk() }); setDeleteId(null); },
  });

  // Form
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<SubCpmkFormData>({
    resolver: zodResolver(subCpmkSchema),
    defaultValues: { code: '', name: '', description: '', orderNumber: 1, targetPercentage: 50, cpmkId: '', courseId: '', isActive: true },
  });

  const cpmkIdValue = watch('cpmkId');
  const courseIdValue = watch('courseId');

  const openCreate = () => {
    setEditItem(null);
    reset({ code: '', name: '', description: '', orderNumber: 1, targetPercentage: 50, cpmkId: '', courseId: '', isActive: true });
    setModalOpen(true);
  };

  const openEdit = (item: SubCpmk) => {
    setEditItem(item);
    reset({
      code: item.code, name: item.name, description: item.description || '',
      orderNumber: item.orderNumber, targetPercentage: item.targetPercentage,
      cpmkId: item.cpmk?.id || '', courseId: item.course?.id || '', isActive: item.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditItem(null); };
  const onSubmit = (formData: SubCpmkFormData) => saveMutation.mutate(formData);

  const headers: Header<SubCpmk>[] = [
    { key: 'code', title: 'Kode', sortable: true },
    { key: 'name', title: 'Nama', sortable: true },
    { key: 'cpmk', title: 'CPMK', sortable: false, render: (row) => <span className="text-gray-600">{row.cpmk?.name || '-'}</span> },
    { key: 'targetPercentage', title: 'Target %', sortable: true, render: (row) => (
      <div className="flex items-center gap-2">
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(row.targetPercentage, 100)}%` }} />
        </div>
        <span className="text-sm text-gray-600">{row.targetPercentage}%</span>
      </div>
    )},
    { key: 'isActive', title: 'Status', sortable: true, render: (row) => <StatusBadge active={row.isActive} /> },
    {
      key: 'id' as keyof SubCpmk, title: 'Aksi',
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
        title="Sub CPMK"
        description="Kelola sub-kompetensi dari Capaian Pembelajaran Mata Kuliah"
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Sub CPMK' }]}
        action={{ label: 'Tambah Sub CPMK', onClick: openCreate, icon: <Plus size={16} /> }}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Cari Sub CPMK..." value={search}
            onChange={(e) => { setSearch(e.target.value); setTableOptions((prev) => ({ ...prev, page: 1 })); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="w-64">
          <Combobox
            placeholder="Filter CPMK..."
            value={cpmkFilter}
            onChange={(val) => { setCpmkFilter(val); setTableOptions((prev) => ({ ...prev, page: 1 })); }}
            options={[{ value: '', label: 'Semua CPMK' }, ...cpmkOptions]}
          />
        </div>
      </div>

      {/* Table */}
      {data?.data?.length === 0 && !search && !cpmkFilter ? (
        <EmptyState
          title="Belum ada Sub CPMK"
          description="Mulai tambahkan Sub CPMK untuk setiap CPMK."
          action={<Button variant="primary" iconLeft={<Plus size={16} />} onClick={openCreate}>Tambah Sub CPMK</Button>}
        />
      ) : (
        <DataTable<SubCpmk> headers={headers} items={data?.data ?? []} totalItems={data?.meta?.total ?? 0} loading={isLoading} options={tableOptions} onOptionsChange={setTableOptions} />
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onOpenChange={(open) => { if (!open) closeModal(); }} title={editItem ? 'Edit Sub CPMK' : 'Tambah Sub CPMK'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Kode Sub CPMK" placeholder="SCPMK-01" error={!!errors.code} {...register('code')} />
          {errors.code && <p className="text-xs text-danger mt-1">{errors.code.message}</p>}

          <Input label="Nama Sub CPMK" placeholder="Mampu mengidentifikasi..." error={!!errors.name} {...register('name')} />
          {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}

          <Input label="Deskripsi" placeholder="Deskripsi (opsional)" error={!!errors.description} {...register('description')} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label="Nomor Urutan" type="number" placeholder="1" error={!!errors.orderNumber} {...register('orderNumber')} />
              {errors.orderNumber && <p className="text-xs text-danger mt-1">{errors.orderNumber.message}</p>}
            </div>
            <div>
              <Input label="Target (%)" type="number" placeholder="50" error={!!errors.targetPercentage} {...register('targetPercentage')} />
              {errors.targetPercentage && <p className="text-xs text-danger mt-1">{errors.targetPercentage.message}</p>}
            </div>
          </div>

          <Combobox label="CPMK" placeholder="Pilih CPMK..." value={cpmkIdValue} onChange={(val) => setValue('cpmkId', val, { shouldValidate: true })} options={cpmkOptions} />
          {errors.cpmkId && <p className="text-xs text-danger mt-1">{errors.cpmkId.message}</p>}

          <Combobox label="Mata Kuliah" placeholder="Pilih mata kuliah..." value={courseIdValue} onChange={(val) => setValue('courseId', val, { shouldValidate: true })} options={courseOptions} />
          {errors.courseId && <p className="text-xs text-danger mt-1">{errors.courseId.message}</p>}

          <div className="flex items-center gap-2">
            <input type="checkbox" id="subCpmkActive" {...register('isActive')} className="rounded border-gray-300" />
            <label htmlFor="subCpmkActive" className="text-sm text-gray-700">Aktif</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={closeModal} type="button">Batal</Button>
            <Button variant="primary" type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Menyimpan...' : editItem ? 'Simpan Perubahan' : 'Tambah Sub CPMK'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Hapus Sub CPMK" description="Apakah Anda yakin ingin menghapus Sub CPMK ini? Tindakan ini tidak dapat dibatalkan."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
