import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, type DataTableOptions, type Header } from "@widyatama/ui";
import { Pencil, CheckCircle, Download } from "lucide-react";

// Tipe data untuk item laporan nilai
export type LaporanNilaiItem = {
  kode: string;
  mataKuliah: string;
  jurusan: string;
  ttlJadwal: string;
  kelas: string;
  reg: string;
  status: "Belum Diinput" | "Sudah Final";
};

// Dummy data untuk tabel
const dummyData: LaporanNilaiItem[] = Array.from({ length: 25 }, (_, i) => ({
  kode: `MK${i + 101}`,
  mataKuliah: `Mata Kuliah ${i + 1}`,
  jurusan: i % 2 === 0 ? "Informatika" : "Sistem Informasi",
  ttlJadwal: "Senin, 07.00–09.00",
  kelas: ["A", "B", "C"][i % 3],
  reg: ["A", "B1", "B2"][i % 3],
  status: i % 4 === 0 ? "Sudah Final" : "Belum Diinput",
}));

export default function LaporanNilai() {
  const navigate = useNavigate();

  const [options, setOptions] = useState<DataTableOptions<LaporanNilaiItem>>({
    page: 1,
    itemsPerPage: 10,
    sortBy: undefined,
    sortDesc: false,
  });

  const handleEdit = (item: LaporanNilaiItem) => {
    navigate(`/nilai/input/${item.kode}`);
  };

  const paginated = dummyData.slice(
    (options.page - 1) * options.itemsPerPage,
    options.page * options.itemsPerPage
  );

  const headers: Header<LaporanNilaiItem>[] = [
    {
      key: "no" as keyof LaporanNilaiItem,
      title: "No",
      render: (_item, index, opts) =>
        opts.itemsPerPage * (opts.page - 1) + index + 1,
    },
    { key: "kode", title: "Kode" },
    { key: "mataKuliah", title: "Mata Kuliah" },
    { key: "jurusan", title: "Jurusan" },
    { key: "ttlJadwal", title: "Ttl. Jadwal Kuliah" },
    { key: "kelas", title: "Kelas" },
    { key: "reg", title: "Reg" },
    {
      key: "status",
      title: "Status",
      render: (item) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            item.status === "Sudah Final"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: "inputNilai" as keyof LaporanNilaiItem,
      title: "Input Nilai",
      render: (item) =>
        item.status === "Sudah Final" ? (
          <CheckCircle className="text-green-600" size={18} />
        ) : (
          <Pencil
            className="text-blue-600 cursor-pointer"
            size={18}
            onClick={() => handleEdit(item)}
          />
        ),
    },
    {
      key: "laporan" as keyof LaporanNilaiItem,
      title: "Laporan",
      render: (item) =>
        item.status === "Sudah Final" ? (
          <Download className="text-gray-700 cursor-pointer" size={18} />
        ) : (
          <span className="text-gray-400">–</span>
        ),
    },
  ];

  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold mb-4">Laporan Nilai</h1>
      <DataTable<LaporanNilaiItem>
        headers={headers}
        items={paginated}
        totalItems={dummyData.length}
        loading={false}
        options={options}
        onOptionsChange={setOptions}
      />
    </div>
  );
}
