import { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Drawer } from '@widyatama/ui';
import { useApp } from '@/contexts/AppContext';
import { cpmkCplMappingService } from '@/services/obe.service';
import type { CplCpmkMatrix, CplCpmkMappingPair } from '@/types';
import {
  Save, Download, FileSpreadsheet, Upload, CheckCircle2,
  XCircle, ChevronLeft, ChevronRight, Loader2, AlertTriangle,
  BookOpen, Info,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ImportRow {
  cpmkCode: string;
  cplCode: string;
  valid: boolean;
  error?: string;
}

// ─── Cell Component ────────────────────────────────────────────────────────────

function MappingCell({
  checked, dirty, onChange,
}: { checked: boolean; dirty: boolean; onChange: () => void }) {
  return (
    <td
      onClick={onChange}
      className={`border border-gray-200 text-center cursor-pointer select-none transition-colors
        ${checked
          ? dirty ? 'bg-emerald-100 hover:bg-emerald-200' : 'bg-emerald-50 hover:bg-emerald-100'
          : 'hover:bg-gray-50'}`}
      style={{ minWidth: 44, height: 44 }}
    >
      {checked && (
        <div className="flex items-center justify-center">
          <div className={`w-5 h-5 rounded flex items-center justify-center
            ${dirty ? 'bg-emerald-500' : 'bg-emerald-400'}`}>
            <CheckCircle2 size={13} className="text-white" />
          </div>
        </div>
      )}
    </td>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function MappingCplCpmkPage() {
  const queryClient = useQueryClient();
  const { selectedCurriculum } = useApp();
  const curriculumId = selectedCurriculum?.id ?? null;

  const [toast, setToast]       = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [localMappings, setLocalMappings] = useState<Set<string>>(new Set());
  const [savedMappings, setSavedMappings] = useState<Set<string>>(new Set());

  // Import
  const [importOpen, setImportOpen]         = useState(false);
  const [importStep, setImportStep]         = useState<1 | 2>(1);
  const [importRows, setImportRows]         = useState<ImportRow[]>([]);
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null);
  const [importResult, setImportResult]     = useState<{ count: number } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const key = (cpmkId: string, cplId: string) => `${cpmkId}|${cplId}`;

  // ─── Query ───────────────────────────────────────────────────────────────────

  const { data: matrixRes, isLoading } = useQuery({
    queryKey: ['cpmk-cpl-matrix', curriculumId, selectedCurriculum?.year],
    queryFn: () => cpmkCplMappingService.getMatrix({
      curriculumId: curriculumId!,
      curriculumYear: selectedCurriculum?.year,
    }),
    enabled: !!curriculumId,
  });

  const matrix: CplCpmkMatrix = matrixRes?.data ?? { cpls: [], cpmks: [], mappings: [], totalMapped: 0 };
  const { cpls, cpmks, mappings } = matrix;

  // Sync server state → local state when data arrives
  useEffect(() => {
    const s = new Set(mappings.map((m) => key(m.cpmkId, m.cplId)));
    setLocalMappings(s);
    setSavedMappings(s);
  }, [matrixRes]);

  const isDirty = useMemo(() => {
    if (localMappings.size !== savedMappings.size) return true;
    for (const k of localMappings) if (!savedMappings.has(k)) return true;
    return false;
  }, [localMappings, savedMappings]);

  const dirtyCount = useMemo(() => {
    let n = 0;
    for (const k of localMappings) if (!savedMappings.has(k)) n++;
    for (const k of savedMappings) if (!localMappings.has(k)) n++;
    return n;
  }, [localMappings, savedMappings]);

  // ─── Toggle ──────────────────────────────────────────────────────────────────

  const toggle = (cpmkId: string, cplId: string) => {
    const k = key(cpmkId, cplId);
    setLocalMappings((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };

  const toggleRow = (cpmkId: string) => {
    const allChecked = cpls.every((c) => localMappings.has(key(cpmkId, c.id)));
    setLocalMappings((prev) => {
      const next = new Set(prev);
      if (allChecked) cpls.forEach((c) => next.delete(key(cpmkId, c.id)));
      else cpls.forEach((c) => next.add(key(cpmkId, c.id)));
      return next;
    });
  };

  const toggleCol = (cplId: string) => {
    const allChecked = cpmks.every((c) => localMappings.has(key(c.id, cplId)));
    setLocalMappings((prev) => {
      const next = new Set(prev);
      if (allChecked) cpmks.forEach((c) => next.delete(key(c.id, cplId)));
      else cpmks.forEach((c) => next.add(key(c.id, cplId)));
      return next;
    });
  };

  const resetChanges = () => setLocalMappings(new Set(savedMappings));

  // ─── Save ─────────────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: (pairs: CplCpmkMappingPair[]) =>
      cpmkCplMappingService.saveMappings({ curriculumId: curriculumId!, mappings: pairs }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['cpmk-cpl-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['cpmk-course-mapping-matrix'] });
      showToast('success', `${res.data.count} pemetaan CPL–CPMK berhasil disimpan.`);
    },
    onError: () => showToast('error', 'Gagal menyimpan pemetaan.'),
  });

  const handleSave = () => {
    const pairs: CplCpmkMappingPair[] = [...localMappings].map((k) => {
      const [cpmkId, cplId] = k.split('|');
      return { cpmkId, cplId };
    });
    saveMutation.mutate(pairs);
  };

  // ─── Import ───────────────────────────────────────────────────────────────────

  const cplByCode  = useMemo(() => new Map(cpls.map((c) => [c.code, c])), [cpls]);
  const cpmkByCode = useMemo(() => new Map(cpmks.map((c) => [c.code, c])), [cpmks]);

  const resetImport = () => {
    setImportStep(1); setImportRows([]); setImportProgress(null); setImportResult(null);
    if (importFileRef.current) importFileRef.current.value = '';
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(new Uint8Array(evt.target?.result as ArrayBuffer), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        const seen = new Set<string>();
        const parsed: ImportRow[] = rows.slice(1)
          .map((row) => ({
            cpmkCode: String((row as unknown[])[0] ?? '').trim(),
            cplCode:  String((row as unknown[])[1] ?? '').trim(),
            valid: false,
          }))
          .filter((r) => r.cpmkCode && r.cplCode)
          .map((r) => {
            const dupKey = `${r.cpmkCode}|${r.cplCode}`;
            if (!cpmkByCode.has(r.cpmkCode)) return { ...r, error: `CPMK "${r.cpmkCode}" tidak ditemukan` };
            if (!cplByCode.has(r.cplCode))   return { ...r, error: `CPL "${r.cplCode}" tidak ditemukan` };
            if (seen.has(dupKey))             return { ...r, error: 'Duplikat dalam file' };
            seen.add(dupKey);
            return { ...r, valid: true };
          });
        setImportRows(parsed);
      } catch { showToast('error', 'Gagal membaca file Excel.'); }
    };
    reader.readAsArrayBuffer(file);
    if (importFileRef.current) importFileRef.current.value = '';
  };

  const runImport = async () => {
    const valid = importRows.filter((r) => r.valid);
    // Apply to local state
    setLocalMappings((prev) => {
      const next = new Set(prev);
      for (const row of valid) {
        const cpmk = cpmkByCode.get(row.cpmkCode)!;
        const cpl  = cplByCode.get(row.cplCode)!;
        next.add(key(cpmk.id, cpl.id));
      }
      return next;
    });
    setImportResult({ count: valid.length });
  };

  // ─── Export ───────────────────────────────────────────────────────────────────

  const handleExport = () => {
    const header = ['Kode CPMK', 'CPMK', ...cpls.map((c) => c.code)];
    const dataRows = cpmks.map((cpmk) => [
      cpmk.code,
      cpmk.name,
      ...cpls.map((cpl) => (localMappings.has(key(cpmk.id, cpl.id)) ? '✓' : '')),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...dataRows]);
    ws['!cols'] = [{ wch: 12 }, { wch: 60 }, ...cpls.map(() => ({ wch: 8 }))];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CPL-CPMK');
    XLSX.writeFile(wb, `mapping-cpl-cpmk-${selectedCurriculum?.year ?? 'all'}.xlsx`);
  };

  const handleTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Kode CPMK', 'Kode CPL'],
      ['CPMK011', 'CPL01'],
      ['CPMK012', 'CPL01'],
      ['CPMK021', 'CPL02'],
    ]);
    ws['!cols'] = [{ wch: 12 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template-mapping-cpl-cpmk.xlsx');
  };

  const validCount = importRows.filter((r) => r.valid).length;
  const totalLocal = localMappings.size;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toast.text}
        </div>
      )}

      {!curriculumId && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-700">
          <BookOpen size={18} className="shrink-0" />
          Pilih kurikulum terlebih dahulu melalui dropdown di header.
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapping CPL – CPMK</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedCurriculum
              ? `Kurikulum ${selectedCurriculum.name} · ${selectedCurriculum.year}`
              : 'Pilih kurikulum untuk menampilkan data'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button onClick={handleTemplate}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm">
            <Download size={14} /> Template
          </button>
          <button onClick={handleExport} disabled={cpmks.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm disabled:opacity-40">
            <FileSpreadsheet size={14} /> Export
          </button>
          <button onClick={() => { resetImport(); setImportOpen(true); }} disabled={cpmks.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm disabled:opacity-40">
            <Upload size={14} /> Import
          </button>
          {isDirty && (
            <button onClick={resetChanges}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm">
              Batalkan
            </button>
          )}
          <Button onClick={handleSave} disabled={!isDirty || saveMutation.isPending || !curriculumId}>
            {saveMutation.isPending
              ? <><Loader2 size={14} className="animate-spin mr-1.5" /> Menyimpan...</>
              : <><Save size={14} className="mr-1.5" /> Simpan{isDirty ? ` (${dirtyCount})` : ''}</>}
          </Button>
        </div>
      </div>

      {/* Dirty warning */}
      {isDirty && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <AlertTriangle size={15} className="shrink-0" />
          Ada <strong>{dirtyCount}</strong> perubahan belum disimpan — klik <strong>Simpan</strong> untuk menyimpan.
        </div>
      )}

      {/* Stats */}
      {curriculumId && !isLoading && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total CPL',  value: cpls.length,  color: 'text-primary',      pct: null },
            { label: 'Total CPMK', value: cpmks.length, color: 'text-blue-600',     pct: null },
            {
              label: 'Pemetaan aktif',
              value: `${totalLocal} pasang`,
              color: totalLocal > 0 ? 'text-emerald-700' : 'text-gray-400',
              pct: cpmks.length * cpls.length > 0 ? totalLocal / (cpmks.length * cpls.length) : 0,
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              {s.pct !== null && (
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${s.pct * 100}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      {curriculumId && !isLoading && cpmks.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-gray-500 px-1">
          <span className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={10} className="text-white" />
            </div>
            Terpetakan
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300 flex items-center justify-center">
              <CheckCircle2 size={10} className="text-emerald-500" />
            </div>
            Baru ditambah (belum disimpan)
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border border-gray-200 bg-white" />
            Tidak dipetakan
          </span>
          <span className="ml-auto flex items-center gap-1 text-gray-400">
            <Info size={12} /> Klik header kolom/baris untuk toggle semua
          </span>
        </div>
      )}

      {/* Matrix */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 gap-2 text-gray-400">
            <Loader2 size={20} className="animate-spin" /> Memuat data...
          </div>
        ) : !curriculumId ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">
            Pilih kurikulum untuk menampilkan matriks
          </div>
        ) : cpmks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
            <BookOpen size={28} className="opacity-40" />
            <p className="text-sm">Belum ada CPMK. Tambahkan CPMK di halaman Master CPMK terlebih dahulu.</p>
          </div>
        ) : cpls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
            <Info size={28} className="opacity-40" />
            <p className="text-sm">Belum ada CPL untuk tahun kurikulum ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="border-collapse text-sm w-full">
              <thead>
                {/* CPL header row */}
                <tr>
                  <th className="sticky left-0 z-20 bg-gray-50 border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[140px]">
                    Kode CPMK
                  </th>
                  <th className="sticky left-[140px] z-20 bg-gray-50 border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[260px] max-w-[280px]">
                    Isi CPMK
                  </th>
                  {cpls.map((cpl) => {
                    const colMapped = cpmks.every((c) => localMappings.has(key(c.id, cpl.id)));
                    return (
                      <th
                        key={cpl.id}
                        onClick={() => toggleCol(cpl.id)}
                        className="border border-gray-200 px-2 py-2 text-center cursor-pointer hover:bg-primary/5 transition-colors"
                        style={{ minWidth: 44 }}
                        title={cpl.name}
                      >
                        <div className={`text-xs font-bold leading-tight transition-colors
                          ${colMapped ? 'text-emerald-600' : 'text-primary hover:text-primary'}`}>
                          {cpl.code}
                        </div>
                      </th>
                    );
                  })}
                  <th className="border border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-400 min-w-[52px]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {cpmks.map((cpmk) => {
                  const rowCount = cpls.filter((c) => localMappings.has(key(cpmk.id, c.id))).length;
                  const rowDirty = cpls.some((c) => {
                    const k = key(cpmk.id, c.id);
                    return localMappings.has(k) !== savedMappings.has(k);
                  });
                  return (
                    <tr key={cpmk.id} className={rowDirty ? 'bg-amber-50/30' : 'hover:bg-gray-50/50'}>
                      {/* CPMK code — sticky */}
                      <td
                        onClick={() => toggleRow(cpmk.id)}
                        className="sticky left-0 z-10 bg-inherit border border-gray-200 px-3 py-2 cursor-pointer hover:bg-primary/5"
                      >
                        <span className={`font-mono text-xs font-bold transition-colors
                          ${rowCount > 0 ? 'text-emerald-700' : 'text-gray-600'}`}>
                          {cpmk.code}
                        </span>
                        {rowDirty && (
                          <span className="ml-1.5 text-[9px] font-bold text-amber-500 bg-amber-100 px-1 rounded">ubah</span>
                        )}
                      </td>
                      {/* CPMK name — sticky */}
                      <td className="sticky left-[140px] z-10 bg-inherit border border-gray-200 px-3 py-2 max-w-[280px]">
                        <p className="text-xs text-gray-600 line-clamp-2 leading-snug">{cpmk.name}</p>
                      </td>
                      {/* CPL cells */}
                      {cpls.map((cpl) => {
                        const k = key(cpmk.id, cpl.id);
                        const isChecked = localMappings.has(k);
                        const isDirtyCell = isChecked !== savedMappings.has(k);
                        return (
                          <MappingCell
                            key={cpl.id}
                            checked={isChecked}
                            dirty={isDirtyCell}
                            onChange={() => toggle(cpmk.id, cpl.id)}
                          />
                        );
                      })}
                      {/* Row total */}
                      <td className="border border-gray-200 px-2 py-2 text-center">
                        <span className={`text-xs font-semibold rounded px-1.5 py-0.5
                          ${rowCount > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-gray-400'}`}>
                          {rowCount}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {/* Column totals */}
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td className="sticky left-0 z-10 bg-gray-50 border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500">
                    Total
                  </td>
                  <td className="sticky left-[140px] z-10 bg-gray-50 border border-gray-200" />
                  {cpls.map((cpl) => {
                    const n = cpmks.filter((c) => localMappings.has(key(c.id, cpl.id))).length;
                    return (
                      <td key={cpl.id} className="border border-gray-200 text-center py-2">
                        <span className={`text-xs font-semibold rounded px-1.5 py-0.5
                          ${n > 0 ? 'text-primary bg-primary/10' : 'text-gray-400'}`}>
                          {n}
                        </span>
                      </td>
                    );
                  })}
                  <td className="border border-gray-200 text-center py-2">
                    <span className="text-xs font-bold text-gray-700">{totalLocal}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CPL legend (below table) */}
      {cpls.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Keterangan CPL</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {cpls.map((cpl) => (
              <div key={cpl.id} className="flex items-start gap-2">
                <span className="shrink-0 px-2 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary mt-0.5">{cpl.code}</span>
                <p className="text-xs text-gray-600 leading-snug">{cpl.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Import Drawer ───────────────────────────────────────────────────── */}
      <Drawer
        open={importOpen}
        onClose={() => { setImportOpen(false); resetImport(); }}
        title="Import Mapping CPL – CPMK"
        footer={
          importResult ? (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setImportOpen(false); resetImport(); }}>Tutup</Button>
              <Button onClick={() => { setImportOpen(false); resetImport(); }}>Simpan Perubahan di Matrix</Button>
            </div>
          ) : importProgress ? null : importStep === 1 ? (
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => { setImportOpen(false); resetImport(); }}>Batal</Button>
              <Button onClick={() => setImportStep(2)} disabled={!curriculumId}>
                Lanjut <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => { setImportStep(1); setImportRows([]); }}>
                <ChevronLeft size={14} className="mr-1" /> Kembali
              </Button>
              <Button onClick={runImport} disabled={validCount === 0}>
                <CheckCircle2 size={14} className="mr-1" /> Terapkan {validCount} baris ke Matrix
              </Button>
            </div>
          )
        }
      >
        <div className="space-y-4 p-1">

          <div className="flex items-center gap-2 text-xs">
            {(['1. Kurikulum', '2. Upload'] as const).map((label, idx) => {
              const step = (idx + 1) as 1 | 2;
              const active = importStep === step, done = importStep > step;
              return (
                <div key={label} className="flex items-center gap-2">
                  {idx > 0 && <div className="w-6 h-px bg-gray-200" />}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium
                    ${active ? 'bg-primary text-white' : done ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                    {done ? <CheckCircle2 size={11} /> : step} {label.split('. ')[1]}
                  </div>
                </div>
              );
            })}
          </div>

          {importStep === 1 && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm">
                <p className="font-semibold text-blue-800">{selectedCurriculum?.name}</p>
                <p className="text-xs text-blue-500 mt-0.5">Tahun {selectedCurriculum?.year}</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 flex gap-2">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                Import akan <strong>menambahkan</strong> pemetaan ke matrix. Klik Simpan di halaman utama untuk menyimpan ke database.
              </div>
            </div>
          )}

          {importStep === 2 && !importProgress && !importResult && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-2">Format kolom (baris 1 = header):</p>
                <table className="text-[11px] w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="px-2 py-1 text-left border border-gray-300 font-semibold">A: Kode CPMK</th>
                      <th className="px-2 py-1 text-left border border-gray-300 font-semibold">B: Kode CPL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[['CPMK011','CPL01'],['CPMK012','CPL01'],['CPMK021','CPL02']].map(([a,b]) => (
                      <tr key={a+b} className="bg-white">
                        <td className="px-2 py-1 border border-gray-200 font-mono">{a}</td>
                        <td className="px-2 py-1 border border-gray-200 font-mono">{b}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <input ref={importFileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />
              <button onClick={() => importFileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-primary hover:text-primary transition-colors">
                <FileSpreadsheet size={16} />
                {importRows.length > 0 ? 'Ganti File' : 'Pilih File Excel (.xlsx / .xls)'}
              </button>

              {importRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-600">
                      <span className="text-emerald-600">{validCount} valid</span>
                      {importRows.filter((r) => !r.valid).length > 0 && (
                        <span className="text-red-500 ml-2">{importRows.filter((r) => !r.valid).length} error</span>
                      )}
                    </p>
                    <p className="text-[11px] text-gray-400">{importRows.length} baris</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-y-auto max-h-60">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600 w-24">CPMK</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">CPL / Error</th>
                            <th className="px-2 py-2 text-center w-8">✓</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importRows.map((row, i) => (
                            <tr key={i} className={`border-b border-gray-50 ${!row.valid ? 'bg-red-50' : ''}`}>
                              <td className="px-3 py-2 font-mono">{row.cpmkCode}</td>
                              <td className="px-3 py-2">
                                {row.valid
                                  ? <span className="font-mono text-gray-600">{row.cplCode}</span>
                                  : <span className="text-red-600">{row.error}</span>}
                              </td>
                              <td className="px-2 py-2 text-center">
                                {row.valid
                                  ? <CheckCircle2 size={12} className="text-emerald-500 inline" />
                                  : <XCircle size={12} className="text-red-500 inline" />}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {importResult && (
            <div className="flex items-start gap-3 p-4 rounded-xl border bg-emerald-50 border-emerald-200">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Berhasil diterapkan ke matrix</p>
                <p className="text-xs mt-0.5 text-gray-600">
                  {importResult.count} pasang CPMK–CPL ditambahkan. Klik <strong>Simpan</strong> di halaman utama untuk menyimpan ke database.
                </p>
              </div>
            </div>
          )}

        </div>
      </Drawer>

    </div>
  );
}
