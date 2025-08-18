import { ReactNode, HTMLAttributes } from "react";

export type Column<T> = {
  label: string;
  render: (item: T, index: number) => ReactNode;
};

type TableProps<T> = {
  data: T[];
  columns: Column<T>[];
  className?: HTMLAttributes<HTMLDivElement>["className"];
};

export function Table<T>({ data, columns, className = "" }: TableProps<T>) {
  return (
    <div className={`overflow-auto rounded-xl border border-gray-200 ${className}`}>
      <table className="min-w-full text-sm text-gray-800">
        <thead>
          <tr className="bg-gray-100 text-gray-700 text-sm font-semibold">
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-left border-b border-gray-200 ${
                  i === 0 ? "rounded-tl-xl" : ""
                } ${i === columns.length - 1 ? "rounded-tr-xl" : ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-4">
                Data tidak ditemukan.
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-4 py-3 border-b border-gray-100 align-top"
                  >
                    {col.render(item, rowIndex)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
