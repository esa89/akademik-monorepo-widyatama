/**
 * OBESummary — Summary ketercapaian per Learning Outcome
 * Menampilkan tabel summary + bar chart per LO
 */

import type { SummaryLO } from '@/types/obe.types';
import { getKualitatifColor } from '@/utils/obe.utils';

interface OBESummaryProps {
  summaryList: SummaryLO[];
}

export function OBESummary({ summaryList }: OBESummaryProps) {
  if (summaryList.length === 0) return null;

  return (
    <div className="space-y-6">
      {summaryList.map(summary => (
        <SummaryCard key={summary.cpmkId} summary={summary} />
      ))}
    </div>
  );
}

function SummaryCard({ summary }: { summary: SummaryLO }) {
  const maxCount = Math.max(summary.excellent, summary.good, summary.average, summary.poor, 1);

  const bars: { label: string; count: number; color: string; bgColor: string }[] = [
    {
      label: 'EXCELLENT',
      count: summary.excellent,
      color: getKualitatifColor('EXCELLENT').text,
      bgColor: '#22c55e',
    },
    {
      label: 'GOOD',
      count: summary.good,
      color: getKualitatifColor('GOOD').text,
      bgColor: '#3b82f6',
    },
    {
      label: 'AVERAGE',
      count: summary.average,
      color: getKualitatifColor('AVERAGE').text,
      bgColor: '#eab308',
    },
    {
      label: 'POOR',
      count: summary.poor,
      color: getKualitatifColor('POOR').text,
      bgColor: '#ef4444',
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 flex items-center justify-between">
        <h4 className="text-white font-semibold text-sm">
          Summary {summary.cpmkId}
        </h4>
        <div className="flex items-center gap-3">
          <span className="text-blue-200 text-xs">Total: {summary.total}</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              summary.keberhasilan >= 80
                ? 'bg-green-400 text-green-900'
                : summary.keberhasilan >= 60
                ? 'bg-yellow-400 text-yellow-900'
                : 'bg-red-400 text-red-900'
            }`}
          >
            Keberhasilan: {summary.keberhasilan}%
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="space-y-3">
            {bars.map(bar => (
              <div key={bar.label} className="flex items-center gap-3">
                <span className="text-xs font-medium w-20 text-gray-600">
                  {bar.label}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                    style={{
                      width: `${(bar.count / maxCount) * 100}%`,
                      backgroundColor: bar.bgColor,
                      minWidth: bar.count > 0 ? '24px' : '0',
                    }}
                  >
                    {bar.count > 0 && (
                      <span className="text-[10px] font-bold text-white">
                        {bar.count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats Table */}
          <div>
            <table className="w-full text-sm">
              <tbody>
                {bars.map(bar => (
                  <tr key={bar.label} className="border-b border-gray-100 last:border-0">
                    <td className="py-1.5 pr-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-sm mr-2"
                        style={{ backgroundColor: bar.bgColor }}
                      />
                      <span className="text-gray-700 text-xs">{bar.label}</span>
                    </td>
                    <td className="py-1.5 text-right font-semibold text-gray-900 text-xs">
                      {bar.count}
                    </td>
                    <td className="py-1.5 text-right text-gray-500 text-xs pl-3">
                      {summary.total > 0
                        ? `${((bar.count / summary.total) * 100).toFixed(1)}%`
                        : '0%'}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300">
                  <td className="py-2 text-xs font-bold text-gray-800">TOTAL</td>
                  <td className="py-2 text-right font-bold text-gray-900 text-xs">
                    {summary.total}
                  </td>
                  <td className="py-2 text-right font-bold text-gray-700 text-xs">
                    100%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
