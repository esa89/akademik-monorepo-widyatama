import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable, Input, Button, Modal, Switch } from '@widyatama/ui';
import type { DataTableOptions } from '@widyatama/ui';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { academicSemesterService } from '@/services/academicSemester.service';
import type { AcademicSemester, SemesterType } from '@/types';
import { Plus, Search, Pencil, Trash2, Star } from 'lucide-react';

const semesterTypeLabels: Record<SemesterType, string> = {
  GANJIL: 'Ganjil',
  GENAP: 'Genap',
  PENDEK: 'Pendek',
};

export default function AcademicSemesterPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [options, setOptions] = useState({ page: 1, itemsPerPage: 10, sortBy: 'createdAt' as keyof AcademicSemester, sortDesc: true });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', name: '', academicYear: '', semesterType: 'GANJIL' as SemesterType, startDate: '', endDate: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['academic-semesters', options.page, options.itemsPerPage, debouncedSearch],
    queryFn: () => academicSemesterService.getAll({ page: options.page, limit: options.itemsPerPage, search: debouncedSearch || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: academicSemesterService.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['academic-semesters'] }); setModalOpen(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof academicSemesterService.update>[1] }) => academicSemesterService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['academic-semesters'] }); setModalOpen(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: academicSemesterService.remove,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['academic-semesters'] }); setConfirmOpen(false); },
  });

  const setCurrentMutation = useMutation({
    mutationFn: academicSemesterService.setCurrent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['academic-semesters'] }),
  });

  const resetForm = () => {
    setForm({ code: '', name: '', academicYear: '', semesterType: 'GANJIL', startDate: '', endDate: '' });
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setModalOpen(true); };
  const openEdit = (item: AcademicSemester) => {
    setForm({ code: item.code, name: item.name, academicYear: item.academicYear, semesterType: item.semesterType, startDate: item.startDate.split('T')[0], endDate: item.endDate.split('T')[0] });
    setEditingId(item.id);
    setModalOpen(true);
  };
  const openDelete = (id: string) => { setDeleteId(id); setConfirmOpen(true); };

  const handleSubmit = () => {
    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(form);
  };

  const toggleStatus = (item: AcademicSemester) => {
    updateMutation.mutate({ id: item.id, data: { isActive: !item.isActive } });
  };

  return (
    <div>
      <PageHeader title="Semester Akademik" description="Kelola data semester akademik" action={{ label: 'Tambah Semester', onClick: openCreate, icon: <Plus size={16} /> }} />
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input placeholder="Cari semester..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>
      <DataTable<AcademicSemester>
        headers={[
          { key: 'code', title: 'Kode', sortable: true },
          { key: 'name', title: 'Nama', sortable: true },
          { key: 'academicYear', title: 'Tahun Akademik', sortable: true },
          { key: 'semesterType', title: 'Tipe', render: (item) => semesterTypeLabels[item.semesterType] },
          { key: 'startDate', title: 'Mulai', render: (item) => new Date(item.startDate).toLocaleDateString('id-ID') },
          { key: 'endDate', title: 'Selesai', render: (item) => new Date(item.endDate).toLocaleDateString('id-ID') },
          { key: 'isCurrent', title: 'Current', render: (item) => item.isCurrent ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><Star size={10} className="mr-1" />Aktif</span> : '-' },
          { key: 'isActive', title: 'Status', render: (item) => <StatusBadge active={item.isActive} /> },
          { key: 'id', title: 'Aksi', render: (item) => (
            <div className="flex items-center gap-2">
              <Switch checked={item.isActive} onCheckedChange={() => toggleStatus(item)} size="sm" />
              {!item.isCurrent && (
                <button onClick={() => setCurrentMutation.mutate(item.id)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Set as current">
                  <Star size={16} />
                </button>
              )}
              <button onClick={() => openEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil size={16} /></button>
              <button onClick={() => openDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
            </div>
          )},
        ]}
        items={data?.data ?? []} totalItems={data?.meta.total ?? 0} loading={isLoading} options={options}
        onOptionsChange={(opts: DataTableOptions<AcademicSemester>) =>
          setOptions({
            page: opts.page,
            itemsPerPage: opts.itemsPerPage,
            sortBy: (opts.sortBy ?? 'createdAt') as keyof AcademicSemester,
            sortDesc: opts.sortDesc ?? true,
          })
        }
      />
      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editingId ? 'Edit Semester' : 'Tambah Semester'}>
        <div className="space-y-4 py-2">
          <Input label="Kode" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Input label="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Tahun Akademik" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} placeholder="2024/2025" />
          <select className="w-full px-3 py-2 border rounded-md text-sm" value={form.semesterType} onChange={(e) => setForm({ ...form, semesterType: e.target.value as SemesterType })}>
            <option value="GANJIL">Ganjil</option>
            <option value="GENAP">Genap</option>
            <option value="PENDEK">Pendek</option>
          </select>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Tanggal Mulai" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="Tanggal Selesai" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>

        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>Simpan</Button>
        </div>
      </Modal>
      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} title="Hapus Semester" description="Apakah Anda yakin ingin menghapus semester ini?" loading={deleteMutation.isPending} />
    </div>
  );
}
