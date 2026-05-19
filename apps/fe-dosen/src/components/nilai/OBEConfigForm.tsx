/**
 * OBEConfigForm — Form konfigurasi CPMK/Sub-CPMK untuk setup OBE mata kuliah
 * Dosen bisa menambah/hapus CPMK dan Sub-CPMK serta mengatur bobot
 */

import { useState } from 'react';
import { Button, Input } from '@widyatama/ui';
import { Plus, Trash2, ChevronDown, ChevronRight, Settings2 } from 'lucide-react';
import type { CPMK, SubCPMK, SiakadWeights } from '@/types/obe.types';

interface OBEConfigFormProps {
  cpmkList: CPMK[];
  siakadWeights: SiakadWeights;
  onCPMKChange: (cpmkList: CPMK[]) => void;
  onWeightsChange: (weights: SiakadWeights) => void;
}

export function OBEConfigForm({
  cpmkList,
  siakadWeights,
  onCPMKChange,
  onWeightsChange,
}: OBEConfigFormProps) {
  const [expandedCPMK, setExpandedCPMK] = useState<Set<string>>(new Set(['LO1']));
  const [showWeights, setShowWeights] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedCPMK(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addCPMK = () => {
    const nextNum = cpmkList.length + 1;
    const newCPMK: CPMK = {
      id: `LO${nextNum}`,
      nama: `Learning Outcome ${nextNum}`,
      subCPMK: [],
    };
    onCPMKChange([...cpmkList, newCPMK]);
    setExpandedCPMK(prev => new Set([...prev, newCPMK.id]));
  };

  const removeCPMK = (id: string) => {
    onCPMKChange(cpmkList.filter(c => c.id !== id));
  };

  const updateCPMKNama = (id: string, nama: string) => {
    onCPMKChange(cpmkList.map(c => c.id === id ? { ...c, nama } : c));
  };

  const addSubCPMK = (cpmkId: string) => {
    onCPMKChange(cpmkList.map(c => {
      if (c.id !== cpmkId) return c;
      const nextNum = c.subCPMK.length + 1;
      const newSub: SubCPMK = {
        id: `${cpmkId}.${nextNum}`,
        nama: `Assessment ${nextNum}`,
        bobotMax: 100,
        persentase: 5,
      };
      return { ...c, subCPMK: [...c.subCPMK, newSub] };
    }));
  };

  const removeSubCPMK = (cpmkId: string, subId: string) => {
    onCPMKChange(cpmkList.map(c => {
      if (c.id !== cpmkId) return c;
      return { ...c, subCPMK: c.subCPMK.filter(s => s.id !== subId) };
    }));
  };

  const updateSubCPMK = (cpmkId: string, subId: string, updates: Partial<SubCPMK>) => {
    onCPMKChange(cpmkList.map(c => {
      if (c.id !== cpmkId) return c;
      return {
        ...c,
        subCPMK: c.subCPMK.map(s =>
          s.id === subId ? { ...s, ...updates } : s
        ),
      };
    }));
  };

  const totalPersentase = cpmkList.reduce(
    (sum, c) => sum + c.subCPMK.reduce((s, sub) => s + sub.persentase, 0),
    0
  );

  const totalSiakadWeight = Object.values(siakadWeights).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Konfigurasi CPMK</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Total bobot Sub-CPMK:{' '}
            <span className={totalPersentase === 100 ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
              {totalPersentase}%
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowWeights(!showWeights)}
          >
            <Settings2 className="w-4 h-4 mr-1" />
            Bobot SIAKAD
          </Button>
          <Button variant="outline" size="sm" onClick={addCPMK}>
            <Plus className="w-4 h-4 mr-1" />
            Tambah CPMK
          </Button>
        </div>
      </div>

      {/* SIAKAD Weights */}
      {showWeights && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">Bobot Nilai SIAKAD</h4>
          <div className="grid grid-cols-5 gap-3">
            {(['absensi', 'tugas', 'kuis', 'uts', 'uas'] as const).map(key => (
              <div key={key}>
                <label className="block text-xs font-medium text-blue-800 mb-1 capitalize">
                  {key} (%)
                </label>
                <Input
                  type="number"
                  value={siakadWeights[key]}
                  onChange={e => onWeightsChange({ ...siakadWeights, [key]: Number(e.target.value) })}
                  className="text-center text-sm"
                />
              </div>
            ))}
          </div>
          <p className="text-xs mt-2 text-blue-700">
            Total:{' '}
            <span className={totalSiakadWeight === 100 ? 'font-medium text-green-700' : 'font-medium text-red-700'}>
              {totalSiakadWeight}%
            </span>
          </p>
        </div>
      )}

      {/* CPMK List */}
      <div className="space-y-2">
        {cpmkList.map((cpmk) => {
          const isExpanded = expandedCPMK.has(cpmk.id);
          const cpmkPersentase = cpmk.subCPMK.reduce((s, sub) => s + sub.persentase, 0);

          return (
            <div
              key={cpmk.id}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white"
            >
              {/* CPMK Header */}
              <div
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleExpand(cpmk.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                )}
                <span className="font-semibold text-blue-700 text-sm shrink-0">
                  ({cpmk.id})
                </span>
                <input
                  type="text"
                  value={cpmk.nama}
                  onClick={e => e.stopPropagation()}
                  onChange={e => updateCPMKNama(cpmk.id, e.target.value)}
                  className="flex-1 bg-transparent border-none text-sm text-gray-800 focus:outline-none focus:ring-0"
                />
                <span className="text-xs text-gray-500 shrink-0">
                  {cpmk.subCPMK.length} sub · {cpmkPersentase}%
                </span>
                <button
                  onClick={e => { e.stopPropagation(); removeCPMK(cpmk.id); }}
                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Sub-CPMK List */}
              {isExpanded && (
                <div className="px-4 pb-3 pt-2 space-y-2">
                  {/* Header Row */}
                  {cpmk.subCPMK.length > 0 && (
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                      <div className="col-span-2">ID</div>
                      <div className="col-span-4">Nama Assessment</div>
                      <div className="col-span-2">Bobot Max</div>
                      <div className="col-span-2">Persentase (%)</div>
                      <div className="col-span-2"></div>
                    </div>
                  )}

                  {cpmk.subCPMK.map(sub => (
                    <div
                      key={sub.id}
                      className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-md px-2 py-2"
                    >
                      <div className="col-span-2">
                        <span className="text-xs font-mono text-gray-600">{sub.id}</span>
                      </div>
                      <div className="col-span-4">
                        <Input
                          value={sub.nama}
                          onChange={e => updateSubCPMK(cpmk.id, sub.id, { nama: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={sub.bobotMax}
                          onChange={e => updateSubCPMK(cpmk.id, sub.id, { bobotMax: Number(e.target.value) })}
                          className="text-sm text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={sub.persentase}
                          onChange={e => updateSubCPMK(cpmk.id, sub.id, { persentase: Number(e.target.value) })}
                          className="text-sm text-center"
                        />
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <button
                          onClick={() => removeSubCPMK(cpmk.id, sub.id)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSubCPMK(cpmk.id)}
                    className="w-full border-dashed"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Tambah Sub-CPMK
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
