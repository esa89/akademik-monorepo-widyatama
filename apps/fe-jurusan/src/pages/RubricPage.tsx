import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { DataTable, Button, Modal, Input, Combobox } from '@widyatama/ui';
import type { Header, DataTableOptions } from '@widyatama/ui';
import { rubricService, assessmentService, subCpmkService, cpmkService } from '@/services/obe.service';
import { QUERY_KEYS } from '@/constants';
import { rubricSchema, type RubricFormData } from '@/schemas/obe.schema';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import type { Rubric } from '@/types';

export default function RubricPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [assessmentFilter, setAssessmentFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Rubric | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tableOptions, setTableOptions] = useState<DataTableOptions<Rubric>>({
    page: 1, itemsPerPage: 10, sortBy: 'code' as keyof Rubric, sortDesc: false,
  });

  // Fetch Rubrics
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.rubric({ page: tableOptions.page, limit: tableOptions.itemsPerPage, search, assessmentId: assessmentFilter || undefined, sortBy: String(tableOptions.sortBy), sortOrder: tableOptions.sortDesc ? 'desc' : 'asc' }),
    queryFn: () => rubricService.getAll({ page: tableOptions.page, limit: tableOptions.itemsPerPage, search, assessmentId: assessmentFilter || undefined, sortBy: String(tableOptions.sortBy), sortOrder: tableOptions.sortDesc ? 'desc' : 'asc' }),
  });

  // Fetch Assessments for filter/form
  const { data: assessmentData } = useQuery({
    queryKey: QUERY_KEYS.assessment({ limit: 100 }),
    queryFn: () => assessmentService.getAll({ limit: 100 }),
  });

  // Fetch Sub CPMK for form
  const { data: subCpmkData } = useQuery({
    queryKey: QUERY_KEYS.subCpmk({ limit: 100 }),
    queryFn: () => subCpmkService.getAll({ limit: 100 }),
  });

  // Fetch CPMK for form
  const { data: cpmkData } = useQuery({
    queryKey: QUERY_KEYS.cpmk({ limit: 100 }),
    queryFn: () => cpmkService.getAll({ limit: 100 }),
  });

  const assessmentOptions = (assessmentData?.data ?? []).map((a) => ({ value: a.id, label: `${a.code} - ${a.name}` }));
  const subCpmkOptions = (subCpmkData?.data ?? []).map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }));
  const cpmkOptions = (cpmkData?.data ?? []).map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }));

  // Create/Update
  const saveMutation = useMutation({
    mutationFn: (formData: RubricFormData) => editItem ? rubricService.update(editItem.id, formData) : rubricService.create(formData),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rubric() }); closeModal(); },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => rubricService.remove(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rubric() }); setDeleteId(null); },
  });

  // Form
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<RubricFormData>({
    resolver: zodResolver(rubricSchema),
    defaultValues: {
      code: '', name: '', description: '', weight: 10, maxScore: 100, orderNumber: 1,
      assessmentId: '', subCpmkId: '', cpmkId: '', isActive: true,
    },
  });

  const assessmentIdValue = watch('assessmentId');
  const subCpmkIdValue = watch('subCpmkId');
  const cpmkIdValue = watch('cpmkId');

  const openCreate = () => {
    setEditItem(null);
    reset({
      code: '', name: '', description: '', weight: 10, maxScore: 100, orderNumber: 1,
      assessmentId: '', subCpmkId: '', cpmkId: '', isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (item: Rubric) => {
    setEditItem(item);
    reset({
      code: item.code, name: item.name, description: item.description || '',
      weight: item.weight, maxScore: item.maxScore, orderNumber: item.orderNumber,
      assessmentId: item.assessment?.id || '', subCpmkId: item.subCpmk?.id || '', cpmkId: item.cpmk?.id || '',
      isActive: item.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditItem(null); };
  const onSubmit = (formData: RubricFormData) => saveMutation.mutate(formData);

  const headers: Header<Rubric>[] = [
    { key: 'code', title: 'Kode', sortable: true },
    { key: 'name', title: 'Nama', sortable: true },
    { key: 'weight', title: 'Bobot', sortable: true, render: (row) => <span className="text-gray-600">{row.weight}%</span> },
    { key: 'maxScore', title: 'Skor Maks', sortable: true, render: (row) => <span className="text-gray-600">{row.maxScore}</span> },
    { key: 'assessment', title: 'Assessment', sortable: false, render: (row) => <span className="text-gray-600 text-sm">{row.assessment?.name || '-'}</span> },
    { key: 'isActive', title: 'Status', sortable: true, render: (row) => <StatusBadge active={row.isActive} /> },
    {
      key: 'id' as keyof Rubric, title: 'Aksi',
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
        title="Rubrik"
        description="Kelola rubrik penilaian untuk setiap Assessment"
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Rubrik' }]}
        action={{ label: 'Tambah Rubrik', onClick: openCreate, icon: <Plus size={16} /> }}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Cari Rubrik..." value={search}
            onChange={(e) => { setSearch(e.target.value); setTableOptions((prev) => ({ ...prev, page: 1 })); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="w-64">
          <Combobox
            placeholder="Filter Assessment..."
            value={assessmentFilter}
            onChange={(val) => { setAssessmentFilter(val); setTableOptions((prev) => ({ ...prev, page: 1 })); }}
            options={[{ value: '', label: 'Semua Assessment' }, ...assessmentOptions]}
          />
        </div>
      </div>

      {/* Table */}
      {data?.data?.length === 0 && !search && !assessmentFilter ? (
        <EmptyState
          title="Belum ada Rubrik"
          description="Mulai tambahkan rubrik penilaian untuk Assessment."
          action={<Button variant="primary" iconLeft={<Plus size={16} />} onClick={openCreate}>Tambah Rubrik</Button>}
        />
      ) : (
        <DataTable<Rubric> headers={headers} items={data?.data ?? []} totalItems={data?.meta?.total ?? 0} loading={isLoading} options={tableOptions} onOptionsChange={setTableOptions} />
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onOpenChange={(open) => { if (!open) closeModal(); }} title={editItem ? 'Edit Rubrik' : 'Tambah Rubrik'} className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label="Kode Rubrik" placeholder="RUB-01" error={!!errors.code} {...register('code')} />
              {errors.code && <p className="text-xs text-danger mt-1">{errors.code.message}</p>}
            </div>
            <div>
              <Input label="Urutan" type="number" placeholder="1" error={!!errors.orderNumber} {...register('orderNumber')} />
              {errors.orderNumber && <p className="text-xs text-danger mt-1">{errors.orderNumber.message}</p>}
            </div>
          </div>

          <Input label="Nama Rubrik" placeholder="Rubrik Penilaian..." error={!!errors.name} {...register('name')} />
          {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}

          <Input label="Deskripsi" placeholder="Deskripsi rubrik (opsional)" error={!!errors.description} {...register('description')} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label="Bobot (%)" type="number" placeholder="10" error={!!errors.weight} {...register('weight')} />
              {errors.weight && <p className="text-xs text-danger mt-1">{errors.weight.message}</p>}
            </div>
            <div>
              <Input label="Skor Maks" type="number" placeholder="100" error={!!errors.maxScore} {...register('maxScore')} />
              {errors.maxScore && <p className="text-xs text-danger mt-1">{errors.maxScore.message}</p>}
            </div>
          </div>

          <Combobox label="Assessment" placeholder="Pilih Assessment..." value={assessmentIdValue} onChange={(val) => setValue('assessmentId', val, { shouldValidate: true })} options={assessmentOptions} />
          {errors.assessmentId && <p className="text-xs text-danger mt-1">{errors.assessmentId.message}</p>}

          <div className="grid grid-cols-2 gap-4">
            <Combobox label="Sub CPMK" placeholder="Pilih..." value={subCpmkIdValue} onChange={(val) => setValue('subCpmkId', val, { shouldValidate: true })} options={subCpmkOptions} />
            <Combobox label="CPMK" placeholder="Pilih..." value={cpmkIdValue} onChange={(val) => setValue('cpmkId', val, { shouldValidate: true })} options={cpmkOptions} />
          </div>
          {(errors.subCpmkId || errors.cpmkId) && (
            <p className="text-xs text-danger">{errors.subCpmkId?.message || errors.cpmkId?.message}</p>
          )}

          <div className="flex items-center gap-2">
            <input type="checkbox" id="rubricActive" {...register('isActive')} className="rounded border-gray-300" />
            <label htmlFor="rubricActive" className="text-sm text-gray-700">Aktif</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={closeModal} type="button">Batal</Button>
            <Button variant="primary" type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Menyimpan...' : editItem ? 'Simpan Perubahan' : 'Tambah Rubrik'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Hapus Rubrik" description="Apakah Anda yakin ingin menghapus Rubrik ini? Tindakan ini tidak dapat dibatalkan."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
