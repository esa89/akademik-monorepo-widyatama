import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { DataTable, Button, Modal, Input, Combobox } from '@widyatama/ui';
import type { Header, DataTableOptions } from '@widyatama/ui';
import { assessmentService, subCpmkService, cpmkService, courseService } from '@/services/obe.service';
import { QUERY_KEYS } from '@/constants';
import { assessmentSchema, type AssessmentFormData } from '@/schemas/obe.schema';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { AssessmentBadge } from '@/components/common/AssessmentBadge';
import type { Assessment } from '@/types';

const typeOptions = [
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'ASSIGNMENT', label: 'Tugas' },
  { value: 'PRACTICUM', label: 'Praktikum' },
  { value: 'PROJECT', label: 'Proyek' },
  { value: 'PRESENTATION', label: 'Presentasi' },
  { value: 'UTS', label: 'UTS' },
  { value: 'UAS', label: 'UAS' },
  { value: 'OTHER', label: 'Lainnya' },
];

export default function AssessmentPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [subCpmkFilter, setSubCpmkFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Assessment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tableOptions, setTableOptions] = useState<DataTableOptions<Assessment>>({
    page: 1, itemsPerPage: 10, sortBy: 'code' as keyof Assessment, sortDesc: false,
  });

  // Fetch Assessments
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.assessment({ page: tableOptions.page, limit: tableOptions.itemsPerPage, search, subCpmkId: subCpmkFilter || undefined, sortBy: String(tableOptions.sortBy), sortOrder: tableOptions.sortDesc ? 'desc' : 'asc' }),
    queryFn: () => assessmentService.getAll({ page: tableOptions.page, limit: tableOptions.itemsPerPage, search, subCpmkId: subCpmkFilter || undefined, sortBy: String(tableOptions.sortBy), sortOrder: tableOptions.sortDesc ? 'desc' : 'asc' }),
  });

  // Fetch Sub CPMK for filter/form
  const { data: subCpmkData } = useQuery({
    queryKey: QUERY_KEYS.subCpmk({ limit: 100 }),
    queryFn: () => subCpmkService.getAll({ limit: 100 }),
  });

  // Fetch CPMK for form
  const { data: cpmkData } = useQuery({
    queryKey: QUERY_KEYS.cpmk({ limit: 100 }),
    queryFn: () => cpmkService.getAll({ limit: 100 }),
  });

  // Fetch courses for form
  const { data: coursesData } = useQuery({
    queryKey: QUERY_KEYS.courses({ limit: 100 }),
    queryFn: () => courseService.getAll({ limit: 100 }),
  });

  const subCpmkOptions = (subCpmkData?.data ?? []).map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }));
  const cpmkOptions = (cpmkData?.data ?? []).map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }));
  const courseOptions = (coursesData?.data ?? []).map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }));

  // Create/Update
  const saveMutation = useMutation({
    mutationFn: (formData: AssessmentFormData) => editItem ? assessmentService.update(editItem.id, formData) : assessmentService.create(formData),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assessment() }); closeModal(); },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => assessmentService.remove(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.assessment() }); setDeleteId(null); },
  });

  // Form
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      code: '', name: '', description: '', type: 'QUIZ' as Assessment['type'],
      weight: 10, maxScore: 100, orderNumber: 1,
      subCpmkId: '', cpmkId: '', courseId: '', isActive: true,
    },
  });

  const typeValue = watch('type');
  const subCpmkIdValue = watch('subCpmkId');
  const cpmkIdValue = watch('cpmkId');
  const courseIdValue = watch('courseId');

  const openCreate = () => {
    setEditItem(null);
    reset({
      code: '', name: '', description: '', type: 'QUIZ' as Assessment['type'],
      weight: 10, maxScore: 100, orderNumber: 1,
      subCpmkId: '', cpmkId: '', courseId: '', isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (item: Assessment) => {
    setEditItem(item);
    reset({
      code: item.code, name: item.name, description: item.description || '',
      type: item.type, weight: item.weight, maxScore: item.maxScore, orderNumber: item.orderNumber,
      subCpmkId: item.subCpmk?.id || '', cpmkId: item.cpmk?.id || '', courseId: item.course?.id || '',
      isActive: item.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditItem(null); };
  const onSubmit = (formData: AssessmentFormData) => saveMutation.mutate(formData);

  const headers: Header<Assessment>[] = [
    { key: 'code', title: 'Kode', sortable: true },
    { key: 'name', title: 'Nama', sortable: true },
    { key: 'type', title: 'Tipe', sortable: true, render: (row) => <AssessmentBadge type={row.type} /> },
    { key: 'weight', title: 'Bobot', sortable: true, render: (row) => <span className="text-gray-600">{row.weight}%</span> },
    { key: 'subCpmk', title: 'Sub CPMK', sortable: false, render: (row) => <span className="text-gray-600 text-sm">{row.subCpmk?.name || '-'}</span> },
    { key: 'isActive', title: 'Status', sortable: true, render: (row) => <StatusBadge active={row.isActive} /> },
    {
      key: 'id' as keyof Assessment, title: 'Aksi',
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
        title="Assessment"
        description="Kelola penilaian berbasis OBE untuk setiap Sub CPMK"
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Assessment' }]}
        action={{ label: 'Tambah Assessment', onClick: openCreate, icon: <Plus size={16} /> }}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Cari Assessment..." value={search}
            onChange={(e) => { setSearch(e.target.value); setTableOptions((prev) => ({ ...prev, page: 1 })); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="w-64">
          <Combobox
            placeholder="Filter Sub CPMK..."
            value={subCpmkFilter}
            onChange={(val) => { setSubCpmkFilter(val); setTableOptions((prev) => ({ ...prev, page: 1 })); }}
            options={[{ value: '', label: 'Semua Sub CPMK' }, ...subCpmkOptions]}
          />
        </div>
      </div>

      {/* Table */}
      {data?.data?.length === 0 && !search && !subCpmkFilter ? (
        <EmptyState
          title="Belum ada Assessment"
          description="Mulai tambahkan penilaian OBE untuk Sub CPMK."
          action={<Button variant="primary" iconLeft={<Plus size={16} />} onClick={openCreate}>Tambah Assessment</Button>}
        />
      ) : (
        <DataTable<Assessment> headers={headers} items={data?.data ?? []} totalItems={data?.meta?.total ?? 0} loading={isLoading} options={tableOptions} onOptionsChange={setTableOptions} />
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onOpenChange={(open) => { if (!open) closeModal(); }} title={editItem ? 'Edit Assessment' : 'Tambah Assessment'} className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label="Kode Assessment" placeholder="ASMT-01" error={!!errors.code} {...register('code')} />
              {errors.code && <p className="text-xs text-danger mt-1">{errors.code.message}</p>}
            </div>
            <div>
              <Combobox label="Tipe Assessment" placeholder="Pilih tipe..." value={typeValue} onChange={(val) => setValue('type', val as Assessment['type'], { shouldValidate: true })} options={typeOptions} />
              {errors.type && <p className="text-xs text-danger mt-1">{errors.type.message}</p>}
            </div>
          </div>

          <Input label="Nama Assessment" placeholder="Quiz 1 - Struktur Data" error={!!errors.name} {...register('name')} />
          {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}

          <Input label="Deskripsi" placeholder="Deskripsi assessment (opsional)" error={!!errors.description} {...register('description')} />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Input label="Bobot (%)" type="number" placeholder="10" error={!!errors.weight} {...register('weight')} />
              {errors.weight && <p className="text-xs text-danger mt-1">{errors.weight.message}</p>}
            </div>
            <div>
              <Input label="Skor Maks" type="number" placeholder="100" error={!!errors.maxScore} {...register('maxScore')} />
              {errors.maxScore && <p className="text-xs text-danger mt-1">{errors.maxScore.message}</p>}
            </div>
            <div>
              <Input label="Urutan" type="number" placeholder="1" error={!!errors.orderNumber} {...register('orderNumber')} />
              {errors.orderNumber && <p className="text-xs text-danger mt-1">{errors.orderNumber.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Combobox label="Sub CPMK" placeholder="Pilih..." value={subCpmkIdValue} onChange={(val) => setValue('subCpmkId', val, { shouldValidate: true })} options={subCpmkOptions} />
            <Combobox label="CPMK" placeholder="Pilih..." value={cpmkIdValue} onChange={(val) => setValue('cpmkId', val, { shouldValidate: true })} options={cpmkOptions} />
            <Combobox label="Mata Kuliah" placeholder="Pilih..." value={courseIdValue} onChange={(val) => setValue('courseId', val, { shouldValidate: true })} options={courseOptions} />
          </div>
          {(errors.subCpmkId || errors.cpmkId || errors.courseId) && (
            <p className="text-xs text-danger">{errors.subCpmkId?.message || errors.cpmkId?.message || errors.courseId?.message}</p>
          )}

          <div className="flex items-center gap-2">
            <input type="checkbox" id="assessmentActive" {...register('isActive')} className="rounded border-gray-300" />
            <label htmlFor="assessmentActive" className="text-sm text-gray-700">Aktif</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={closeModal} type="button">Batal</Button>
            <Button variant="primary" type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Menyimpan...' : editItem ? 'Simpan Perubahan' : 'Tambah Assessment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Hapus Assessment" description="Apakah Anda yakin ingin menghapus Assessment ini? Tindakan ini tidak dapat dibatalkan."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
