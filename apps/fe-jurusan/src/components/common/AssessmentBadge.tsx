import { ASSESSMENT_TYPE_LABELS, ASSESSMENT_TYPE_COLORS } from '@/constants';
import type { AssessmentType } from '@/types';

interface AssessmentBadgeProps {
  type: AssessmentType;
}

export function AssessmentBadge({ type }: AssessmentBadgeProps) {
  const label = ASSESSMENT_TYPE_LABELS[type] || type;
  const colorClass = ASSESSMENT_TYPE_COLORS[type] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}
