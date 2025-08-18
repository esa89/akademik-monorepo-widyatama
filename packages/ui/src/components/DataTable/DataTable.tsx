import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";

export type Header<T> = {
  key: keyof T;
  title: string;
  sortable?: boolean;
  render?: (item: T, index: number, options: DataTableOptions<T>) => React.ReactNode;
};

export type DataTableOptions<T> = {
  page: number;
  itemsPerPage: number;
  sortBy?: keyof T;
  sortDesc?: boolean;
};

export type DataTableProps<T> = {
  headers: Header<T>[];
  items: T[];
  totalItems: number;
  loading?: boolean;
  options: DataTableOptions<T>;
  onOptionsChange?: (options: DataTableOptions<T>) => void;
};

export function DataTable<T>({
  headers,
  items,
  totalItems,
  loading,
  options,
  onOptionsChange,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(totalItems / options.itemsPerPage);
  const start = (options.page - 1) * options.itemsPerPage + 1;
  const end = Math.min(options.page * options.itemsPerPage, totalItems);

  const updateSort = (key: keyof T) => {
    if (!onOptionsChange) return;
    const isSame = options.sortBy === key;
    const newOptions = {
      ...options,
      sortBy: key,
      sortDesc: isSame ? !options.sortDesc : false,
      page: 1,
    };
    onOptionsChange(newOptions);
  };

  const updatePage = (page: number) => {
    if (!onOptionsChange) return;
    onOptionsChange({ ...options, page });
  };

  const updateItemsPerPage = (size: number) => {
    if (!onOptionsChange) return;
    onOptionsChange({ ...options, itemsPerPage: size, page: 1 });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto border rounded-xl shadow-sm">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              {headers.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-4 py-2 whitespace-nowrap ${col.sortable ? "cursor-pointer select-none" : ""}`}
                  onClick={() => col.sortable && updateSort(col.key)}
                >
                  {col.title}
                  {col.sortable && options.sortBy === col.key && (
                    <span className="ml-1 inline-block">
                      {options.sortDesc ? "↓" : "↑"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={headers.length} className="text-center py-4">
                  Memuat data...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="text-center py-4">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              items.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t">
                  {headers.map((col) => (
                    <td key={String(col.key)} className="px-4 py-2 whitespace-nowrap">
                      {col.render ? col.render(row, rowIndex, options) : String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-2 text-sm">
        <div>
          Menampilkan {start} - {end} dari {totalItems} entri
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Baris per halaman:</label>
          <select
            className="border px-2 py-1 rounded"
            value={options.itemsPerPage}
            onChange={(e) => updateItemsPerPage(Number(e.target.value))}
          >
            {[5, 10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>

          <button
            onClick={() => updatePage(1)}
            disabled={options.page === 1}
            className="px-2 py-1 border rounded disabled:opacity-50"
            title="Halaman pertama"
          >
            <ChevronsLeft size={16} />
          </button>

          <button
            onClick={() => updatePage(options.page - 1)}
            disabled={options.page === 1}
            className="px-2 py-1 border rounded disabled:opacity-50"
            title="Sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>

          <input
            type="number"
            className="w-14 border px-2 py-1 rounded text-center"
            value={options.page}
            min={1}
            max={totalPages}
            onChange={(e) => updatePage(Number(e.target.value))}
          />

          <button
            onClick={() => updatePage(options.page + 1)}
            disabled={options.page >= totalPages}
            className="px-2 py-1 border rounded disabled:opacity-50"
            title="Selanjutnya"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => updatePage(totalPages)}
            disabled={options.page >= totalPages}
            className="px-2 py-1 border rounded disabled:opacity-50"
            title="Halaman terakhir"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
