import type { ReactNode } from 'react';

type ColorKey = 'blue' | 'green' | 'emerald' | 'yellow' | 'red' | 'purple' | 'orange';

const COLOR_MAP: Record<ColorKey, string> = {
  blue:    'bg-blue-100 text-blue-600',
  green:   'bg-green-100 text-green-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  yellow:  'bg-yellow-100 text-yellow-600',
  red:     'bg-red-100 text-red-600',
  purple:  'bg-purple-100 text-purple-600',
  orange:  'bg-orange-100 text-orange-600',
};

interface StatCardProps {
  label?: string;
  title?: string;
  value: string | number | undefined;
  icon: ReactNode;
  color?: ColorKey;
  iconBg?: string;
  sub?: string;
}

export function StatCard({ label, title, value, icon, color, iconBg, sub }: StatCardProps) {
  const heading = label ?? title ?? '';
  const iconCls = iconBg ?? (color ? COLOR_MAP[color] : COLOR_MAP.blue);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{heading}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1.5">
            {value ?? <span className="text-gray-300">–</span>}
          </p>
        </div>
        <div className={`p-3 rounded-xl flex-shrink-0 ${iconCls}`}>
          {icon}
        </div>
      </div>
      {sub && <p className="text-xs text-gray-400 mt-3 font-medium">{sub}</p>}
    </div>
  );
}
