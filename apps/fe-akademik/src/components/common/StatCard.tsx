import { Card } from '@widyatama/ui';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ title, value, icon, trend, trendUp }: StatCardProps) {
  return (
    <Card className="flex items-start justify-between p-5">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {trend && (
          <p className={`text-xs mt-1 font-medium ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
      {icon && (
        <div className="p-3 bg-primary/10 rounded-lg text-primary">
          {icon}
        </div>
      )}
    </Card>
  );
}
