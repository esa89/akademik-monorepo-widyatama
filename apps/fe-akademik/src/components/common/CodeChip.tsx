const COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-yellow-100 text-yellow-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
  'bg-red-100 text-red-700',
  'bg-cyan-100 text-cyan-700',
];

function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initials(code: string): string {
  return code.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase();
}

interface CodeChipProps {
  code: string;
}

export function CodeChip({ code }: CodeChipProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold shrink-0 ${hashColor(code)}`}>
        {initials(code)}
      </span>
      <span className="font-medium text-gray-800">{code}</span>
    </div>
  );
}
