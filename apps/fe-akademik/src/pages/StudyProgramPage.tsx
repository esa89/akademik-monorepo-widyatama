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
import { studyProgramService } from '@/services/studyProgram.service';
import { facultyService } from '@/services/faculty.service';
import type { StudyProgram } from '@/types';
import { Plus, Search, Pencil, Trash2, GraduationCap, CheckCircle2, Copy, Check } from 'lucide-react';

function UuidChip({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="flex items-center gap-1.5 group">
      <span className="font-mono text-[11px] text-gray-400 truncate max-w-[88px]" title={id}>
        {id.slice(0, 8)}…
      </span>
      <button
        onClick={copy}
        className="p-0.5 rounded text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Salin UUID lengkap"
      >
        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
      </button>
    </div>
  );
}

export default function StudyProgramPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [options, setOptions] = useState({ page: 1, itemsPerPage: 10, sortBy: 'createdAt' as keyof StudyProgram, sortDesc: true });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ facultyId: '', code: '', name: '', description: '', degree: '', accreditation: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['study-programs', options.page, options.itemsPerPage, debouncedSearch],
    queryFn: () => studyProgramService.getAll({ page: options.page, limit: options.itemsPerPage, search: debouncedSearch || undefined }),
  });

  const { data: activeData } = useQuery({
    queryKey: ['study-programs', 'active-count'],
    queryFn: () => studyProgramService.getAll({ isActive: true, limit: 1 }),
  });

  const { data: faculties } = useQuery({
    queryKey: ['faculties', 'all'],
    queryFn: () => facultyService.getAll({ page: 1, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: studyProgramService.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['study-programs'] }); setDrawerOpen(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof studyProgramService.update>[1] }) =>
      studyProgramService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['study-programs'] }); setDrawerOpen(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: studyProgramService.remove,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['study-programs'] }); setConfirmOpen(false); },
  });

  const resetForm = () => {
    setForm({ facultyId: '', code: '', name: '', description: '', degree: '', accreditation: '' });
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setDrawerOpen(true); };
  const openEdit = (item: StudyProgram) => {
    setForm({ facultyId: item.facultyId, code: item.code, name: item.name, description: item.description || '', degree: item.degree, accreditation: item.accreditation || '' });
    setEditingId(item.id);
    setDrawerOpen(true);
  };
  const openDelete = (id: string) => { setDeleteId(id); setConfirmOpen(true); };

  const handleSubmit = () => {
    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(form);
  };

  const toggleStatus = (item: StudyProgram) => {
    updateMutation.mutate({ id: item.id, data: { isActive: !item.isActive } });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Program Studi"
        description="Kelola data program studi"
        action={{ label: 'Tambah Program Studi', onClick: openCreate, icon: <Plus size={16} /> }}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Program Studi"
          value={data?.meta.total}
          icon={<GraduationCap size={22} />}
          iconBg="bg-blue-100 text-blue-600"
          sub="Seluruh program studi terdaftar"
        />
        <StatCard
          title="Program Studi Aktif"
          value={activeData?.meta.total}
          icon={<CheckCircle2 size={22} />}
          iconBg="bg-green-100 text-green-600"
          sub="Program studi dengan status aktif"
        />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <Input placeholder="Cari program studi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <DataTable<StudyProgram>
        headers={[
          { key: 'code', title: 'Kode', sortable: true, render: (item) => <CodeChip code={item.code} /> },
          { key: 'id', title: 'UUID', render: (item) => <UuidChip id={item.id} /> },
          { key: 'name', title: 'Nama', sortable: true },
          { key: 'faculty', title: 'Fakultas', render: (item) => item.faculty?.name || '-' },
          { key: 'degree', title: 'Jenjang', sortable: true },
          { key: 'accreditation', title: 'Akreditasi', sortable: true },
          { key: 'isActive', title: 'Status', render: (item) => <StatusBadge active={item.isActive} /> },
          {
            key: 'id', title: 'Aksi',
            render: (item) => (
              <div className="flex items-center gap-2">
                <Switch checked={item.isActive} onCheckedChange={() => toggleStatus(item)} size="sm" />
                <button onClick={() => openEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil size={16} /></button>
                <button onClick={() => openDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
              </div>
            ),
          },
        ]}
        items={data?.data ?? []}
        totalItems={data?.meta.total ?? 0}
        loading={isLoading}
        options={options}
        onOptionsChange={(opts: DataTableOptions<StudyProgram>) =>
          setOptions({
            page: opts.page,
            itemsPerPage: opts.itemsPerPage,
            sortBy: (opts.sortBy ?? 'createdAt') as keyof StudyProgram,
            sortDesc: opts.sortDesc ?? true,
          })
        }
      />

      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); resetForm(); }}
        title={editingId ? 'Edit Program Studi' : 'Tambah Program Studi'}
        description={editingId ? 'Ubah informasi program studi' : 'Isi data untuk menambahkan program studi baru'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setDrawerOpen(false); resetForm(); }}>Batal</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fakultas</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={form.facultyId}
              onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
            >
              <option value="">Pilih Fakultas</option>
              {faculties?.data.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <Input label="Kode" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Contoh: IF" />
          <Input label="Nama Program Studi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Teknik Informatika" />
          <Input label="Jenjang" value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} placeholder="S1 / S2 / S3 / D3 / D4" />
          <Input label="Akreditasi" value={form.accreditation} onChange={(e) => setForm({ ...form, accreditation: e.target.value })} placeholder="A / B / C / Unggul" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              placeholder="Deskripsi program studi (opsional)"
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
        title="Hapus Program Studi"
        description="Apakah Anda yakin ingin menghapus program studi ini? Tindakan ini tidak dapat dibatalkan."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
