import { useState, useMemo, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button, Drawer } from '@widyatama/ui';
import { useApp } from '@/contexts/AppContext';
import { cplBkMappingService } from '@/services/obe.service';
import type { CplSummary, BkSummary, CplCategory, CplBkMappingPair } from '@/types';
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
  bkId: string;
  bkCode: string;
  cplId: string;
  cplCode: string;
  valid: boolean;
  error?: string;
}

interface ImportModalProps {
  open: boolean;
  cpls: CplSummary[];
  bodyOfKnowledges: BkSummary[];
  onClose: () => void;
  onConfirm: (mappings: CplBkMappingPair[]) => void;
}

function ImportModal({ open, cpls, bodyOfKnowledges, onClose, onConfirm }: ImportModalProps) {
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
      // Column 0 = kode BK, columns 1+ = CPL codes (e.g. "CPL01", "CPL02")
      const cplColumns: { index: number; code: string; cpl: CplSummary | undefined }[] = [];
      for (let i = 1; i < header.length; i++) {
        const cplCode = String(header[i] ?? '').trim();
        if (!cplCode) continue;
        const cpl = cpls.find((c) => c.code === cplCode);
        cplColumns.push({ index: i, code: cplCode, cpl });
      }

      const parsed: ImportResult[] = [];

      for (let r = 1; r < rows.length; r++) {
        const row = rows[r] as string[];
        const bkCode = String(row[0] ?? '').trim();
        if (!bkCode) continue;

        const bk = bodyOfKnowledges.find((b) => b.code === bkCode);

        for (const col of cplColumns) {
          const cellVal = String(row[col.index] ?? '').trim();
          const isChecked = ['1', 'v', 'y', 'yes', '✓', 'x', 'ya', 'true'].includes(cellVal.toLowerCase());
          if (!isChecked) continue;

          if (!bk) {
            parsed.push({ bkId: '', bkCode, cplId: '', cplCode: col.code, valid: false, error: `BK "${bkCode}" tidak ditemukan` });
            continue;
          }
          if (!col.cpl) {
            parsed.push({ bkId: bk.id, bkCode, cplId: '', cplCode: col.code, valid: false, error: `CPL "${col.code}" tidak ditemukan` });
            continue;
          }
          parsed.push({ bkId: bk.id, bkCode, cplId: col.cpl.id, cplCode: col.code, valid: true });
        }
      }

      setResults(parsed);
      setStep(2);
    };
    reader.readAsBinaryString(file);
  };

  const validMappings = results
    .filter((r) => r.valid)
    .map((r) => ({ cplId: r.cplId, bodyOfKnowledgeId: r.bkId }));

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
      title="Import Mapping CPL – Bahan Kajian"
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
            <p>• Kolom A: Kode BK (header: "kode BK")</p>
            <p>• Kolom B dst: Kode CPL sebagai header (misal "CPL01", "CPL02")</p>
            <p>• Isi cell dengan "v", "1", atau "✓" jika BK dipetakan ke CPL tersebut</p>
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
                  <span className="font-medium text-gray-700">{r.bkCode}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-gray-700">{r.cplCode}</span>
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

export default function MappingCplBkPage() {
  const { selectedCurriculum } = useApp();

  const curriculumId   = selectedCurriculum?.id ?? null;
  const curriculumYear = selectedCurriculum?.year ?? null;

  // Local mapping state: Set of "bodyOfKnowledgeId:cplId" (BK first)
  const [localMappings, setLocalMappings]   = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty]               = useState(false);
  const [filterCategory, setFilterCategory] = useState<CplCategory | ''>('');
  const [showImport, setShowImport]         = useState(false);
  const [saveSuccess, setSaveSuccess]       = useState(false);

  // ─── Data ──────────────────────────────────────────────────────────────────────

  const { data: matrixResp, isLoading, isError } = useQuery({
    queryKey: ['cpl-bk-matrix', curriculumId, curriculumYear],
    queryFn: () => cplBkMappingService.getMatrix({
      curriculumId: curriculumId!,
      curriculumYear: curriculumYear ?? undefined,
    }),
    enabled: !!curriculumId,
  });

  useEffect(() => {
    if (!matrixResp?.data) return;
    const initial = new Set(matrixResp.data.mappings.map((m) => `${m.bodyOfKnowledgeId}:${m.cplId}`));
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
    mutationFn: (mappings: CplBkMappingPair[]) =>
      cplBkMappingService.saveMappings({ curriculumId: curriculumId!, mappings }),
    onSuccess: () => {
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    },
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────────

  const toggleCell = (bkId: string, cplId: string) => {
    const key = `${bkId}:${cplId}`;
    setLocalMappings((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    setIsDirty(true);
  };

  const handleSave = () => {
    const mappings: CplBkMappingPair[] = [];
    localMappings.forEach((key) => {
      const [bodyOfKnowledgeId, cplId] = key.split(':');
      mappings.push({ cplId, bodyOfKnowledgeId });
    });
    saveMutation.mutate(mappings);
  };

  const handleImportConfirm = (mappings: CplBkMappingPair[]) => {
    const next = new Set(mappings.map((m) => `${m.bodyOfKnowledgeId}:${m.cplId}`));
    setLocalMappings(next);
    setIsDirty(true);
  };

  const handleExport = () => {
    if (!matrix) return;
    const header = ['kode BK', ...filteredCpls.map((c) => c.code)];
    const rows = matrix.bodyOfKnowledges.map((bk) => [
      bk.code,
      ...filteredCpls.map((cpl) => (localMappings.has(`${bk.id}:${cpl.id}`) ? 'v' : '')),
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws['!cols'] = [{ wch: 12 }, ...filteredCpls.map(() => ({ wch: 8 }))];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mapping CPL-BK');
    XLSX.writeFile(wb, `mapping-cpl-bk-${curriculumYear ?? 'all'}.xlsx`);
  };

  const handleDownloadTemplate = () => {
    if (!matrix) return;
    const header = ['kode BK', ...matrix.cpls.map((c) => c.code)];
    const rows = matrix.bodyOfKnowledges.map((bk) => [bk.code, ...matrix.cpls.map(() => '')]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws['!cols'] = [{ wch: 12 }, ...matrix.cpls.map(() => ({ wch: 8 }))];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Mapping CPL-BK');
    XLSX.writeFile(wb, 'template-mapping-cpl-bk.xlsx');
  };

  // ─── Render ────────────────────────────────────────────────────────────────────

  if (!curriculumId) {
    return (
      <div className="flex flex-col items-center justify-center h-72 text-center gap-3">
        <Grid3X3 size={36} className="text-gray-300" />
        <p className="text-gray-500 font-medium">Pilih kurikulum terlebih dahulu</p>
        <p className="text-xs text-gray-400">Gunakan dropdown kurikulum di header untuk memilih kurikulum aktif</p>
      </div>
    );
  }

  const hasMappings = matrix && (matrix.cpls.length > 0 || matrix.bodyOfKnowledges.length > 0);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mapping CPL – Bahan Kajian</h1>
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
          <p className="text-sm">Belum ada data CPL atau Bahan Kajian untuk kurikulum ini</p>
        </div>
      )}

      {/* Matrix */}
      {!isLoading && !isError && matrix && hasMappings && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Filter CPL columns by category */}
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

          {/* Scrollable matrix table — Rows = BK, Columns = CPL */}
          <div className="overflow-auto max-h-[70vh]">
            <table className="border-collapse text-sm w-full">
              <thead className="sticky top-0 z-20 bg-white">
                <tr>
                  {/* BK header (sticky left column) */}
                  <th className="sticky left-0 z-30 bg-gray-50 border-b border-r border-gray-100 px-3 py-2.5 text-left w-[200px] min-w-[160px]">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bahan Kajian</span>
                  </th>
                  {/* CPL column headers */}
                  {filteredCpls.map((cpl) => (
                    <th
                      key={cpl.id}
                      className="bg-gray-50 border-b border-r border-gray-100 px-1 py-2 text-center min-w-[52px]"
                      title={`${cpl.code} – ${cpl.name}`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${CPL_CATEGORY_COLORS[cpl.category]}`}>
                          {CPL_CATEGORY_LABELS[cpl.category]}
                        </span>
                        <span className="font-bold text-gray-700 text-[11px]">{cpl.code}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.bodyOfKnowledges.map((bk, idx) => (
                  <tr key={bk.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    {/* BK info cell (sticky left) */}
                    <td className="sticky left-0 z-10 border-b border-r border-gray-100 px-2.5 py-2 bg-inherit">
                      <div title={`${bk.code} – ${bk.name}`}>
                        <p className="font-semibold text-gray-800 text-xs">{bk.code}</p>
                        <p className="text-gray-500 text-[11px] leading-snug line-clamp-2 mt-0.5">{bk.name}</p>
                      </div>
                    </td>
                    {/* Checkbox cells */}
                    {filteredCpls.map((cpl) => {
                      const checked = localMappings.has(`${bk.id}:${cpl.id}`);
                      return (
                        <td key={cpl.id} className="border-b border-r border-gray-100 text-center px-1 py-2">
                          <button
                            onClick={() => toggleCell(bk.id, cpl.id)}
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
            <span>{matrix.bodyOfKnowledges.length} Bahan Kajian × {filteredCpls.length} CPL</span>
            <span>{localMappings.size} total mapping</span>
          </div>
        </div>
      )}

      {/* Import Drawer */}
      <ImportModal
        open={showImport}
        cpls={matrix?.cpls ?? []}
        bodyOfKnowledges={matrix?.bodyOfKnowledges ?? []}
        onClose={() => setShowImport(false)}
        onConfirm={handleImportConfirm}
      />
    </div>
  );
}
