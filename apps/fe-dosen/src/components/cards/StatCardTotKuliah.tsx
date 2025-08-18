type StatCardTotKuliahProps = {
  count: string;
  title: string;
  code: string;
  color: string;
};

export default function StatCardTotKuliah({
  count,
  title,
  code,
  color,
}: StatCardTotKuliahProps) {
  return (
    <div className="flex items-center rounded-lg shadow-sm border p-4 w-[240px]">
      {/* Badge */}
      <div
        className="rounded-md text-white font-bold text-sm w-12 h-12 flex items-center justify-center mr-4"
        style={{ backgroundColor: color }}
      >
        {count}
      </div>

      {/* Detail */}
      <div className="text-sm text-gray-800 space-y-1">
        <p className="font-semibold">{title}</p>
        <div className="h-px bg-gray-200" />
        <p className="text-gray-500">{code}</p>
      </div>
    </div>
  );
}
