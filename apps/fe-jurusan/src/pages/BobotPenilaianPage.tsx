import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import {
  Save, Upload, Download, AlertCircle, CheckCircle2, Loader2,
  FileSpreadsheet, ChevronLeft, ChevronRight, CheckSquare, Square,
  BookMarked,
} from 'lucide-react';
import { Button, Drawer } from '@widyatama/ui';
import { useApp } from '@/contexts/AppContext';
import {
  courseService, cpmkCourseMappingService,
  assessmentComponentService, courseCpmkWeightService,
} from '@/services/obe.service';
import type { Course, CpmkMatrixRow, AssessmentComponent, CourseCpmkWeight, WeightEntry, Curriculum } from '@/types';

// ─── helpers ──────────────────────────────────────────────────────────────────

const wKey = (courseId: string, cpmkId: string, componentId: string) =>
  `${courseId}|${cpmkId}|${componentId}`;

// ─── types ────────────────────────────────────────────────────────────────────

interface MatrixRow {
  courseId: string;
  courseCode: string;
  courseName: string;
  cpmkId: string;
  cpmkCode: string;
  cpmkName: string;
}

interface ParsedImportRow {
  rowIdx: number;
  courseCode: string;
  cpmkCode: string;
  courseId?: string;
  cpmkId?: string;
  weights: Record<string, number>; // componentId → weight
  valid: boolean;
  error?: string;
}

// ─── Import Drawer ────────────────────────────────────────────────────────────

interface ImportDrawerProps {
  open: boolean;
  curriculum: Curriculum | null;
  courses: Course[];
  matrixRows: MatrixRow[];
  components: AssessmentComponent[];
  onClose: () => void;
  onConfirm: (newWeights: Record<string, number>) => void;
}

function ImportWeightDrawer({
  open, curriculum, courses, matrixRows, components, onClose, onConfirm,
}: ImportDrawerProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedImportRow[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setStep(1); setRows([]); setFileName(''); }
  }, [open]);

  const handleTemplateDownload = () => {
    const headers = ['Kode MK', 'CPMK', ...components.map((c) => c.code)];
    const data = matrixRows.map((r) => [r.courseCode, r.cpmkCode, ...components.map(() => '')]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    ws['!cols'] = [
      { wch: 12 }, { wch: 10 },
      ...components.map(() => ({ wch: 10 })),
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bobot Penilaian');
    XLSX.writeFile(wb, `template-bobot-penilaian-${curriculum?.code ?? 'export'}.xlsx`);
  };

  const handleFile = (file: File) => {
    setFileName(file.name);

    const courseByCode = new Map(courses.map((c) => [c.code, c]));
    // validPairs: "courseId|cpmkCode" — satu CPMK bisa mapped ke banyak MK
    const validPairs = new Set(matrixRows.map((r) => `${r.courseId}|${r.cpmkCode}`));
    // cpmkId lookup by code (code unik per kurikulum)
    const cpmkIdByCode = new Map(matrixRows.map((r) => [r.cpmkCode, r.cpmkId]));
    const componentByCode = new Map(components.map((c) => [c.code, c]));
    const componentByName = new Map(components.map((c) => [c.name, c]));

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const allRows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' });
        if (allRows.length < 2) { setRows([]); setStep(2); return; }

        const rawHeaders = (allRows[0] as string[]).map((h) => String(h ?? '').trim());
        const compCols = rawHeaders.slice(2)
          .map((header, idx) => ({
            idx: idx + 2,
            header,
            comp: componentByCode.get(header) ?? componentByName.get(header),
          }))
          .filter((c) => c.header.toLowerCase() !== 'total');

        const parsed: ParsedImportRow[] = [];
        for (let i = 1; i < allRows.length; i++) {
          const row = allRows[i] as string[];
          const courseCode = String(row[0] ?? '').trim();
          const cpmkCode = String(row[1] ?? '').trim();
          if (!courseCode && !cpmkCode) continue;

          const course = courseByCode.get(courseCode);
          const cpmkId = cpmkIdByCode.get(cpmkCode);

          let error: string | undefined;
          if (!course) {
            error = `Kode MK "${courseCode}" tidak ditemukan`;
          } else if (!cpmkId) {
            error = `Kode CPMK "${cpmkCode}" tidak ditemukan`;
          } else if (!validPairs.has(`${course.id}|${cpmkCode}`)) {
            error = `CPMK "${cpmkCode}" tidak terpetakan ke MK "${courseCode}"`;
          }

          const weights: Record<string, number> = {};
          if (!error) {
            compCols.forEach(({ idx, comp }) => {
              if (!comp) return;
              const val = parseFloat(String(row[idx] ?? '0'));
              weights[comp.id] = isNaN(val) ? 0 : Math.min(100, Math.max(0, val));
            });
          }

          parsed.push({
            rowIdx: i + 1,
            courseCode,
            cpmkCode,
            courseId: course?.id,
            cpmkId,
            weights,
            valid: !error,
            error,
          });
        }
        setRows(parsed);
        setStep(2);
      } catch { setRows([]); setStep(2); }
    };
    reader.readAsBinaryString(file);
    fileRef.current && (fileRef.current.value = '');
  };

  const validRows = rows.filter((r) => r.valid);
  const invalidRows = rows.filter((r) => !r.valid);

  const handleApply = () => {
    const newWeights: Record<string, number> = {};
    validRows.forEach((r) => {
      Object.entries(r.weights).forEach(([compId, weight]) => {
        if (r.courseId && r.cpmkId) {
          newWeights[wKey(r.courseId, r.cpmkId, compId)] = weight;
        }
      });
    });
    onConfirm(newWeights);
    onClose();
  };

  const footer = (
    <div className="flex items-center justify-between">
      <button
        onClick={() => step === 1 ? onClose() : setStep(1)}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ChevronLeft size={16} /> {step === 1 ? 'Batal' : 'Kembali'}
      </button>
      {step === 2 && (
        <Button disabled={validRows.length === 0} onClick={handleApply}>
          <ChevronRight size={14} className="mr-1" />
          Terapkan {validRows.length} Baris
        </Button>
      )}
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Import Bobot Penilaian CPMK"
      description={`Langkah ${step} dari 2`}
      footer={footer}
      size="lg"
    >
      {/* Step 1: Curriculum check + Upload */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Curriculum indicator */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl">
            <BookMarked size={16} className="text-primary shrink-0" />
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kurikulum Aktif</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">
                {curriculum ? `${curriculum.name} ${curriculum.year}` : '—'}
              </p>
            </div>
            {curriculum && <CheckCircle2 size={16} className="text-green-500 ml-auto shrink-0" />}
          </div>

          {/* Upload zone */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <FileSpreadsheet size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600">{fileName || 'Klik untuk pilih file Excel'}</p>
            <p className="text-xs text-gray-400 mt-1">Format: .xlsx atau .xls</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>

          {/* Format info */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 space-y-1.5">
            <p className="font-semibold">Format Excel:</p>
            <p>• Kolom A: <strong>Kode MK</strong></p>
            <p>• Kolom B: <strong>CPMK</strong></p>
            <p>• Kolom C dst: <strong>Kode Komponen Penilaian</strong> (mis. "KP01", "KP02", "KP03")</p>
            <p>• Isi cell dengan angka bobot (0–100) sesuai komponen</p>
            <p className="text-blue-500 italic">Gunakan tombol Template untuk mengunduh format yang benar</p>
          </div>

          {/* Template download */}
          <button
            onClick={handleTemplateDownload}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Download size={14} /> Download Template Excel
          </button>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Summary badges */}
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
              {validRows.length} baris valid
            </span>
            {invalidRows.length > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
                {invalidRows.length} error
              </span>
            )}
          </div>

          {rows.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">Tidak ada data ditemukan di file</div>
          )}

          {/* Row list */}
          <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden max-h-[55vh] overflow-y-auto">
            {rows.map((r) => (
              <div
                key={r.rowIdx}
                className={`px-4 py-2.5 text-sm ${r.valid ? '' : 'bg-red-50'}`}
              >
                <div className="flex items-center gap-2">
                  {r.valid
                    ? <CheckSquare size={14} className="text-green-500 shrink-0" />
                    : <Square size={14} className="text-red-400 shrink-0" />}
                  <span className="font-medium text-gray-800 font-mono text-xs">{r.courseCode}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium text-gray-800 text-xs">{r.cpmkCode}</span>
                  {r.valid && (
                    <span className="text-gray-400 text-xs ml-1">
                      (total: {(Math.round(Object.values(r.weights).reduce((s, v) => s + v, 0) * 100) / 100)})
                    </span>
                  )}
                </div>
                {r.error && (
                  <p className="text-xs text-red-500 mt-0.5 pl-5">{r.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Drawer>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function BobotPenilaianPage() {
  const { selectedCurriculum } = useApp();
  const curriculumId = selectedCurriculum?.id ?? '';
  const queryClient = useQueryClient();

  const [weights, setWeights] = useState<Record<string, number>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // ─── queries ────────────────────────────────────────────────────────────────

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses', 'bobot', curriculumId],
    queryFn: () => courseService.getAll({ curriculumId, limit: 100, isActive: true }),
    enabled: !!curriculumId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: matrixData, isLoading: matrixLoading } = useQuery({
    queryKey: ['cpmk-course-matrix', 'bobot', curriculumId],
    queryFn: () => cpmkCourseMappingService.getMatrix({ curriculumId }),
    enabled: !!curriculumId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: componentsData, isLoading: componentsLoading } = useQuery({
    queryKey: ['assessment-components', 'bobot'],
    queryFn: () => assessmentComponentService.getAll({ limit: 100, sortBy: 'code', sortOrder: 'asc' }),
    staleTime: 0,
  });

  const { data: existingWeights, isLoading: weightsLoading } = useQuery({
    queryKey: ['course-cpmk-weights', 'all', curriculumId],
    queryFn: () => courseCpmkWeightService.getAll({ curriculumId }),
    enabled: !!curriculumId,
    staleTime: Infinity,
  });

  const isAnyLoading = coursesLoading || matrixLoading || componentsLoading || weightsLoading;

  // ─── derived ─────────────────────────────────────────────────────────────────

  const courses: Course[] = coursesData?.data ?? [];
  const components: AssessmentComponent[] = (componentsData?.data ?? []).filter((c) => c.isActive);

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

  const matrixRows = useMemo((): MatrixRow[] => {
    if (!matrixData?.data || !courseMap.size) return [];
    const seen = new Set<string>();
    const result: MatrixRow[] = [];

    const processRow = (cpmk: CpmkMatrixRow) => {
      cpmk.courseIds.forEach((courseId) => {
        const key = `${courseId}|${cpmk.id}`;
        if (seen.has(key)) return;
        seen.add(key);
        const course = courseMap.get(courseId);
        if (!course) return;
        result.push({
          courseId, courseCode: course.code, courseName: course.name,
          cpmkId: cpmk.id, cpmkCode: cpmk.code, cpmkName: cpmk.name,
        });
      });
    };

    matrixData.data.matrix.forEach((cplRow) => cplRow.cpmks.forEach(processRow));
    matrixData.data.unmappedCpmks.forEach(processRow);

    return result.sort(
      (a, b) => a.courseCode.localeCompare(b.courseCode) || a.cpmkCode.localeCompare(b.cpmkCode),
    );
  }, [matrixData, courseMap]);

  // sync server → local on load
  useEffect(() => {
    if (!existingWeights?.data) return;
    const map: Record<string, number> = {};
    existingWeights.data.forEach((w: CourseCpmkWeight) => {
      map[wKey(w.courseId, w.cpmkId, w.assessmentComponentId)] = w.weight;
    });
    setWeights(map);
    setIsDirty(false);
  }, [existingWeights]);

  // ─── totals ───────────────────────────────────────────────────────────────────

  const rowTotal = useCallback(
    (courseId: string, cpmkId: string) =>
      components.reduce((s, c) => s + (weights[wKey(courseId, cpmkId, c.id)] ?? 0), 0),
    [weights, components],
  );

  const mkTotals = useMemo(() => {
    const map = new Map<string, number>();
    matrixRows.forEach((r) => {
      map.set(r.courseId, (map.get(r.courseId) ?? 0) + rowTotal(r.courseId, r.cpmkId));
    });
    return map;
  }, [matrixRows, rowTotal]);

  const validMkCount = useMemo(
    () => [...mkTotals.values()].filter((t) => Math.abs(t - 100) < 0.01).length,
    [mkTotals],
  );
  const mkCount = mkTotals.size;

  // ─── handlers ─────────────────────────────────────────────────────────────────

  const handleCellChange = (courseId: string, cpmkId: string, componentId: string, raw: string) => {
    const parsed = parseFloat(raw);
    const val = isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
    setWeights((prev) => ({ ...prev, [wKey(courseId, cpmkId, componentId)]: val }));
    setIsDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const byCourse = new Map<string, WeightEntry[]>();
      matrixRows.forEach((r) => { if (!byCourse.has(r.courseId)) byCourse.set(r.courseId, []); });
      Object.entries(weights).forEach(([key, weight]) => {
        if (weight <= 0) return;
        const [courseId, cpmkId, assessmentComponentId] = key.split('|');
        const list = byCourse.get(courseId);
        if (list) list.push({ cpmkId, assessmentComponentId, weight });
      });
      await Promise.all(
        [...byCourse.entries()].map(([courseId, wlist]) =>
          courseCpmkWeightService.bulkSave({ courseId, weights: wlist }),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-cpmk-weights', 'all', curriculumId] });
      setIsDirty(false);
    },
  });

  const handleExport = () => {
    const headers = ['Kode MK', 'CPMK', ...components.map((c) => c.code), 'Total'];
    const rows = matrixRows.map((r) => [
      r.courseCode, r.cpmkCode,
      ...components.map((c) => weights[wKey(r.courseId, r.cpmkId, c.id)] ?? 0),
      rowTotal(r.courseId, r.cpmkId),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      { wch: 12 }, { wch: 10 },
      ...components.map(() => ({ wch: 10 })),
      { wch: 8 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bobot Penilaian CPMK');
    XLSX.writeFile(wb, `bobot-penilaian-${selectedCurriculum?.code ?? 'export'}.xlsx`);
  };

  const handleImportConfirm = (newWeights: Record<string, number>) => {
    setWeights((prev) => ({ ...prev, ...newWeights }));
    setIsDirty(true);
  };

  // ─── render helpers ───────────────────────────────────────────────────────────

  const mkStatusStyle = (courseId: string) => {
    const t = mkTotals.get(courseId) ?? 0;
    if (Math.abs(t - 100) < 0.01) return 'text-green-700 font-bold';
    if (t > 0) return 'text-red-600 font-semibold';
    return 'text-gray-400';
  };

  const mkCodeCellBg = (courseId: string) => {
    const t = mkTotals.get(courseId) ?? 0;
    if (Math.abs(t - 100) < 0.01) return 'bg-green-50';
    if (t > 0) return 'bg-red-50';
    return 'bg-white';
  };

  const fmtWeight = (v: number) => {
    const r = Math.round(v * 100) / 100;
    return r === Math.floor(r) ? String(r) : r.toFixed(2).replace(/\.?0+$/, '');
  };

  // ─── render ───────────────────────────────────────────────────────────────────

  if (!curriculumId) {
    return (
      <div className="flex flex-col items-center justify-center h-72 text-center gap-3">
        <AlertCircle size={36} className="text-gray-300" />
        <p className="text-gray-500 font-medium">Pilih kurikulum terlebih dahulu</p>
        <p className="text-xs text-gray-400">Gunakan dropdown kurikulum di header untuk memilih kurikulum aktif</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bobot Penilaian CPMK</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {selectedCurriculum?.name} · {selectedCurriculum?.year}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload size={14} /> Import
          </button>
          <button
            onClick={handleExport}
            disabled={matrixRows.length === 0 || isAnyLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={14} /> Export
          </button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!isDirty || saveMutation.isPending}
          >
            {saveMutation.isPending
              ? <Loader2 size={14} className="mr-1.5 animate-spin" />
              : <Save size={14} className="mr-1.5" />}
            {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </div>

      {/* ── Dirty banner ── */}
      {isDirty && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <span>Terdapat perubahan yang belum disimpan</span>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : <Save size={12} className="mr-1" />}
            Simpan
          </Button>
        </div>
      )}

      {/* ── Status bar ── */}
      {!isAnyLoading && mkCount > 0 && (
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${
          validMkCount === mkCount
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          {validMkCount === mkCount ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>
            <strong>{validMkCount}</strong> dari <strong>{mkCount}</strong> mata kuliah memiliki total bobot = 100%
          </span>
        </div>
      )}

      {/* ── Matrix table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isAnyLoading ? (
          <div className="flex items-center justify-center gap-2 h-48 text-gray-400 text-sm">
            <Loader2 size={18} className="animate-spin" /> Memuat data...
          </div>
        ) : components.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-1">
            <AlertCircle size={24} className="text-gray-300 mb-1" />
            <p className="text-sm font-medium">Belum ada komponen penilaian</p>
            <p className="text-xs">Tambahkan komponen di menu <strong>Komponen Penilaian</strong> terlebih dahulu</p>
          </div>
        ) : matrixRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-1">
            <AlertCircle size={24} className="text-gray-300 mb-1" />
            <p className="text-sm font-medium">Belum ada CPMK yang terpetakan ke mata kuliah</p>
            <p className="text-xs">Lakukan <strong>Mapping CPL–CPMK–MK</strong> terlebih dahulu</p>
          </div>
        ) : (
          <div className="overflow-auto max-h-[70vh]">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="bg-[#FFD700] text-gray-800">
                  <th className="border border-gray-300 px-3 py-2.5 text-left font-semibold whitespace-nowrap sticky left-0 bg-[#FFD700] z-30 min-w-[100px]">
                    Kode MK
                  </th>
                  <th className="border border-gray-300 px-3 py-2.5 text-center font-semibold min-w-[90px]">
                    CPMK
                  </th>
                  {components.map((c) => (
                    <th
                      key={c.id}
                      className="border border-gray-300 px-2 py-2.5 text-center font-semibold min-w-[90px] max-w-[130px]"
                      title={c.name}
                    >
                      <div className="text-xs leading-tight whitespace-normal text-center">{c.name}</div>
                    </th>
                  ))}
                  <th className="border border-gray-300 px-3 py-2.5 text-center font-semibold min-w-[70px] bg-[#FFC000]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((row, idx) => {
                  const rt = rowTotal(row.courseId, row.cpmkId);
                  const prevCourseId = idx > 0 ? matrixRows[idx - 1].courseId : null;
                  const isFirstOfMk = row.courseId !== prevCourseId;

                  return (
                    <tr
                      key={`${row.courseId}|${row.cpmkId}`}
                      className={`border-b border-gray-200 hover:bg-blue-50/30 transition-colors ${
                        isFirstOfMk && idx > 0 ? 'border-t-2 border-t-gray-300' : ''
                      }`}
                    >
                      <td className={`border border-gray-200 px-3 py-2 font-mono font-semibold text-xs sticky left-0 z-10 ${mkCodeCellBg(row.courseId)}`}>
                        <div>{row.courseCode}</div>
                        <div className="text-[10px] text-gray-500 font-normal truncate max-w-[90px]" title={row.courseName}>
                          {row.courseName}
                        </div>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                          {row.cpmkCode}
                        </span>
                      </td>
                      {components.map((comp) => (
                        <td key={comp.id} className="border border-gray-200 px-1.5 py-1.5 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={weights[wKey(row.courseId, row.cpmkId, comp.id)] ?? 0}
                            onChange={(e) => handleCellChange(row.courseId, row.cpmkId, comp.id, e.target.value)}
                            className="w-16 text-center border border-gray-200 rounded px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary hover:border-gray-400 transition-colors bg-transparent"
                          />
                        </td>
                      ))}
                      <td className={`border border-gray-200 px-3 py-2 text-center font-semibold text-sm ${rt > 0 ? mkStatusStyle(row.courseId) : 'text-gray-400'}`}>
                        {rt > 0 ? fmtWeight(rt) : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        {!isAnyLoading && matrixRows.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>{matrixRows.length} baris (MK × CPMK) · {components.length} komponen</span>
            <span>{mkCount} mata kuliah</span>
          </div>
        )}
      </div>

      {/* ── Import Drawer ── */}
      <ImportWeightDrawer
        open={importOpen}
        curriculum={selectedCurriculum}
        courses={courses}
        matrixRows={matrixRows}
        components={components}
        onClose={() => setImportOpen(false)}
        onConfirm={handleImportConfirm}
      />
    </div>
  );
}
