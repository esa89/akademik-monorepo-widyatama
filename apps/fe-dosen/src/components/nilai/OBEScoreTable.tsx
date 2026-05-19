/**
 * OBEScoreTable — Tabel input nilai OBE (spreadsheet-like)
 * Menampilkan kolom: No, NPM, Nama, [Per CPMK: Sub-CPMK cols + Ketercapaian], Nilai PLO, Nilai SIAKAD, Nilai Akhir, Mutu
 */

import { useCallback } from 'react';
import type {
  CPMK,
  PLO,
  NilaiOBEMahasiswa,
  NilaiSIAKAD,
  SiakadWeights,
  KualitatifLabel,
} from '@/types/obe.types';
import { getKualitatifColor, getNilaiMutuColor } from '@/utils/obe.utils';

interface OBEScoreTableProps {
  cpmkList: CPMK[];
  ploList: PLO[];
  nilaiList: NilaiOBEMahasiswa[];
  siakadWeights: SiakadWeights;
  /** key: "npm:subCPMKId", value: raw score */
  rawScores: Record<string, Record<string, number>>;
  /** key: npm, value: NilaiSIAKAD */
  siakadScores: Record<string, NilaiSIAKAD>;
  onRawScoreChange: (npm: string, subCPMKId: string, value: number) => void;
  onSiakadChange: (npm: string, field: keyof NilaiSIAKAD, value: number) => void;
}

function KualitatifBadge({ label }: { label: KualitatifLabel }) {
  const colors = getKualitatifColor(label);
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${colors.bgClass} ${colors.textClass}`}
    >
      {label}
    </span>
  );
}

export function OBEScoreTable({
  cpmkList,
  ploList,
  nilaiList,
  siakadWeights,
  rawScores,
  siakadScores,
  onRawScoreChange,
  onSiakadChange,
}: OBEScoreTableProps) {
  // Count total sub-CPMK columns + ketercapaian columns
  const handleNumberInput = useCallback(
    (npm: string, subId: string, val: string) => {
      const num = val === '' ? 0 : parseInt(val, 10);
      if (!isNaN(num)) onRawScoreChange(npm, subId, Math.min(100, Math.max(0, num)));
    },
    [onRawScoreChange]
  );

  const handleSiakadInput = useCallback(
    (npm: string, field: keyof NilaiSIAKAD, val: string) => {
      const num = val === '' ? 0 : parseInt(val, 10);
      if (!isNaN(num)) onSiakadChange(npm, field, Math.min(100, Math.max(0, num)));
    },
    [onSiakadChange]
  );

  const siakadFields: { key: keyof NilaiSIAKAD; label: string }[] = [
    { key: 'absensi', label: 'Absensi' },
    { key: 'tugas', label: 'Tugas' },
    { key: 'kuis', label: 'Kuis' },
    { key: 'uts', label: 'UTS' },
    { key: 'uas', label: 'UAS' },
  ];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[1400px]">
          {/* Multi-level header */}
          <thead>
            {/* Level 1: Group headers */}
            <tr className="bg-gradient-to-r from-blue-700 to-blue-800">
              {/* Fixed cols */}
              <th
                colSpan={3}
                className="border border-blue-600 text-white px-2 py-2 text-center font-semibold"
              >
                Data Mahasiswa
              </th>
              {/* Per CPMK group */}
              {cpmkList.map(cpmk => (
                <th
                  key={cpmk.id}
                  colSpan={cpmk.subCPMK.length * 3 + 2}
                  className="border border-blue-600 text-white px-2 py-2 text-center font-semibold"
                  style={{ backgroundColor: getCPMKHeaderColor(cpmk.id) }}
                >
                  (CPMK) {cpmk.id}
                </th>
              ))}
              {/* PLO */}
              {ploList.map(plo => (
                <th
                  key={plo.id}
                  colSpan={2}
                  className="border border-blue-600 text-white px-2 py-2 text-center font-semibold bg-indigo-700"
                >
                  Nilai {plo.id}
                </th>
              ))}
              {/* SIAKAD */}
              <th
                colSpan={5}
                className="border border-blue-600 text-white px-2 py-2 text-center font-semibold bg-teal-700"
              >
                Nilai Pada SIAKAD
              </th>
              {/* Akhir */}
              <th
                colSpan={2}
                className="border border-blue-600 text-white px-2 py-2 text-center font-semibold bg-gray-700"
              >
                Hasil
              </th>
            </tr>

            {/* Level 2: Sub-CPMK headers */}
            <tr className="bg-blue-50">
              {/* Fixed cols */}
              <th className="border border-gray-300 px-2 py-1.5 text-center font-semibold text-gray-700 bg-gray-100 sticky left-0 z-10">
                No
              </th>
              <th className="border border-gray-300 px-2 py-1.5 text-center font-semibold text-gray-700 bg-gray-100">
                NPM
              </th>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 bg-gray-100 min-w-[180px]">
                Nama
              </th>

              {/* Per CPMK → Sub-CPMK columns */}
              {cpmkList.map(cpmk => (
                <>
                  {cpmk.subCPMK.map(sub => (
                    <>
                      <th
                        key={`${sub.id}-bobot`}
                        colSpan={3}
                        className="border border-gray-300 px-1 py-1.5 text-center font-semibold text-gray-700 bg-blue-50"
                        style={{ backgroundColor: getCPMKBgColor(cpmk.id) }}
                      >
                        Sub-CPMK) {sub.id}
                        <div className="text-[9px] font-normal text-gray-500">{sub.nama}</div>
                      </th>
                    </>
                  ))}
                  {/* Ketercapaian LO */}
                  <th
                    key={`${cpmk.id}-kuant`}
                    colSpan={2}
                    className="border border-gray-300 px-1 py-1.5 text-center font-semibold text-gray-700"
                    style={{ backgroundColor: getCPMKBgColor(cpmk.id) }}
                  >
                    Ketercapaian {cpmk.id}
                  </th>
                </>
              ))}

              {/* PLO sub headers */}
              {ploList.map((_plo, pi) => (
                <>
                  <th className="border border-gray-300 px-1 py-1.5 text-center font-semibold text-gray-700 bg-indigo-50">
                    Nilai
                  </th>
                  <th className="border border-gray-300 px-1 py-1.5 text-center font-semibold text-gray-700 bg-indigo-50">
                    Kualitatif
                  </th>
                </>
              ))}

              {/* SIAKAD sub headers */}
              {siakadFields.map(f => (
                <th
                  key={f.key}
                  className="border border-gray-300 px-1 py-1.5 text-center font-semibold text-gray-700 bg-teal-50"
                >
                  {f.label}
                  <div className="text-[9px] font-normal text-gray-400">
                    {siakadWeights[f.key]}%
                  </div>
                </th>
              ))}

              {/* Hasil */}
              <th className="border border-gray-300 px-1 py-1.5 text-center font-semibold text-gray-700 bg-gray-50">
                Nilai Akhir
              </th>
              <th className="border border-gray-300 px-1 py-1.5 text-center font-semibold text-gray-700 bg-gray-50">
                Mutu
              </th>
            </tr>

            {/* Level 3: Bobot / % / Z headers for Sub-CPMK */}
            <tr className="bg-yellow-50">
              {/* Fixed spacers */}
              <th className="border border-gray-300 bg-gray-100 sticky left-0 z-10"></th>
              <th className="border border-gray-300 bg-gray-100"></th>
              <th className="border border-gray-300 bg-gray-100"></th>

              {cpmkList.map(cpmk => (
                <>
                  {cpmk.subCPMK.map(sub => (
                    <>
                      <th
                        key={`${sub.id}-h-bobot`}
                        className="border border-gray-300 px-1 py-1 text-center text-[10px] font-semibold text-gray-600 bg-yellow-50"
                      >
                        Bobot
                      </th>
                      <th
                        key={`${sub.id}-h-pct`}
                        className="border border-gray-300 px-1 py-1 text-center text-[10px] font-semibold text-yellow-700 bg-yellow-100"
                      >
                        {sub.persentase}%
                      </th>
                      <th
                        key={`${sub.id}-h-z`}
                        className="border border-gray-300 px-1 py-1 text-center text-[10px] font-semibold text-gray-600 bg-yellow-50"
                      >
                        Z Nilai x bobot
                      </th>
                    </>
                  ))}
                  <th className="border border-gray-300 px-1 py-1 text-center text-[10px] font-semibold text-gray-600 bg-gray-50">
                    Kuantitatif
                  </th>
                  <th className="border border-gray-300 px-1 py-1 text-center text-[10px] font-semibold text-gray-600 bg-gray-50">
                    Kualitatif
                  </th>
                </>
              ))}

              {/* PLO spacers */}
              {ploList.map((_plo, i) => (
                <>
                  <th key={`plo-${i}-a`} className="border border-gray-300 bg-indigo-50 text-[10px] text-center text-gray-500">100%</th>
                  <th key={`plo-${i}-b`} className="border border-gray-300 bg-indigo-50"></th>
                </>
              ))}

              {/* SIAKAD spacers */}
              {siakadFields.map(f => (
                <th key={`s-${f.key}`} className="border border-gray-300 bg-teal-50"></th>
              ))}

              {/* Hasil spacers */}
              <th className="border border-gray-300 bg-gray-50"></th>
              <th className="border border-gray-300 bg-gray-50"></th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {nilaiList.map((mhs, idx) => {
              const isPoor = mhs.nilaiMutu === 'D' || mhs.nilaiMutu === 'E';

              return (
                <tr
                  key={mhs.mahasiswa.npm}
                  className={`${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  } hover:bg-blue-50/30 transition-colors ${
                    isPoor ? 'bg-red-50/30' : ''
                  }`}
                >
                  {/* No */}
                  <td className="border border-gray-200 px-2 py-1.5 text-center text-gray-600 sticky left-0 bg-inherit z-10">
                    {idx + 1}
                  </td>
                  {/* NPM */}
                  <td className="border border-gray-200 px-2 py-1.5 text-center font-mono text-gray-700">
                    {mhs.mahasiswa.npm}
                  </td>
                  {/* Nama */}
                  <td className="border border-gray-200 px-2 py-1.5 text-gray-800 font-medium whitespace-nowrap">
                    {mhs.mahasiswa.nama}
                  </td>

                  {/* Per CPMK columns */}
                  {cpmkList.map(cpmk => {
                    const ketercapaian = mhs.ketercapaianCPMK.find(
                      k => k.cpmkId === cpmk.id
                    );

                    return (
                      <>
                        {cpmk.subCPMK.map(sub => {
                          const nilaiSub = mhs.nilaiSubCPMK.find(
                            n => n.subCPMKId === sub.id
                          );
                          const raw = rawScores[mhs.mahasiswa.npm]?.[sub.id] ?? 0;

                          return (
                            <>
                              {/* Bobot (editable input) */}
                              <td
                                key={`${mhs.mahasiswa.npm}-${sub.id}-bobot`}
                                className="border border-gray-200 px-0.5 py-0.5 text-center"
                              >
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={raw || ''}
                                  onChange={e =>
                                    handleNumberInput(
                                      mhs.mahasiswa.npm,
                                      sub.id,
                                      e.target.value
                                    )
                                  }
                                  className="w-12 text-center text-xs border border-gray-200 rounded px-1 py-0.5 focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none bg-white"
                                />
                              </td>
                              {/* Persentase (auto) */}
                              <td
                                key={`${mhs.mahasiswa.npm}-${sub.id}-pct`}
                                className="border border-gray-200 px-1 py-1.5 text-center text-gray-500 bg-yellow-50/50"
                              >
                                {nilaiSub?.nilaiPersentase ?? 0}
                              </td>
                              {/* Z Nilai x Bobot (auto) */}
                              <td
                                key={`${mhs.mahasiswa.npm}-${sub.id}-z`}
                                className="border border-gray-200 px-1 py-1.5 text-center font-medium text-gray-700"
                              >
                                {nilaiSub?.zNilaiBobot ?? 0}
                              </td>
                            </>
                          );
                        })}

                        {/* Ketercapaian LO */}
                        <td className="border border-gray-200 px-1 py-1.5 text-center font-bold text-gray-800">
                          {ketercapaian?.kuantitatif ?? 0}
                        </td>
                        <td className="border border-gray-200 px-1 py-1.5 text-center">
                          {ketercapaian && (
                            <KualitatifBadge label={ketercapaian.kualitatif} />
                          )}
                        </td>
                      </>
                    );
                  })}

                  {/* PLO columns */}
                  {ploList.map(plo => {
                    const nilaiPLO = mhs.nilaiPLO.find(p => p.ploId === plo.id);
                    return (
                      <>
                        <td className="border border-gray-200 px-1 py-1.5 text-center font-bold text-gray-800 bg-indigo-50/30">
                          {nilaiPLO?.nilai ?? 0}
                        </td>
                        <td className="border border-gray-200 px-1 py-1.5 text-center bg-indigo-50/30">
                          {nilaiPLO && (
                            <KualitatifBadge label={nilaiPLO.kualitatif} />
                          )}
                        </td>
                      </>
                    );
                  })}

                  {/* SIAKAD columns (editable) */}
                  {siakadFields.map(f => {
                    const val = siakadScores[mhs.mahasiswa.npm]?.[f.key] ?? 0;
                    return (
                      <td
                        key={`${mhs.mahasiswa.npm}-siakad-${f.key}`}
                        className="border border-gray-200 px-0.5 py-0.5 text-center bg-teal-50/20"
                      >
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={val || ''}
                          onChange={e =>
                            handleSiakadInput(
                              mhs.mahasiswa.npm,
                              f.key,
                              e.target.value
                            )
                          }
                          className="w-12 text-center text-xs border border-gray-200 rounded px-1 py-0.5 focus:border-teal-400 focus:ring-1 focus:ring-teal-200 outline-none bg-white"
                        />
                      </td>
                    );
                  })}

                  {/* Nilai Akhir */}
                  <td className="border border-gray-200 px-2 py-1.5 text-center font-bold text-gray-900">
                    {mhs.nilaiAkhir}
                  </td>
                  {/* Nilai Mutu */}
                  <td
                    className={`border border-gray-200 px-2 py-1.5 text-center font-bold ${getNilaiMutuColor(mhs.nilaiMutu)}`}
                  >
                    {mhs.nilaiMutu}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Helpers for CPMK header colors
// ============================================================

function getCPMKHeaderColor(cpmkId: string): string {
  const colors: Record<string, string> = {
    LO1: '#1e40af',
    LO2: '#7e22ce',
    LO3: '#0e7490',
    LO4: '#b45309',
    LO5: '#be123c',
  };
  return colors[cpmkId] || '#1e3a5f';
}

function getCPMKBgColor(cpmkId: string): string {
  const colors: Record<string, string> = {
    LO1: '#eff6ff',
    LO2: '#faf5ff',
    LO3: '#ecfeff',
    LO4: '#fffbeb',
    LO5: '#fff1f2',
  };
  return colors[cpmkId] || '#f8fafc';
}
