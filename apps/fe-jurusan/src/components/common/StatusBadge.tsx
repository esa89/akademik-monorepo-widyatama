interface StatusBadgeProps { active: boolean; label?: string }

export function StatusBadge({ active, label }: StatusBadgeProps) {
  const baseClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const activeClass = active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600';
  return <span className={`${baseClass} ${activeClass}`}>{label || (active ? 'Aktif' : 'Nonaktif')}</span>;
}
