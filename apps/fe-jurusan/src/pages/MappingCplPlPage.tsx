import { useState, useMemo, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button, Drawer } from '@widyatama/ui';
import { useApp } from '@/contexts/AppContext';
import { cplProfileMappingService } from '@/services/obe.service';
import type { CplSummary, GraduateProfileSummary, CplCategory, MappingPair } from '@/types';
import {
  Save, Download, Upload, FileSpreadsheet,
  ChevronLeft, ChevronRight, Loader2, Grid3X3,
  CheckSquare, Square,
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────────────────────

const CPL_CATEGORY_LABELS: Record<CplCategory, string> = {
  SIKAP: 'S',
  PENGETAHUAN: 'P',
  KETERAMPILAN_UMUM: 'KU',
  KETERAMPILAN_KHUSUS: 'KK',
};

const CPL_CATEGORY_COLORS: Record<CplCategory, string> = {
  SIKAP: 'bg-blue-100 text-blue-700',
  PENGETAHUAN: 'bg-green-100 text-green-700',
  KETERAMPILAN_UMUM: 'bg-orange-100 text-orange-700',
  KETERAMPILAN_KHUSUS: 'bg-purple-100 text-purple-700',
};

// ─── Import Modal ────────────────────────────────────────────────────────────────

interface ImportResult {
  cplId: string;
  cplCode: string;
  graduateProfileId: string;
  plCode: string;
  valid: boolean;
  error?: string;
}

interface ImportModalProps {
  open: boolean;
  cpls: CplSummary[];
  graduateProfiles: GraduateProfileSummary[];
  onClose: () => void;
  onConfirm: (mappings: MappingPair[]) => void;
}

function ImportModal({ open, cpls, graduateProfiles, onClose, onConfirm }: ImportModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setStep(1); setResults([]); setFileName(''); }
  }, [open]);

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target?.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' });

      if (rows.length < 2) {
        setResults([]);
        setStep(2);
        return;
      }

      const header = rows[0] as string[];
      // Column 0 = kode CPL, columns 1+ = PL codes (e.g. "PL01", "PL02")
      const plColumns: { index: number; code: string; pl: GraduateProfileSummary | undefined }[] = [];
      for (let i = 1; i < header.length; i++) {
        const plCode = String(header[i] ?? '').trim();
        if (!plCode) continue;
        const pl = graduateProfiles.find((p) => p.code === plCode);
        plColumns.push({ index: i, code: plCode, pl });
      }

      const parsed: ImportResult[] = [];

      for (let r = 1; r < rows.length; r++) {
        const row = rows[r] as string[];
        const cplCode = String(row[0] ?? '').trim();
        if (!cplCode) continue;

        const cpl = cpls.find((c) => c.code === cplCode);

        for (const col of plColumns) {
          const cellVal = String(row[col.index] ?? '').trim();
          const isChecked = ['1', 'v', 'y', 'yes', '✓', 'x', 'ya', 'true'].includes(cellVal.toLowerCase());
          if (!isChecked) continue;

          if (!cpl) {
            parsed.push({ cplId: '', cplCode, graduateProfileId: '', plCode: col.code, valid: false, error: `CPL "${cplCode}" tidak ditemukan` });
            continue;
          }
          if (!col.pl) {
            parsed.push({ cplId: cpl.id, cplCode, graduateProfileId: '', plCode: col.code, valid: false, error: `PL "${col.code}" tidak ditemukan` });
            continue;
          }
          parsed.push({ cplId: cpl.id, cplCode, graduateProfileId: col.pl.id, plCode: col.code, valid: true });
        }
      }

      setResults(parsed);
      setStep(2);
    };
    reader.readAsBinaryString(file);
  };

  const validMappings = results.filter((r) => r.valid).map((r) => ({ cplId: r.cplId, graduateProfileId: r.graduateProfileId }));

  const footer = (
    <div className="flex items-center justify-between">
      <button
        onClick={() => step === 1 ? onClose() : setStep(1)}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ChevronLeft size={16} /> {step === 1 ? 'Batal' : 'Kembali'}
      </button>
      {step === 2 && (
        <Button
          disabled={validMappings.length === 0}
          onClick={() => { onConfirm(validMappings); onClose(); }}
        >
          <ChevronRight size={14} className="mr-1" />
          Terapkan {validMappings.length} Mapping
        </Button>
      )}
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Import Mapping CPL – PL"
      description={`Langkah ${step} dari 2`}
      footer={footer}
    >
      {step === 1 && (
        <div className="space-y-5">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <FileSpreadsheet size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600">{fileName || 'Klik untuk pilih file Excel'}</p>
            <p className="text-xs text-gray-400 mt-1">Format: .xlsx atau .xls</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Format Excel:</p>
            <p>• Kolom A: Kode CPL (header: "kode CPL")</p>
            <p>• Kolom B dst: Kode PL sebagai header (misal "PL01", "PL02")</p>
            <p>• Isi cell dengan "v", "1", atau "✓" jika CPL dipetakan ke PL tersebut</p>
            <p className="text-blue-500 italic">Gunakan tombol Template untuk mengunduh format yang benar</p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-semibold">{validMappings.length} mapping valid</span>
            {results.filter((r) => !r.valid).length > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-semibold">{results.filter((r) => !r.valid).length} error</span>
            )}
          </div>

          {results.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">Tidak ada data mapping ditemukan di file</div>
          )}

          <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-2.5 text-sm ${r.valid ? '' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2 min-w-0">
                  {r.valid
                    ? <CheckSquare size={14} className="text-green-500 shrink-0" />
                    : <Square size={14} className="text-red-400 shrink-0" />}
                  <span className="font-medium text-gray-700">{r.cplCode}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-gray-700">{r.plCode}</span>
                </div>
                {r.error && <span className="text-xs text-red-500 ml-2 shrink-0">{r.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </Drawer>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────────

export default function MappingCplPlPage() {
  const { selectedCurriculum } = useApp();

  const curriculumId   = selectedCurriculum?.id ?? null;
  const curriculumYear = selectedCurriculum?.year ?? null;

  // Local mapping state: Set of "cplId:graduateProfileId"
  const [localMappings, setLocalMappings]   = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty]               = useState(false);
  const [filterCategory, setFilterCategory] = useState<CplCategory | ''>('');
  const [showImport, setShowImport]         = useState(false);
  const [saveSuccess, setSaveSuccess]       = useState(false);

  // ─── Data ──────────────────────────────────────────────────────────────────────

  const { data: matrixResp, isLoading, isError } = useQuery({
    queryKey: ['cpl-profile-matrix', curriculumId, curriculumYear],
    queryFn: () => cplProfileMappingService.getMatrix({
      curriculumId: curriculumId!,
      curriculumYear: curriculumYear ?? undefined,
    }),
    enabled: !!curriculumId,
  });

  useEffect(() => {
    if (!matrixResp?.data) return;
    const initial = new Set(matrixResp.data.mappings.map((m) => `${m.cplId}:${m.graduateProfileId}`));
    setLocalMappings(initial);
    setIsDirty(false);
  }, [matrixResp]);

  const matrix = matrixResp?.data;

  const filteredCpls = useMemo(() => {
    if (!matrix?.cpls) return [];
    if (!filterCategory) return matrix.cpls;
    return matrix.cpls.filter((c) => c.category === filterCategory);
  }, [matrix?.cpls, filterCategory]);

  // ─── Mutation ──────────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: (mappings: MappingPair[]) =>
      cplProfileMappingService.saveMappings({ curriculumId: curriculumId!, mappings }),
    onSuccess: () => {
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    },
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────────

  const toggleCell = (cplId: string, plId: string) => {
    const key = `${cplId}:${plId}`;
    setLocalMappings((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    setIsDirty(true);
  };

  const handleSave = () => {
    const mappings: MappingPair[] = [];
    localMappings.forEach((key) => {
      const [cplId, graduateProfileId] = key.split(':');
      mappings.push({ cplId, graduateProfileId });
    });
    saveMutation.mutate(mappings);
  };

  const handleImportConfirm = (mappings: MappingPair[]) => {
    const next = new Set(mappings.map((m) => `${m.cplId}:${m.graduateProfileId}`));
    setLocalMappings(next);
    setIsDirty(true);
  };

  const handleExport = () => {
    if (!matrix) return;
    const header = ['kode CPL', ...matrix.graduateProfiles.map((p) => p.code)];
    const rows = matrix.cpls.map((cpl) => [
      cpl.code,
      ...matrix.graduateProfiles.map((pl) => (localMappings.has(`${cpl.id}:${pl.id}`) ? 'v' : '')),
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws['!cols'] = [{ wch: 12 }, ...matrix.graduateProfiles.map(() => ({ wch: 8 }))];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mapping CPL-PL');
    XLSX.writeFile(wb, `mapping-cpl-pl-${curriculumYear ?? 'all'}.xlsx`);
  };

  const handleDownloadTemplate = () => {
    if (!matrix) return;
    const header = ['kode CPL', ...matrix.graduateProfiles.map((p) => p.code)];
    const rows = matrix.cpls.map((cpl) => [cpl.code, ...matrix.graduateProfiles.map(() => '')]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws['!cols'] = [{ wch: 12 }, ...matrix.graduateProfiles.map(() => ({ wch: 8 }))];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Mapping CPL-PL');
    XLSX.writeFile(wb, 'template-mapping-cpl-pl.xlsx');
  };

  // ─── Render Helpers ────────────────────────────────────────────────────────────

  if (!curriculumId) {
    return (
      <div className="flex flex-col items-center justify-center h-72 text-center gap-3">
        <Grid3X3 size={36} className="text-gray-300" />
        <p className="text-gray-500 font-medium">Pilih kurikulum terlebih dahulu</p>
        <p className="text-xs text-gray-400">Gunakan dropdown kurikulum di header untuk memilih kurikulum aktif</p>
      </div>
    );
  }

  const hasMappings = matrix && (matrix.cpls.length > 0 || matrix.graduateProfiles.length > 0);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mapping CPL – Profil Lulusan</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {selectedCurriculum?.name} · {curriculumYear}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {matrix && (
            <>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download size={14} /> Template
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Upload size={14} /> Import
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FileSpreadsheet size={14} /> Export
              </button>
              <Button
                onClick={handleSave}
                disabled={!isDirty || saveMutation.isPending}
              >
                {saveMutation.isPending
                  ? <Loader2 size={14} className="mr-1.5 animate-spin" />
                  : <Save size={14} className="mr-1.5" />}
                {saveSuccess ? 'Tersimpan!' : 'Simpan'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Dirty banner */}
      {isDirty && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <span>Terdapat perubahan yang belum disimpan</span>
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : <Save size={12} className="mr-1" />}
            Simpan
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-48 gap-2 text-gray-400">
          <Loader2 size={20} className="animate-spin" /> Memuat data...
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex items-center justify-center h-48 text-red-500 text-sm">
          Gagal memuat data. Coba refresh halaman.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && matrix && !hasMappings && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
          <Grid3X3 size={28} className="text-gray-300" />
          <p className="text-sm">Belum ada data CPL atau Profil Lulusan untuk kurikulum ini</p>
        </div>
      )}

      {/* Matrix */}
      {!isLoading && !isError && matrix && hasMappings && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Filter */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Filter CPL:</span>
            {(['', 'SIKAP', 'PENGETAHUAN', 'KETERAMPILAN_UMUM', 'KETERAMPILAN_KHUSUS'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors
                  ${filterCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat === '' ? 'Semua' : CPL_CATEGORY_LABELS[cat as CplCategory]}
              </button>
            ))}
            <span className="ml-auto text-xs text-gray-400">
              {localMappings.size} mapping aktif
            </span>
          </div>

          {/* Scrollable matrix table */}
          <div className="overflow-auto max-h-[70vh]">
            <table className="border-collapse text-sm w-full">
              <thead className="sticky top-0 z-20 bg-white">
                <tr>
                  {/* CPL header — lebar fixed, sisanya dibagi rata ke kolom PL */}
                  <th className="sticky left-0 z-30 bg-gray-50 border-b border-r border-gray-100 px-3 py-2.5 text-left w-[220px] min-w-[180px]">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">CPL</span>
                  </th>
                  {/* PL column headers */}
                  {matrix.graduateProfiles.map((pl) => (
                    <th key={pl.id} className="bg-gray-50 border-b border-r border-gray-100 px-1 py-2.5 text-center min-w-[60px]" title={`${pl.code} – ${pl.name}`}>
                      <span className="font-bold text-gray-700 text-xs">{pl.code}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCpls.map((cpl, idx) => (
                  <tr key={cpl.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    {/* CPL info cell */}
                    <td className="sticky left-0 z-10 border-b border-r border-gray-100 px-2.5 py-2 bg-inherit">
                      <div className="flex items-start gap-1.5">
                        <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${CPL_CATEGORY_COLORS[cpl.category]}`}>
                          {CPL_CATEGORY_LABELS[cpl.category]}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-800 text-xs">{cpl.code}</p>
                          <p className="text-gray-500 text-[11px] leading-snug line-clamp-4 mt-0.5">{cpl.name}</p>
                        </div>
                      </div>
                    </td>
                    {/* Checkbox cells */}
                    {matrix.graduateProfiles.map((pl) => {
                      const checked = localMappings.has(`${cpl.id}:${pl.id}`);
                      return (
                        <td key={pl.id} className="border-b border-r border-gray-100 text-center px-1 py-2">
                          <button
                            onClick={() => toggleCell(cpl.id, pl.id)}
                            className={`w-5 h-5 rounded flex items-center justify-center mx-auto transition-all
                              ${checked
                                ? 'bg-primary text-white shadow-sm'
                                : 'border-2 border-gray-200 hover:border-primary/40 hover:bg-primary/5'}`}
                          >
                            {checked && <span className="text-[10px] font-bold leading-none">✓</span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer summary */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>{filteredCpls.length} CPL × {matrix.graduateProfiles.length} Profil Lulusan</span>
            <span>{localMappings.size} total mapping</span>
          </div>
        </div>
      )}

      {/* Import Drawer */}
      <ImportModal
        open={showImport}
        cpls={matrix?.cpls ?? []}
        graduateProfiles={matrix?.graduateProfiles ?? []}
        onClose={() => setShowImport(false)}
        onConfirm={handleImportConfirm}
      />
    </div>
  );
}
