import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Pencil, Trash2, Link2 } from 'lucide-react';
import { DataTable, Button, Modal, Input, Combobox } from '@widyatama/ui';
import type { Header, DataTableOptions } from '@widyatama/ui';
import { cpmkService, courseService, cplService } from '@/services/obe.service';
import { QUERY_KEYS, CPL_CATEGORY_LABELS } from '@/constants';
import { cpmkSchema, type CpmkFormData } from '@/schemas/obe.schema';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { useApp } from '@/contexts/AppContext';
import type { Cpmk, CpmkDetail } from '@/types';

export default function CpmkPage() {
  const queryClient = useQueryClient();
  const { studyProgramId, selectedProfile } = useApp();
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [cplModalOpen, setCplModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Cpmk | null>(null);
  const [selectedCpmkId, setSelectedCpmkId] = useState<string | null>(null);
  const [selectedCpmkDetail, setSelectedCpmkDetail] = useState<CpmkDetail | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tableOptions, setTableOptions] = useState<DataTableOptions<Cpmk>>({
    page: 1, itemsPerPage: 10, sortBy: 'code' as keyof Cpmk, sortDesc: false,
  });

  // Fetch CPMK list
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.cpmk({ page: tableOptions.page, limit: tableOptions.itemsPerPage, search, courseId: courseFilter || undefined, sortBy: String(tableOptions.sortBy), sortOrder: tableOptions.sortDesc ? 'desc' : 'asc' }),
    queryFn: () => cpmkService.getAll({ page: tableOptions.page, limit: tableOptions.itemsPerPage, search, courseId: courseFilter || undefined, sortBy: String(tableOptions.sortBy), sortOrder: tableOptions.sortDesc ? 'desc' : 'asc' }),
  });

  // Fetch courses — scoped to study program when tenant ID is set
  const { data: coursesData } = useQuery({
    queryKey: QUERY_KEYS.courses({ limit: 100, studyProgramId: studyProgramId ?? undefined }),
    queryFn: () => courseService.getAll({ limit: 100, studyProgramId: studyProgramId ?? undefined }),
  });

  // Fetch CPL list — scoped to selected curriculum
  const { data: cplData } = useQuery({
    queryKey: QUERY_KEYS.cpl({ limit: 100, graduateProfileId: selectedProfile?.id }),
    queryFn: () => cplService.getAll({ limit: 100, graduateProfileId: selectedProfile?.id }),
  });

  const courseOptions = (coursesData?.data ?? []).map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }));
  const cplOptions = (cplData?.data ?? []).map((c) => ({ value: c.id, label: `${c.code} - ${c.name} (${CPL_CATEGORY_LABELS[c.category] || c.category})` }));

  // Create/Update
  const saveMutation = useMutation({
    mutationFn: (formData: CpmkFormData) => editItem ? cpmkService.update(editItem.id, formData) : cpmkService.create(formData),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cpmk() }); closeModal(); },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => cpmkService.remove(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cpmk() }); setDeleteId(null); },
  });

  // CPL Mapping
  const mapCplMutation = useMutation({
    mutationFn: ({ cpmkId, cplId, weight }: { cpmkId: string; cplId: string; weight: number }) => cpmkService.mapCpl(cpmkId, { cplId, weight }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cpmk() });
      if (selectedCpmkId) {
        cpmkService.getById(selectedCpmkId).then((res) => setSelectedCpmkDetail(res.data));
      }
    },
  });

  // Form
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<CpmkFormData>({
    resolver: zodResolver(cpmkSchema),
    defaultValues: { code: '', name: '', description: '', orderNumber: 1, courseId: '', isActive: true },
  });

  const courseIdValue = watch('courseId');

  const openCreate = () => {
    setEditItem(null);
    reset({ code: '', name: '', description: '', orderNumber: 1, courseId: '', isActive: true });
    setModalOpen(true);
  };

  const openEdit = (item: Cpmk) => {
    setEditItem(item);
    reset({ code: item.code, name: item.name, description: item.description || '', orderNumber: item.orderNumber, courseId: item.course?.id || '', isActive: item.isActive });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditItem(null); };

  const openCplMapping = async (cpmkId: string) => {
    setSelectedCpmkId(cpmkId);
    try {
      const res = await cpmkService.getById(cpmkId);
      setSelectedCpmkDetail(res.data);
    } catch { setSelectedCpmkDetail(null); }
    setCplModalOpen(true);
  };

  const onSubmit = (formData: CpmkFormData) => saveMutation.mutate(formData);

  const [mapCplId, setMapCplId] = useState('');
  const [mapWeight, setMapWeight] = useState(50);

  const headers: Header<Cpmk>[] = [
    { key: 'code', title: 'Kode', sortable: true },
    { key: 'name', title: 'Nama', sortable: true },
    { key: 'course', title: 'Mata Kuliah', sortable: false, render: (row) => <span className="text-gray-600">{row.course?.name || '-'}</span> },
    { key: 'orderNumber', title: 'Urutan', sortable: true, render: (row) => <span className="text-gray-600">{row.orderNumber}</span> },
    { key: 'isActive', title: 'Status', sortable: true, render: (row) => <StatusBadge active={row.isActive} /> },
    {
      key: 'id' as keyof Cpmk, title: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" iconLeft={<Link2 size={14} />} onClick={() => openCplMapping(row.id)} title="Map CPL" />
          <Button variant="ghost" size="sm" iconLeft={<Pencil size={14} />} onClick={() => openEdit(row)} />
          <Button variant="ghost" size="sm" iconLeft={<Trash2 size={14} className="text-danger" />} onClick={() => setDeleteId(row.id)} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Capaian Pembelajaran Mata Kuliah (CPMK)"
        description="Kelola kompetensi yang harus dicapai pada setiap mata kuliah"
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'CPMK' }]}
        action={{ label: 'Tambah CPMK', onClick: openCreate, icon: <Plus size={16} /> }}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Cari CPMK..." value={search}
            onChange={(e) => { setSearch(e.target.value); setTableOptions((prev) => ({ ...prev, page: 1 })); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="w-64">
          <Combobox
            placeholder="Filter mata kuliah..."
            value={courseFilter}
            onChange={(val) => { setCourseFilter(val); setTableOptions((prev) => ({ ...prev, page: 1 })); }}
            options={[{ value: '', label: 'Semua Mata Kuliah' }, ...courseOptions]}
          />
        </div>
      </div>

      {/* Table */}
      {data?.data?.length === 0 && !search && !courseFilter ? (
        <EmptyState
          title="Belum ada CPMK"
          description="Mulai tambahkan Capaian Pembelajaran Mata Kuliah."
          action={<Button variant="primary" iconLeft={<Plus size={16} />} onClick={openCreate}>Tambah CPMK</Button>}
        />
      ) : (
        <DataTable<Cpmk> headers={headers} items={data?.data ?? []} totalItems={data?.meta?.total ?? 0} loading={isLoading} options={tableOptions} onOptionsChange={setTableOptions} />
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onOpenChange={(open) => { if (!open) closeModal(); }} title={editItem ? 'Edit CPMK' : 'Tambah CPMK'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Kode CPMK" placeholder="CPMK-01" error={!!errors.code} {...register('code')} />
          {errors.code && <p className="text-xs text-danger mt-1">{errors.code.message}</p>}

          <Input label="Nama CPMK" placeholder="Mampu menganalisis..." error={!!errors.name} {...register('name')} />
          {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}

          <Input label="Deskripsi" placeholder="Deskripsi CPMK (opsional)" error={!!errors.description} {...register('description')} />
          {errors.description && <p className="text-xs text-danger mt-1">{errors.description.message}</p>}

          <Input label="Nomor Urutan" type="number" placeholder="1" error={!!errors.orderNumber} {...register('orderNumber')} />
          {errors.orderNumber && <p className="text-xs text-danger mt-1">{errors.orderNumber.message}</p>}

          <Combobox label="Mata Kuliah" placeholder="Pilih mata kuliah..." value={courseIdValue} onChange={(val) => setValue('courseId', val, { shouldValidate: true })} options={courseOptions} />
          {errors.courseId && <p className="text-xs text-danger mt-1">{errors.courseId.message}</p>}

          <div className="flex items-center gap-2">
            <input type="checkbox" id="cpmkActive" {...register('isActive')} className="rounded border-gray-300" />
            <label htmlFor="cpmkActive" className="text-sm text-gray-700">Aktif</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={closeModal} type="button">Batal</Button>
            <Button variant="primary" type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Menyimpan...' : editItem ? 'Simpan Perubahan' : 'Tambah CPMK'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CPL Mapping Modal */}
      <Modal open={cplModalOpen} onOpenChange={(open) => { if (!open) { setCplModalOpen(false); setSelectedCpmkDetail(null); } }} title="Mapping CPL ke CPMK">
        <div className="space-y-4">
          {/* Existing Mappings */}
          {selectedCpmkDetail?.cpls && selectedCpmkDetail.cpls.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">CPL Termap</p>
              {selectedCpmkDetail.cpls.map((cpl) => (
                <div key={cpl.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-sm">{cpl.code}</span>
                    <span className="text-gray-500 text-sm ml-2">- {cpl.name}</span>
                  </div>
                  <span className="text-sm font-medium text-primary">Bobot: {cpl.weight}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Add New Mapping */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Tambah Mapping CPL</p>
            <Combobox placeholder="Pilih CPL..." value={mapCplId} onChange={setMapCplId} options={cplOptions} />
            <Input label="Bobot (%)" type="number" placeholder="50" value={String(mapWeight)} onChange={(e) => setMapWeight(Number(e.target.value))} />
            <Button
              variant="primary" size="sm" disabled={!mapCplId || !selectedCpmkId || mapCplMutation.isPending}
              onClick={() => selectedCpmkId && mapCplId && mapCplMutation.mutate({ cpmkId: selectedCpmkId, cplId: mapCplId, weight: mapWeight })}
            >
              {mapCplMutation.isPending ? 'Menyimpan...' : 'Map CPL'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Hapus CPMK" description="Apakah Anda yakin ingin menghapus CPMK ini? Tindakan ini tidak dapat dibatalkan."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
