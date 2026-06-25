import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Info, LayoutList, Download, ClipboardList, Copy, Check } from "lucide-react";
import { academicClassService, courseService } from "@/services/academic.service";
import { courseCpmkWeightService, studentCpmkScoreService, cplCpmkMappingService } from "@/services/obe.service";
import type { ClassStudent, CourseCpmkWeight, StudentCpmkScore, ScoreEntry, CplInfo } from "@/types";

// ── Helpers ────────────────────────────────────────────────
function sKey(studentId: string, cpmkId: string, componentId: string) {
  return `${studentId}|${cpmkId}|${componentId}`;
}

function getGrade(score: number): string {
  if (score >= 85) return "A";
  if (score >= 80) return "A-";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "B-";
  if (score >= 60) return "C+";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "E";
}

function gradeColor(grade: string): string {
  switch (grade) {
    case "A":  return "text-green-700 font-bold";
    case "A-": return "text-green-600 font-bold";
    case "B+": return "text-blue-700 font-bold";
    case "B":  return "text-blue-600 font-semibold";
    case "B-": return "text-blue-500 font-semibold";
    case "C+": return "text-yellow-600 font-semibold";
    case "C":  return "text-yellow-500 font-semibold";
    case "D":  return "text-orange-500 font-semibold";
    default:   return "text-red-500 font-semibold";
  }
}

function gradeChipColor(grade: string): string {
  switch (grade) {
    case "A":  return "bg-green-100 text-green-800 border-green-200";
    case "A-": return "bg-green-50 text-green-700 border-green-200";
    case "B+": return "bg-blue-100 text-blue-800 border-blue-200";
    case "B":  return "bg-blue-50 text-blue-700 border-blue-100";
    case "B-": return "bg-indigo-50 text-indigo-600 border-indigo-100";
    case "C+": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "C":  return "bg-yellow-50 text-yellow-600 border-yellow-100";
    case "D":  return "bg-orange-100 text-orange-700 border-orange-200";
    default:   return "bg-red-100 text-red-700 border-red-200";
  }
}

// ── Types ──────────────────────────────────────────────────
type CpmkGroup = {
  cpmkId: string;
  cpmkCode: string;
  cpmkName: string;
  components: {
    componentId: string;
    componentCode: string;
    componentName: string;
    weight: number;
  }[];
};

// Component aggregated across CPMKs (for conversion)
type ConversionComponent = {
  componentId: string;
  componentCode: string;
  componentName: string;
  totalWeight: number;
};

// ── Build helpers ──────────────────────────────────────────
function buildCpmkGroups(weights: CourseCpmkWeight[]): CpmkGroup[] {
  const map = new Map<string, CpmkGroup>();
  for (const w of weights) {
    if (!map.has(w.cpmkId)) {
      map.set(w.cpmkId, {
        cpmkId: w.cpmkId,
        cpmkCode: w.cpmk.code,
        cpmkName: w.cpmk.name,
        components: [],
      });
    }
    map.get(w.cpmkId)!.components.push({
      componentId: w.assessmentComponentId,
      componentCode: w.assessmentComponent.code,
      componentName: w.assessmentComponent.name,
      weight: w.weight,
    });
  }
  return Array.from(map.values());
}

// Sum weights of same component across all CPMKs → recommended bobot for old system
function buildConversionComponents(groups: CpmkGroup[]): ConversionComponent[] {
  const map = new Map<string, ConversionComponent>();
  for (const g of groups) {
    for (const c of g.components) {
      if (!map.has(c.componentId)) {
        map.set(c.componentId, {
          componentId: c.componentId,
          componentCode: c.componentCode,
          componentName: c.componentName,
          totalWeight: 0,
        });
      }
      map.get(c.componentId)!.totalWeight += c.weight;
    }
  }
  return Array.from(map.values());
}

// Normalized score for old system:
// = weighted contribution across CPMKs / (totalWeight/100)
function calcComponentScore(
  studentId: string,
  componentId: string,
  groups: CpmkGroup[],
  scores: Record<string, number>,
  totalWeight: number
): number {
  if (totalWeight === 0) return 0;
  let weightedSum = 0;
  for (const g of groups) {
    const comp = g.components.find((c) => c.componentId === componentId);
    if (comp) {
      weightedSum += (scores[sKey(studentId, g.cpmkId, componentId)] ?? 0) * (comp.weight / 100);
    }
  }
  return weightedSum / (totalWeight / 100);
}

function buildCplMap(
  cpmkId: string,
  cpls: CplInfo[],
  mappings: { cpmkId: string; cplId: string }[]
): CplInfo[] {
  const cplIds = mappings.filter((m) => m.cpmkId === cpmkId).map((m) => m.cplId);
  return cpls.filter((c) => cplIds.includes(c.id));
}

function buildInitialScores(existing: StudentCpmkScore[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const s of existing) {
    map[sKey(s.studentId, s.cpmkId, s.assessmentComponentId)] = s.score;
  }
  return map;
}

function calcCpmkTotal(studentId: string, group: CpmkGroup, scores: Record<string, number>): number {
  let total = 0;
  for (const comp of group.components) {
    total += (scores[sKey(studentId, group.cpmkId, comp.componentId)] ?? 0) * (comp.weight / 100);
  }
  return total;
}

function calcFinalScore(studentId: string, groups: CpmkGroup[], scores: Record<string, number>): number {
  return groups.reduce((sum, g) => sum + calcCpmkTotal(studentId, g, scores), 0);
}

function isAllCpmkComplete(studentId: string, groups: CpmkGroup[], scores: Record<string, number>): boolean {
  return groups.every((g) =>
    g.components.every((c) => sKey(studentId, g.cpmkId, c.componentId) in scores)
  );
}

// ── Constants ──────────────────────────────────────────────
const GRADE_LEGEND = [
  { grade: "A",  range: "≥ 85",    color: "bg-green-100 text-green-800",   mutu: 4.0 },
  { grade: "A-", range: "80 – 84", color: "bg-green-50 text-green-700",    mutu: 3.7 },
  { grade: "B+", range: "75 – 79", color: "bg-blue-100 text-blue-800",     mutu: 3.3 },
  { grade: "B",  range: "70 – 74", color: "bg-blue-50 text-blue-700",      mutu: 3.0 },
  { grade: "B-", range: "65 – 69", color: "bg-indigo-50 text-indigo-600",  mutu: 2.7 },
  { grade: "C+", range: "60 – 64", color: "bg-yellow-100 text-yellow-700", mutu: 2.3 },
  { grade: "C",  range: "55 – 59", color: "bg-yellow-50 text-yellow-600",  mutu: 2.0 },
  { grade: "D",  range: "40 – 54", color: "bg-orange-100 text-orange-700", mutu: 1.0 },
  { grade: "E",  range: "0 – 39",  color: "bg-red-100 text-red-600",       mutu: 0.0 },
];

const RINGKASAN_IDX = 9999;
const REKAP_IDX     = 9998;

const SIAKAD_CATS = ['UTS', 'UAS', 'Kuis', 'Tugas'] as const;
type SiakadCat = typeof SIAKAD_CATS[number];

const SIAKAD_CHIP: Record<SiakadCat, string> = {
  UTS:   'bg-blue-100 text-blue-700 border-blue-200',
  UAS:   'bg-purple-100 text-purple-700 border-purple-200',
  Kuis:  'bg-amber-100 text-amber-700 border-amber-200',
  Tugas: 'bg-teal-100 text-teal-700 border-teal-200',
};

// ── Main Component ─────────────────────────────────────────
export default function InputNilaiCpmkPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [scores, setScores] = useState<Record<string, number>>({});
  const [activeCpmkIdx, setActiveCpmkIdx] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showKonversi, setShowKonversi] = useState(false);
  const [copied, setCopied] = useState(false);
  const [siakadMapping, setSiakadMapping] = useState<Record<string, SiakadCat | ''>>({});
  const scoresInitialized = useRef(false);

  // ── Queries ──────────────────────────────────────────────
  const { data: classDetail, isLoading: classLoading } = useQuery({
    queryKey: ["class-detail", classId],
    queryFn: () => academicClassService.getById(classId!),
    enabled: !!classId,
  });
  const cls = classDetail?.data;

  const { data: courseDetail } = useQuery({
    queryKey: ["course-detail", cls?.course.id],
    queryFn: () => courseService.getById(cls!.course.id),
    enabled: !!cls?.course.id,
  });
  const curriculumId = courseDetail?.data?.curriculumId;

  const { data: weightsData, isLoading: weightsLoading } = useQuery({
    queryKey: ["weights", cls?.course.id],
    queryFn: () => courseCpmkWeightService.getByCourse(cls!.course.id),
    enabled: !!cls?.course.id,
  });

  const { data: cplMappingData } = useQuery({
    queryKey: ["cpl-cpmk-mapping", curriculumId],
    queryFn: () => cplCpmkMappingService.getMatrix(curriculumId!),
    enabled: !!curriculumId,
  });

  const { data: existingScoresData, isLoading: scoresLoading } = useQuery({
    queryKey: ["student-scores", classId],
    queryFn: () => studentCpmkScoreService.getByClass(classId!),
    enabled: !!classId,
  });

  useEffect(() => {
    if (existingScoresData?.data && !scoresInitialized.current) {
      setScores(buildInitialScores(existingScoresData.data));
      scoresInitialized.current = true;
    }
  }, [existingScoresData]);

  const cpmkGroups = useMemo(() => buildCpmkGroups(weightsData?.data ?? []), [weightsData]);
  const conversionComponents = useMemo(() => buildConversionComponents(cpmkGroups), [cpmkGroups]);
  const students: ClassStudent[] = cls?.students ?? [];


  // ── Save ─────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () => {
      const entries: ScoreEntry[] = [];
      for (const group of cpmkGroups) {
        for (const comp of group.components) {
          for (const s of students) {
            entries.push({
              studentId: s.student.id,
              cpmkId: group.cpmkId,
              assessmentComponentId: comp.componentId,
              score: scores[sKey(s.student.id, group.cpmkId, comp.componentId)] ?? 0,
            });
          }
        }
      }
      return studentCpmkScoreService.bulkSave({
        classId: classId!,
        courseId: cls!.course.id,
        scores: entries,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-scores", classId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleScoreChange = useCallback(
    (studentId: string, cpmkId: string, componentId: string, val: string) => {
      const num = Math.min(100, Math.max(0, parseFloat(val) || 0));
      setScores((prev) => ({ ...prev, [sKey(studentId, cpmkId, componentId)]: num }));
    },
    []
  );

  // ── Rekap rows (must be before early returns) ─────────────
  const rekapRows = useMemo(() => {
    return [...students]
      .sort((a, b) => a.student.nim.localeCompare(b.student.nim))
      .map((cs, idx) => {
        const complete   = isAllCpmkComplete(cs.student.id, cpmkGroups, scores);
        const finalScore = complete ? calcFinalScore(cs.student.id, cpmkGroups, scores) : null;
        const grade      = finalScore !== null ? getGrade(finalScore) : null;
        const mutu       = grade ? (GRADE_LEGEND.find((g) => g.grade === grade)?.mutu ?? 0) : null;
        return { no: idx + 1, nim: cs.student.nim, name: cs.student.name, finalScore, grade, mutu };
      });
  }, [students, cpmkGroups, scores]);

  const copyRekapToClipboard = useCallback(() => {
    const header = "No\tNIM\tNama\tNilai Akhir\tGrade\tMutu";
    const rows = rekapRows.map((r) =>
      `${r.no}\t${r.nim}\t${r.name}\t${r.finalScore !== null ? r.finalScore.toFixed(2) : ""}\t${r.grade ?? ""}\t${r.mutu !== null ? r.mutu.toFixed(1) : ""}`
    );
    navigator.clipboard.writeText([header, ...rows].join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [rekapRows]);

  // ── Loading / empty states ────────────────────────────────
  const isLoading = classLoading || weightsLoading || scoresLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <AlertCircle className="w-10 h-10 mb-2 text-yellow-400" />
        <p>Kelas tidak ditemukan</p>
      </div>
    );
  }

  if (cpmkGroups.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/nilai")} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">{cls.course.name}</h1>
            <p className="text-sm text-gray-500">{cls.course.code} · Kelas {cls.code} · {cls.semester.name}</p>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-700">
            Belum ada bobot penilaian CPMK untuk mata kuliah <strong>{cls.course.name}</strong>.
          </p>
        </div>
      </div>
    );
  }

  const isRingkasan = activeCpmkIdx === RINGKASAN_IDX;
  const isRekap     = activeCpmkIdx === REKAP_IDX;
  const activeGroup = (!isRingkasan && !isRekap) ? cpmkGroups[activeCpmkIdx] : null;
  const activeCpls =
    activeGroup && cplMappingData?.data
      ? buildCplMap(activeGroup.cpmkId, cplMappingData.data.cpls, cplMappingData.data.mappings)
      : [];

  const studentsComplete = students.filter((s) =>
    isAllCpmkComplete(s.student.id, cpmkGroups, scores)
  ).length;

  // ── SIAKAD conversion computed values ────────────────────
  const siakadFinalWeights: Record<string, number> = { UTS: 0, UAS: 0, Kuis: 0, Tugas: 0 };
  for (const comp of conversionComponents) {
    const cat = siakadMapping[comp.componentId];
    if (cat) siakadFinalWeights[cat] = (siakadFinalWeights[cat] ?? 0) + comp.totalWeight;
  }
  const totalMappedWeight = conversionComponents.reduce(
    (s, c) => s + (siakadMapping[c.componentId] ? c.totalWeight : 0),
    0
  );
  const allMapped = conversionComponents.length > 0 && totalMappedWeight >= 99.9;
  const totalSiakad = Math.round(SIAKAD_CATS.reduce((s, cat) => s + (siakadFinalWeights[cat] ?? 0), 0) * 10) / 10;

  function calcSiakadCatScore(studentId: string, cat: SiakadCat): number | null {
    const mapped = conversionComponents.filter(c => siakadMapping[c.componentId] === cat);
    if (!mapped.length) return null;
    const totalW = mapped.reduce((s, c) => s + c.totalWeight, 0);
    if (!totalW) return null;
    let weighted = 0;
    for (const c of mapped) {
      weighted += calcComponentScore(studentId, c.componentId, cpmkGroups, scores, c.totalWeight) * (c.totalWeight / totalW);
    }
    return Math.round(weighted * 10) / 10;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/nilai")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">{cls.course.name}</h1>
            <p className="text-sm text-gray-500">
              {cls.course.code} · Kelas {cls.code} · {cls.semester.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Tersimpan
            </span>
          )}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? "Menyimpan..." : "Simpan Nilai"}
          </button>
        </div>
      </div>

      {/* Info kelas */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500">Mata Kuliah</p>
          <p className="font-medium text-gray-800">{cls.course.name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Kelas</p>
          <p className="font-medium text-gray-800">Kelas {cls.code}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Jumlah Mahasiswa</p>
          <p className="font-medium text-gray-800">{students.length} orang</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Nilai lengkap</p>
          <p className="font-medium text-gray-800">
            {studentsComplete}/{students.length} mahasiswa
          </p>
        </div>
      </div>

      {/* Grade legend */}
      <div className="flex flex-wrap gap-2">
        {GRADE_LEGEND.map((g) => (
          <span key={g.grade} className={`text-xs px-2 py-1 rounded-md font-medium ${g.color}`}>
            {g.grade}: {g.range}
          </span>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto pb-px scrollbar-hide">
          {cpmkGroups.map((g, i) => (
            <button
              key={g.cpmkId}
              onClick={() => setActiveCpmkIdx(i)}
              className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeCpmkIdx === i
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {g.cpmkCode}
            </button>
          ))}
          <button
            onClick={() => setActiveCpmkIdx(REKAP_IDX)}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              isRekap
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Rekap Nilai
          </button>
          <button
            onClick={() => setActiveCpmkIdx(RINGKASAN_IDX)}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              isRingkasan
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            Ringkasan CPMK
          </button>
        </div>
      </div>

      {/* ── Tab: Rekap Nilai ── */}
      {isRekap && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Rekap Nilai Akhir</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {rekapRows.filter((r) => r.grade !== null).length}/{students.length} mahasiswa sudah lengkap
              </p>
            </div>
            <button
              onClick={copyRekapToClipboard}
              className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
                copied
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-white border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Tersalin!" : "Salin ke Clipboard"}
            </button>
          </div>

          {/* Grade distribution chips */}
          {rekapRows.some((r) => r.grade) && (
            <div className="flex flex-wrap gap-2">
              {GRADE_LEGEND.map((g) => {
                const count = rekapRows.filter((r) => r.grade === g.grade).length;
                if (count === 0) return null;
                return (
                  <span key={g.grade} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold border ${gradeChipColor(g.grade)}`}>
                    {g.grade}
                    <span className="bg-white/70 rounded-full w-5 h-5 flex items-center justify-center font-bold text-[11px]">{count}</span>
                  </span>
                );
              })}
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[#FFD700] text-gray-800">
                  <th className="px-3 py-3 text-center font-semibold w-10">No</th>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[130px]">NIM</th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[200px]">Nama Mahasiswa</th>
                  <th className="px-4 py-3 text-center font-semibold whitespace-nowrap w-28">Nilai Akhir</th>
                  <th className="px-4 py-3 text-center font-semibold whitespace-nowrap w-24">Grade</th>
                  <th className="px-4 py-3 text-center font-semibold whitespace-nowrap w-24">Mutu</th>
                </tr>
              </thead>
              <tbody>
                {rekapRows.map((row, idx) => (
                  <tr key={row.nim} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                    <td className="px-3 py-3 text-gray-400 text-center text-xs">{row.no}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 tracking-wide">{row.nim}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-700">
                      {row.finalScore !== null ? row.finalScore.toFixed(2) : (
                        <span className="text-xs text-orange-400 font-normal">Belum lengkap</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.grade ? (
                        <span className={`inline-block min-w-[36px] text-center text-sm font-bold px-2.5 py-1 rounded-lg border ${gradeChipColor(row.grade)}`}>
                          {row.grade}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">–</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600 font-medium">
                      {row.mutu !== null ? row.mutu.toFixed(1) : <span className="text-gray-300">–</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-600 mb-2.5">Konversi Nilai (Skala Widyatama)</p>
            <div className="flex flex-wrap gap-2">
              {GRADE_LEGEND.map((g) => (
                <div key={g.grade} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${g.color} border-current/20`}>
                  <span className="font-bold">{g.grade}</span>
                  <span className="opacity-70">{g.range}</span>
                  <span className="font-semibold">(Mutu {g.mutu.toFixed(1)})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Input CPMK ── */}
      {!isRingkasan && !isRekap && activeGroup && (
        <>
          <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {activeGroup.cpmkCode} — {activeGroup.cpmkName}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {activeGroup.components.length} komponen ·{" "}
                Total bobot: {activeGroup.components.reduce((s, c) => s + c.weight, 0)}%
              </p>
            </div>
            {activeCpls.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">CPL terkait:</span>
                {activeCpls.map((cpl) => (
                  <span
                    key={cpl.id}
                    title={cpl.name}
                    className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium cursor-help"
                  >
                    {cpl.code}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[#FFD700] text-gray-800">
                  <th className="sticky left-0 bg-[#FFD700] px-3 py-3 text-center font-semibold w-10">No</th>
                  <th className="sticky left-10 bg-[#FFD700] px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[120px]">NIM</th>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[180px]">Nama Mahasiswa</th>
                  {activeGroup.components.map((comp) => (
                    <th key={comp.componentId} className="px-4 py-3 text-center font-semibold whitespace-nowrap min-w-[110px]">
                      <div>{comp.componentCode}</div>
                      <div className="text-xs font-normal text-gray-700">{comp.componentName}</div>
                      <div className="text-xs font-normal text-gray-500 mt-0.5">bobot {comp.weight}%</div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center font-semibold whitespace-nowrap min-w-[90px]">
                    Nilai {activeGroup.cpmkCode}
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((cs, idx) => {
                  const cpmkTotal = calcCpmkTotal(cs.student.id, activeGroup, scores);
                  return (
                    <tr key={cs.student.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="sticky left-0 bg-inherit px-3 py-2.5 text-gray-500 text-center">{idx + 1}</td>
                      <td className="sticky left-10 bg-inherit px-4 py-2.5 font-mono text-xs text-gray-600">{cs.student.nim}</td>
                      <td className="px-4 py-2.5 text-gray-800">{cs.student.name}</td>
                      {activeGroup.components.map((comp) => {
                        const key = sKey(cs.student.id, activeGroup.cpmkId, comp.componentId);
                        return (
                          <td key={comp.componentId} className="px-2 py-1.5 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={scores[key] ?? ""}
                              onChange={(e) =>
                                handleScoreChange(cs.student.id, activeGroup.cpmkId, comp.componentId, e.target.value)
                              }
                              className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                              placeholder="0"
                            />
                          </td>
                        );
                      })}
                      <td className="px-4 py-2.5 text-center font-semibold text-sm text-gray-700">
                        {cpmkTotal > 0 ? cpmkTotal.toFixed(1) : "–"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400">
            * Nilai {activeGroup.cpmkCode} = rata-rata tertimbang komponen penilaian pada CPMK ini
          </p>
        </>
      )}

      {/* ── Tab: Ringkasan CPMK ── */}
      {isRingkasan && (
        <>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-700">
              Grade akhir dihitung dari gabungan nilai semua CPMK dan hanya tampil apabila
              seluruh nilai CPMK sudah diinput untuk mahasiswa tersebut.
            </p>
          </div>

          {/* Ringkasan nilai */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[#FFD700] text-gray-800">
                  <th className="sticky left-0 bg-[#FFD700] px-3 py-3 text-center font-semibold w-10">No</th>
                  <th className="sticky left-10 bg-[#FFD700] px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[120px]">NIM</th>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[180px]">Nama Mahasiswa</th>
                  {cpmkGroups.map((g) => (
                    <th key={g.cpmkId} className="px-4 py-3 text-center font-semibold whitespace-nowrap min-w-[90px]">
                      {g.cpmkCode}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center font-semibold whitespace-nowrap min-w-[90px]">Nilai Akhir</th>
                  <th className="px-4 py-3 text-center font-semibold whitespace-nowrap min-w-[70px]">Grade</th>
                </tr>
              </thead>
              <tbody>
                {students.map((cs, idx) => {
                  const complete = isAllCpmkComplete(cs.student.id, cpmkGroups, scores);
                  const finalScore = complete ? calcFinalScore(cs.student.id, cpmkGroups, scores) : null;
                  const grade = finalScore !== null ? getGrade(finalScore) : null;
                  return (
                    <tr key={cs.student.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="sticky left-0 bg-inherit px-3 py-2.5 text-gray-500 text-center">{idx + 1}</td>
                      <td className="sticky left-10 bg-inherit px-4 py-2.5 font-mono text-xs text-gray-600">{cs.student.nim}</td>
                      <td className="px-4 py-2.5 text-gray-800">{cs.student.name}</td>
                      {cpmkGroups.map((g) => {
                        const t = calcCpmkTotal(cs.student.id, g, scores);
                        const cpmkDone = g.components.every(
                          (c) => sKey(cs.student.id, g.cpmkId, c.componentId) in scores
                        );
                        return (
                          <td key={g.cpmkId} className="px-4 py-2.5 text-center">
                            {cpmkDone ? (
                              <span className="text-gray-700 font-medium">{t.toFixed(1)}</span>
                            ) : (
                              <span className="text-xs text-orange-400">Belum diisi</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-2.5 text-center font-semibold text-gray-800">
                        {finalScore !== null ? finalScore.toFixed(1) : <span className="text-gray-300">–</span>}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {grade ? (
                          <span className={`text-sm ${gradeColor(grade)}`}>{grade}</span>
                        ) : (
                          <span className="text-xs text-gray-400">–</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Konversi ke SIAKAD Widyatama ── */}
          <div className="border border-amber-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowKonversi((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-amber-800 text-sm">Konversi ke SIAKAD Widyatama</span>
                <span className="text-xs text-amber-600 bg-amber-200 px-2 py-0.5 rounded-full">
                  Pemetaan OBE → SIAKAD lama
                </span>
              </div>
              <span className="text-amber-600 text-xs font-medium">
                {showKonversi ? "Sembunyikan ▲" : "Tampilkan ▼"}
              </span>
            </button>

            {showKonversi && (
              <div className="p-5 space-y-6 bg-white">

                {/* ── Langkah 1: Pemetaan OBE → SIAKAD ── */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-bold shrink-0">1</span>
                    <p className="text-sm font-semibold text-gray-700">Petakan Komponen OBE ke Kategori SIAKAD</p>
                  </div>
                  <div className="space-y-2">
                    {conversionComponents.map((comp) => (
                      <div key={comp.componentId} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-gray-700">{comp.componentCode}</span>
                          <span className="text-xs text-gray-400 ml-2">{comp.componentName}</span>
                          <span className="text-xs text-amber-600 font-semibold ml-2">{comp.totalWeight}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-gray-300 text-xs mr-0.5">→</span>
                          {SIAKAD_CATS.map((cat) => (
                            <button
                              key={cat}
                              onClick={() =>
                                setSiakadMapping((prev) => ({
                                  ...prev,
                                  [comp.componentId]: prev[comp.componentId] === cat ? '' : cat,
                                }))
                              }
                              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                siakadMapping[comp.componentId] === cat
                                  ? SIAKAD_CHIP[cat]
                                  : 'border-gray-200 text-gray-400 bg-white hover:border-gray-300 hover:text-gray-600'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {!allMapped && conversionComponents.length > 0 && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      {Math.round(totalMappedWeight)}% dari 100% sudah dipetakan. Petakan semua komponen untuk melihat tabel konversi.
                    </p>
                  )}
                </div>

                {/* ── Langkah 2: Distribusi bobot & tabel konversi ── */}
                {allMapped && (
                  <>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-bold shrink-0">2</span>
                        <p className="text-sm font-semibold text-gray-700">Distribusi Bobot ke SIAKAD</p>
                        <span className="text-xs text-gray-400">— masukkan ke Pengaturan Bobot di SIAKAD lama</span>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {SIAKAD_CATS.filter((cat) => siakadFinalWeights[cat] > 0).map((cat) => (
                          <div key={cat} className={`rounded-xl p-4 text-center min-w-[90px] border ${SIAKAD_CHIP[cat]}`}>
                            <p className="text-xs font-semibold">{cat}</p>
                            <p className="text-2xl font-bold mt-1">{siakadFinalWeights[cat]}%</p>
                          </div>
                        ))}
                        <div className={`rounded-xl p-4 text-center min-w-[90px] border ${Math.abs(totalSiakad - 100) < 0.2 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <p className="text-xs text-gray-500 font-medium">Total</p>
                          <p className={`text-2xl font-bold mt-1 ${Math.abs(totalSiakad - 100) < 0.2 ? 'text-green-700' : 'text-red-600'}`}>
                            {totalSiakad}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Nilai Konversi per Mahasiswa</p>
                      <p className="text-xs text-gray-400 mb-3">Nilai diisi otomatis oleh sistem berdasarkan pemetaan OBE.</p>
                      <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-amber-50 text-gray-700">
                              <th className="sticky left-0 bg-amber-50 px-3 py-3 text-center font-semibold w-10">No</th>
                              <th className="sticky left-10 bg-amber-50 px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[120px]">NIM</th>
                              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[180px]">Nama Mahasiswa</th>
                              {SIAKAD_CATS.filter((cat) => siakadFinalWeights[cat] > 0).map((cat) => (
                                <th key={cat} className="px-4 py-3 text-center font-semibold whitespace-nowrap min-w-[90px]">
                                  <div>{cat}</div>
                                  <div className="text-xs font-normal text-amber-600">{siakadFinalWeights[cat]}%</div>
                                </th>
                              ))}
                              <th className="px-4 py-3 text-center font-semibold whitespace-nowrap min-w-[90px]">Nilai Akhir</th>
                              <th className="px-4 py-3 text-center font-semibold whitespace-nowrap min-w-[70px]">Huruf</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.map((cs, idx) => {
                              const complete = isAllCpmkComplete(cs.student.id, cpmkGroups, scores);
                              const finalScore = complete ? calcFinalScore(cs.student.id, cpmkGroups, scores) : null;
                              const grade = finalScore !== null ? getGrade(finalScore) : null;
                              const activeCatList = SIAKAD_CATS.filter((cat) => siakadFinalWeights[cat] > 0);
                              return (
                                <tr key={cs.student.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                  <td className="sticky left-0 bg-inherit px-3 py-2.5 text-gray-400 text-center text-xs">{idx + 1}</td>
                                  <td className="sticky left-10 bg-inherit px-4 py-2.5 font-mono text-xs text-gray-600">{cs.student.nim}</td>
                                  <td className="px-4 py-2.5 text-gray-800">{cs.student.name}</td>
                                  {activeCatList.map((cat) => {
                                    const catScore = complete ? calcSiakadCatScore(cs.student.id, cat) : null;
                                    return (
                                      <td key={cat} className="px-4 py-2.5 text-center font-medium text-gray-700">
                                        {catScore !== null ? catScore.toFixed(1) : <span className="text-gray-300">–</span>}
                                      </td>
                                    );
                                  })}
                                  <td className="px-4 py-2.5 text-center font-bold text-gray-800">
                                    {finalScore !== null
                                      ? finalScore.toFixed(1)
                                      : <span className="text-orange-400 text-xs font-normal">Belum lengkap</span>}
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    {grade
                                      ? <span className={`text-sm ${gradeColor(grade)}`}>{grade}</span>
                                      : <span className="text-xs text-gray-300">–</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400">
            * Nilai Akhir = gabungan tertimbang dari semua CPMK. Pastikan semua CPMK sudah terisi sebelum finalisasi.
          </p>
        </>
      )}
    </div>
  );
}
