/**
 * OBEInputPage — Halaman utama input nilai OBE
 * Menggabungkan konfigurasi CPMK, tabel input, dan summary
 */

import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@widyatama/ui';
import {
  ArrowLeft,
  Save,
  FileSpreadsheet,
  Settings,
  BarChart3,
  ChevronDown,
  ChevronUp,
  GraduationCap,
} from 'lucide-react';
import type {
  CPMK,
  NilaiSIAKAD,
  NilaiOBEMahasiswa,
  SiakadWeights,
  SummaryLO,
} from '@/types/obe.types';
import { calculateFullOBE, calculateAllSummaryLO } from '@/utils/obe.utils';
import {
  dummyOBEConfig,
  getDummyRawScores,
  getDummySiakadScores,
} from '@/utils/obe.dummy';
import { OBEConfigForm } from '@/components/nilai/OBEConfigForm';
import { OBEScoreTable } from '@/components/nilai/OBEScoreTable';
import { OBESummary } from '@/components/nilai/OBESummary';

export default function OBEInputPage() {
  const { kode } = useParams<{ kode: string }>();
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────
  const [cpmkList, setCPMKList] = useState<CPMK[]>(dummyOBEConfig.cpmkList);
  const [siakadWeights, setSiakadWeights] = useState<SiakadWeights>(
    dummyOBEConfig.siakadWeights
  );
  const [rawScores, setRawScores] = useState<Record<string, Record<string, number>>>(
    getDummyRawScores
  );
  const [siakadScores, setSiakadScores] = useState<Record<string, NilaiSIAKAD>>(
    getDummySiakadScores
  );

  // UI state
  const [showConfig, setShowConfig] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ── Handlers ───────────────────────────────────────────
  const handleRawScoreChange = useCallback(
    (npm: string, subCPMKId: string, value: number) => {
      setRawScores(prev => ({
        ...prev,
        [npm]: { ...(prev[npm] || {}), [subCPMKId]: value },
      }));
    },
    []
  );

  const handleSiakadChange = useCallback(
    (npm: string, field: keyof NilaiSIAKAD, value: number) => {
      setSiakadScores(prev => ({
        ...prev,
        [npm]: { ...(prev[npm] || { absensi: 0, tugas: 0, kuis: 0, uts: 0, uas: 0 }), [field]: value },
      }));
    },
    []
  );

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: API call to save
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
    alert('Nilai OBE berhasil disimpan!');
  };

  // ── Computed Values ────────────────────────────────────
  const nilaiList: NilaiOBEMahasiswa[] = useMemo(() => {
    return dummyOBEConfig.mahasiswaList.map(mhs =>
      calculateFullOBE(
        mhs,
        cpmkList,
        dummyOBEConfig.ploList,
        rawScores[mhs.npm] || {},
        siakadScores[mhs.npm] || { absensi: 0, tugas: 0, kuis: 0, uts: 0, uas: 0 },
        siakadWeights
      )
    );
  }, [cpmkList, rawScores, siakadScores, siakadWeights]);

  const summaryLO: SummaryLO[] = useMemo(
    () => calculateAllSummaryLO(cpmkList, nilaiList),
    [cpmkList, nilaiList]
  );

  // Quick stats
  const stats = useMemo(() => {
    const total = nilaiList.length;
    const lulus = nilaiList.filter(m => !['D', 'E'].includes(m.nilaiMutu)).length;
    const avgNilai =
      total > 0
        ? Math.round(
            (nilaiList.reduce((s, m) => s + m.nilaiAkhir, 0) / total) * 100
          ) / 100
        : 0;
    return { total, lulus, tidakLulus: total - lulus, avgNilai };
  }, [nilaiList]);

  const mk = dummyOBEConfig.mataKuliah;

  return (
    <div className="space-y-5">
      {/* ── Breadcrumb ─────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => navigate('/nilai')}
          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Laporan Nilai
        </button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600">
          {kode || mk.kode} - {mk.nama}
        </span>
        <span className="text-gray-400">/</span>
        <span className="text-blue-600 font-medium">OBE</span>
      </div>

      {/* ── Header Info ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Mata Kuliah Info */}
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="w-5 h-5 text-blue-200" />
                <span className="text-blue-200 text-xs font-medium uppercase tracking-wider">
                  Perhitungan OBE
                </span>
              </div>
              <h1 className="text-xl font-bold mb-1">
                {mk.reg} – {mk.kode} - {mk.nama}
              </h1>
              <p className="text-blue-200 text-sm">{mk.dosen}</p>
              <div className="flex gap-4 mt-3">
                <span className="bg-blue-500/30 px-3 py-1 rounded-full text-xs">
                  Kelas {mk.kelas}
                </span>
                <span className="bg-blue-500/30 px-3 py-1 rounded-full text-xs">
                  {mk.jurusan}
                </span>
                <span className="bg-blue-500/30 px-3 py-1 rounded-full text-xs">
                  {mk.sks} SKS
                </span>
              </div>
            </div>
            <FileSpreadsheet className="w-12 h-12 text-blue-300/40" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-center items-center">
            <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
            <span className="text-xs text-gray-500 mt-0.5">Mahasiswa</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-center items-center">
            <span className="text-2xl font-bold text-blue-600">{stats.avgNilai}</span>
            <span className="text-xs text-gray-500 mt-0.5">Rata-rata</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-center items-center">
            <span className="text-2xl font-bold text-green-600">{stats.lulus}</span>
            <span className="text-xs text-gray-500 mt-0.5">Lulus</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-center items-center">
            <span className="text-2xl font-bold text-red-600">{stats.tidakLulus}</span>
            <span className="text-xs text-gray-500 mt-0.5">Tidak Lulus</span>
          </div>
        </div>
      </div>

      {/* ── Konfigurasi CPMK (collapsible) ─────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-sm text-gray-800">
              Konfigurasi CPMK & Bobot
            </span>
            <span className="text-xs text-gray-400">
              ({cpmkList.length} CPMK,{' '}
              {cpmkList.reduce((s, c) => s + c.subCPMK.length, 0)} Sub-CPMK)
            </span>
          </div>
          {showConfig ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
        {showConfig && (
          <div className="px-5 pb-5 border-t border-gray-100">
            <OBEConfigForm
              cpmkList={cpmkList}
              siakadWeights={siakadWeights}
              onCPMKChange={setCPMKList}
              onWeightsChange={setSiakadWeights}
            />
          </div>
        )}
      </div>

      {/* ── Tabel Input Nilai OBE ──────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-sm text-gray-800">
              Input Nilai OBE
            </h2>
            <span className="text-xs text-gray-400">
              {nilaiList.length} mahasiswa
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSummary(!showSummary)}
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              {showSummary ? 'Sembunyikan' : 'Tampilkan'} Summary
            </Button>
          </div>
        </div>
        <div className="p-2">
          <OBEScoreTable
            cpmkList={cpmkList}
            ploList={dummyOBEConfig.ploList}
            nilaiList={nilaiList}
            siakadWeights={siakadWeights}
            rawScores={rawScores}
            siakadScores={siakadScores}
            onRawScoreChange={handleRawScoreChange}
            onSiakadChange={handleSiakadChange}
          />
        </div>
      </div>

      {/* ── Summary per LO ─────────────────────────── */}
      {showSummary && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-sm text-gray-800">
              Summary Ketercapaian per Learning Outcome
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <OBESummary summaryList={summaryLO} />
          </div>
        </div>
      )}

      {/* ── Action Buttons ─────────────────────────── */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-4">
        <Button variant="outline" onClick={() => navigate('/nilai')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali ke Laporan Nilai
        </Button>
        <div className="flex gap-3">
          <Button variant="outline">
            <FileSpreadsheet className="w-4 h-4 mr-1" />
            Export Excel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-1" />
            {isSaving ? 'Menyimpan...' : 'Simpan Nilai OBE'}
          </Button>
        </div>
      </div>
    </div>
  );
}
