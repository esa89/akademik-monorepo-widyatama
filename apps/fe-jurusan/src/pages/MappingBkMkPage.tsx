import { useState, useMemo, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button, Drawer } from '@widyatama/ui';
import { useApp } from '@/contexts/AppContext';
import { bkCourseMappingService, courseService } from '@/services/obe.service';
import type { BkSummary, BkCourseMappingPair, Course } from '@/types';
import {
  Save, Download, Upload, FileSpreadsheet,
  ChevronLeft, ChevronRight, Loader2, Grid3X3,
  CheckSquare, Square, Search,
} from 'lucide-react';

// ─── Import Modal ────────────────────────────────────────────────────────────────

interface ImportResult {
  courseId: string;
  courseCode: string;
  bkId: string;
  bkCode: string;
  valid: boolean;
  error?: string;
}

interface ImportModalProps {
  open: boolean;
  courses: Course[];
  bodyOfKnowledges: BkSummary[];
  onClose: () => void;
  onConfirm: (mappings: BkCourseMappingPair[]) => void;
}

function ImportModal({ open, courses, bodyOfKnowledges, onClose, onConfirm }: ImportModalProps) {
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

      if (rows.length < 2) { setResults([]); setStep(2); return; }

      const header = rows[0] as string[];
      // Col 0 = kode MK, Col 1+ = kode BK
      const bkColumns: { index: number; code: string; bk: BkSummary | undefined }[] = [];
      for (let i = 1; i < header.length; i++) {
        const bkCode = String(header[i] ?? '').trim();
        if (!bkCode) continue;
        const bk = bodyOfKnowledges.find((b) => b.code === bkCode);
        bkColumns.push({ index: i, code: bkCode, bk });
      }

      const parsed: ImportResult[] = [];

      for (let r = 1; r < rows.length; r++) {
        const row = rows[r] as string[];
        const courseCode = String(row[0] ?? '').trim();
        if (!courseCode) continue;

        const course = courses.find((c) => c.code === courseCode);

        for (const col of bkColumns) {
          const cellVal = String(row[col.index] ?? '').trim();
          const isChecked = ['1', 'v', 'y', 'yes', '✓', 'x', 'ya', 'true'].includes(cellVal.toLowerCase());
          if (!isChecked) continue;

          if (!course) {
            parsed.push({ courseId: '', courseCode, bkId: '', bkCode: col.code, valid: false, error: `MK "${courseCode}" tidak ditemukan` });
            continue;
          }
          if (!col.bk) {
            parsed.push({ courseId: course.id, courseCode, bkId: '', bkCode: col.code, valid: false, error: `BK "${col.code}" tidak ditemukan` });
            continue;
          }
          parsed.push({ courseId: course.id, courseCode, bkId: col.bk.id, bkCode: col.code, valid: true });
        }
      }

      setResults(parsed);
      setStep(2);
    };
    reader.readAsBinaryString(file);
  };

  const validMappings = results
    .filter((r) => r.valid)
    .map((r) => ({ bodyOfKnowledgeId: r.bkId, courseId: r.courseId }));

  const footer = (
    <div className="flex items-center justify-between">
      <button
        onClick={() => step === 1 ? onClose() : setStep(1)}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ChevronLeft size={16} /> {step === 1 ? 'Batal' : 'Kembali'}
      </button>
      {step === 2 && (
        <Button disabled={validMappings.length === 0} onClick={() => { onConfirm(validMappings); onClose(); }}>
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
      title="Import Mapping MK – Bahan Kajian"
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
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Format Excel:</p>
            <p>• Kolom A: Kode MK (header: "kode MK")</p>
            <p>• Kolom B dst: Kode BK sebagai header (misal "BK01", "BK02")</p>
            <p>• Isi cell dengan "v", "1", atau "✓" jika MK dipetakan ke BK tersebut</p>
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
                  <span className="font-medium text-gray-700">{r.courseCode}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-gray-700">{r.bkCode}</span>
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

export default function MappingBkMkPage() {
  const { selectedCurriculum } = useApp();

  const curriculumId = selectedCurriculum?.id ?? null;

  const [localMappings, setLocalMappings] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty]             = useState(false);
  const [searchBk, setSearchBk]           = useState('');
  const [showImport, setShowImport]       = useState(false);
  const [saveSuccess, setSaveSuccess]     = useState(false);

  // ─── Queries ───────────────────────────────────────────────────────────────────

  const { data: matrixResp, isLoading: loadingMatrix, isError } = useQuery({
    queryKey: ['bk-course-matrix', curriculumId],
    queryFn: () => bkCourseMappingService.getMatrix({ curriculumId: curriculumId! }),
    enabled: !!curriculumId,
  });

  const { data: coursesResp, isLoading: loadingCourses } = useQuery({
    queryKey: ['courses-all', curriculumId],
    queryFn: () => courseService.getAll({
      curriculumId: curriculumId ?? undefined,
      limit: 100,
      sortBy: 'code',
      sortOrder: 'asc',
    }),
    enabled: !!curriculumId,
  });

  const isLoading = loadingMatrix || loadingCourses;

  useEffect(() => {
    if (!matrixResp?.data) return;
    const initial = new Set(matrixResp.data.mappings.map((m) => `${m.courseId}:${m.bodyOfKnowledgeId}`));
    setLocalMappings(initial);
    setIsDirty(false);
  }, [matrixResp]);

  const bodyOfKnowledges: BkSummary[] = matrixResp?.data?.bodyOfKnowledges ?? [];
  const courses: Course[]             = coursesResp?.data ?? [];

  const filteredBks = useMemo(() => {
    if (!searchBk.trim()) return bodyOfKnowledges;
    const q = searchBk.toLowerCase();
    return bodyOfKnowledges.filter((b) => b.code.toLowerCase().includes(q) || b.name.toLowerCase().includes(q));
  }, [bodyOfKnowledges, searchBk]);

  // ─── Mutation ──────────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: (mappings: BkCourseMappingPair[]) =>
      bkCourseMappingService.saveMappings({ curriculumId: curriculumId!, mappings }),
    onSuccess: () => {
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    },
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────────

  const toggleCell = (courseId: string, bkId: string) => {
    const key = `${courseId}:${bkId}`;
    setLocalMappings((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    setIsDirty(true);
  };

  const handleSave = () => {
    const mappings: BkCourseMappingPair[] = [];
    localMappings.forEach((key) => {
      const [courseId, bodyOfKnowledgeId] = key.split(':');
      mappings.push({ courseId, bodyOfKnowledgeId });
    });
    saveMutation.mutate(mappings);
  };

  const handleImportConfirm = (mappings: BkCourseMappingPair[]) => {
    const next = new Set(mappings.map((m) => `${m.courseId}:${m.bodyOfKnowledgeId}`));
    setLocalMappings(next);
    setIsDirty(true);
  };

  const handleExport = () => {
    const header = ['kode MK', ...filteredBks.map((b) => b.code)];
    const rows = courses.map((c) => [
      c.code,
      ...filteredBks.map((b) => (localMappings.has(`${c.id}:${b.id}`) ? 'v' : '')),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws['!cols'] = [{ wch: 14 }, ...filteredBks.map(() => ({ wch: 8 }))];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mapping MK-BK');
    XLSX.writeFile(wb, `mapping-mk-bk-${selectedCurriculum?.year ?? 'all'}.xlsx`);
  };

  const handleDownloadTemplate = () => {
    const header = ['kode MK', ...bodyOfKnowledges.map((b) => b.code)];
    const rows = courses.map((c) => [c.code, ...bodyOfKnowledges.map(() => '')]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws['!cols'] = [{ wch: 14 }, ...bodyOfKnowledges.map(() => ({ wch: 8 }))];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template MK-BK');
    XLSX.writeFile(wb, 'template-mapping-mk-bk.xlsx');
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

  const hasData = courses.length > 0 || bodyOfKnowledges.length > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mapping MK – Bahan Kajian</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {selectedCurriculum?.name} · {selectedCurriculum?.year}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!isLoading && hasData && (
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
              <Button onClick={handleSave} disabled={!isDirty || saveMutation.isPending}>
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

      {isLoading && (
        <div className="flex items-center justify-center h-48 gap-2 text-gray-400">
          <Loader2 size={20} className="animate-spin" /> Memuat data...
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-center h-48 text-red-500 text-sm">
          Gagal memuat data. Coba refresh halaman.
        </div>
      )}

      {!isLoading && !isError && !hasData && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
          <Grid3X3 size={28} className="text-gray-300" />
          <p className="text-sm">Belum ada data Mata Kuliah atau Bahan Kajian untuk kurikulum ini</p>
        </div>
      )}

      {/* Matrix */}
      {!isLoading && !isError && hasData && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Filter bar */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide shrink-0">Filter BK:</span>
            <div className="relative max-w-xs">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchBk}
                onChange={(e) => setSearchBk(e.target.value)}
                placeholder="Cari kode / nama BK..."
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 w-56"
              />
            </div>
            <span className="ml-auto text-xs text-gray-400">{localMappings.size} mapping aktif</span>
          </div>

          {/* Matrix table */}
          <div className="overflow-auto max-h-[70vh]">
            <table className="border-collapse text-sm w-full">
              <thead className="sticky top-0 z-20 bg-white">
                <tr>
                  {/* MK header */}
                  <th className="sticky left-0 z-30 bg-gray-50 border-b border-r border-gray-100 px-3 py-2.5 text-left w-[220px] min-w-[180px]">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mata Kuliah</span>
                  </th>
                  {/* BK column headers */}
                  {filteredBks.map((bk) => (
                    <th
                      key={bk.id}
                      className="bg-gray-50 border-b border-r border-gray-100 px-1 py-2.5 text-center min-w-[60px]"
                      title={`${bk.code} – ${bk.name}`}
                    >
                      <span className="font-bold text-gray-700 text-xs">{bk.code}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courses.map((course, idx) => (
                  <tr key={course.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    {/* MK info cell */}
                    <td
                      className="sticky left-0 z-10 border-b border-r border-gray-100 px-3 py-2 bg-inherit"
                      title={`${course.code} – ${course.name}`}
                    >
                      <div>
                        <p className="font-semibold text-gray-800 text-xs">{course.code}</p>
                        <p className="text-gray-500 text-[11px] leading-snug line-clamp-2 mt-0.5">{course.name}</p>
                      </div>
                    </td>
                    {/* Checkbox cells */}
                    {filteredBks.map((bk) => {
                      const checked = localMappings.has(`${course.id}:${bk.id}`);
                      return (
                        <td key={bk.id} className="border-b border-r border-gray-100 text-center px-1 py-2">
                          <button
                            onClick={() => toggleCell(course.id, bk.id)}
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

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>{courses.length} Mata Kuliah × {filteredBks.length} Bahan Kajian</span>
            <span>{localMappings.size} total mapping</span>
          </div>
        </div>
      )}

      {/* Import Drawer */}
      <ImportModal
        open={showImport}
        courses={courses}
        bodyOfKnowledges={bodyOfKnowledges}
        onClose={() => setShowImport(false)}
        onConfirm={handleImportConfirm}
      />
    </div>
  );
}
