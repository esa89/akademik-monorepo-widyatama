import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Header, DataTableOptions } from "@widyatama/ui";
import { DataTable } from "@widyatama/ui";

type StatusTA =
  | "Belum Ambil"
  | "Pengajuan Judul"
  | "Pembimbing"
  | "Proposal"
  | "Seminar"
  | "TA 1"
  | "TA 2"
  | "Sidang"
  | "Lulus";

export type MahasiswaTA = {
  npm: string;
  nama: string;
  prodi: string;
  angkatan?: string;
  pembimbing?: string;
  status: StatusTA;
  progress?: number; // 0-100
  /** kolom dummy agar Header<T>.key unik untuk "Detail" */
  _detail?: string;
};

const DUMMY: Readonly<MahasiswaTA[]> = [
  { npm: "2310111001", nama: "Alya Putri",  prodi: "Informatika",      angkatan: "2021", pembimbing: "Esa Fauzi, S.T.M.T.", status: "Proposal",         progress: 35 },
  { npm: "2310111002", nama: "Bagas Pratama", prodi: "Sistem Informasi", angkatan: "2020", pembimbing: "Esa Fauzi, S.T.M.T.", status: "TA 1",            progress: 60 },
  { npm: "2310111003", nama: "Citra Lestari", prodi: "Informatika",      angkatan: "2020", pembimbing: "Esa Fauzi, S.T.M.T.", status: "Seminar",         progress: 80 },
  { npm: "2310111004", nama: "Dimas Ardi",    prodi: "Teknik Industri",  angkatan: "2019", pembimbing: "Esa Fauzi, S.T.M.T.", status: "Lulus",           progress: 100 },
  { npm: "2310111005", nama: "Eka Saputra",   prodi: "Informatika",      angkatan: "2021", pembimbing: "Esa Fauzi, S.T.M.T.", status: "Pengajuan Judul", progress: 10 },
] as const;

function badgeClasses(status: StatusTA): string {
  switch (status) {
    case "Belum Ambil":
    case "Pengajuan Judul":
      return "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
    case "Pembimbing":
    case "Proposal":
      return "bg-amber-100 text-amber-800 ring-1 ring-amber-200";
    case "TA 1":
    case "TA 2":
      return "bg-blue-100 text-blue-800 ring-1 ring-blue-200";
    case "Seminar":
    case "Sidang":
      return "bg-purple-100 text-purple-800 ring-1 ring-purple-200";
    case "Lulus":
      return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200";
    default:
      return "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  }
}

export default function MonitoringTA() {
  const [q, setQ] = useState<string>("");
  const [options, setOptions] = useState<DataTableOptions<MahasiswaTA>>({
    page: 1,
    itemsPerPage: 10,
    sortBy: undefined,
    sortDesc: false,
  });

  // 1) filter
  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    if (!key) return DUMMY.slice();
    return DUMMY.filter((m) =>
      [m.npm, m.nama, m.prodi, m.angkatan ?? "", m.pembimbing ?? "", m.status, String(m.progress ?? "")]
        .join(" ")
        .toLowerCase()
        .includes(key)
    );
  }, [q]);

  // 2) sort (client-side) — aman untuk TS dengan type guard
  const sorted = useMemo(() => {
    const { sortBy, sortDesc } = options;
    if (!sortBy) return filtered;

    const arr = filtered.slice();
    arr.sort((a, b) => {
      const av = a[sortBy as keyof MahasiswaTA];
      const bv = b[sortBy as keyof MahasiswaTA];

      const aType = typeof av;
      const bType = typeof bv;

      if (aType === "number" && bType === "number") {
        return sortDesc ? (bv as number) - (av as number) : (av as number) - (bv as number);
      }

      const aStr = String(av ?? "");
      const bStr = String(bv ?? "");
      const cmp = aStr.localeCompare(bStr, "id", { sensitivity: "base" });
      return sortDesc ? -cmp : cmp;
    });
    return arr;
  }, [filtered, options]);

  // 3) paginate
  const start = (options.page - 1) * options.itemsPerPage;
  const pageItems = useMemo(
    () => sorted.slice(start, start + options.itemsPerPage),
    [sorted, start, options.itemsPerPage]
  );

  const headers = useMemo(
    () =>
      [
        { key: "npm", title: "NPM", sortable: true, render: (it: MahasiswaTA) => <span className="font-medium">{it.npm}</span> },
        { key: "nama", title: "Nama", sortable: true },
        { key: "prodi", title: "Prodi", sortable: true },
        { key: "angkatan", title: "Angkatan", sortable: true, render: (it: MahasiswaTA) => it.angkatan ?? "-" },
        { key: "pembimbing", title: "Pembimbing", sortable: true, render: (it: MahasiswaTA) => it.pembimbing ?? "-" },
        {
          key: "status",
          title: "Status",
          sortable: true,
          render: (it: MahasiswaTA) => (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ring-1 ${badgeClasses(it.status)}`}>
              {it.status}
            </span>
          ),
        },
        {
          key: "progress",
          title: "Progress",
          sortable: true,
          render: (it: MahasiswaTA) => (
            <div className="flex items-center gap-2">
              <div className="h-2 w-28 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-indigo-600"
                  style={{ width: `${Math.min(Math.max(it.progress ?? 0, 0), 100)}%` }}
                  aria-label={`Progress ${it.progress ?? 0}%`}
                />
              </div>
              <span className="tabular-nums text-gray-600">{it.progress ?? 0}%</span>
            </div>
          ),
        },
        {
          key: "_detail", // kolom dummy agar key unik & memenuhi keyof T
          title: "Detail",
          render: (it: MahasiswaTA) => (
            <div className="text-right">
              <Link
                to={`/monitoring-ta/${it.npm}`}
                className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-100"
              >
                Lihat Detail
              </Link>
            </div>
          ),
        },
      ] satisfies Header<MahasiswaTA>[],
    []
  );

  return (
    <section className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header + Search */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Monitoring Tugas Akhir</h1>
          <p className="text-sm text-gray-500">Pantau progres dan status TA mahasiswa.</p>
        </div>
        <div className="w-full sm:w-80">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Cari Mahasiswa (NPM/Nama/Prodi/Pembimbing/Status)
          </label>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOptions((o: DataTableOptions<MahasiswaTA>) => ({ ...o, page: 1 }));
            }}
            placeholder="Contoh: 2310 / Alya / Informatika / Proposal"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500"
          />
        </div>
      </div>

      <DataTable<MahasiswaTA>
        headers={headers}
        items={pageItems}
        totalItems={sorted.length}
        loading={false}
        options={options}
        onOptionsChange={setOptions}
      />
    </section>
  );
}
