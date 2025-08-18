import { useState } from "react";
import { Meta } from "@storybook/react";
import { DataTable, DataTableOptions, Header } from "./DataTable";
import { Pencil, CheckCircle, Download } from "lucide-react";

export default {
  title: "Components/DataTable",
  component: DataTable,
} as Meta;

type LaporanNilaiItem = {
  kode: string;
  mataKuliah: string;
  jurusan: string;
  ttlJadwal: string;
  kelas: string;
  ttlKelas: string;
  status: "Belum Diinput" | "Sudah Final";
};

const headers: Header<LaporanNilaiItem>[] = [
  {
    key: "no" as keyof LaporanNilaiItem,
    title: "No",
    render: (_item, index, options) =>
      options.itemsPerPage * (options.page - 1) + index + 1,
  },
  { key: "kode", title: "Kode" },
  { key: "mataKuliah", title: "Mata Kuliah" },
  { key: "jurusan", title: "Jurusan" },
  { key: "ttlJadwal", title: "Ttl. Jadwal Kuliah" },
  { key: "kelas", title: "Kelas" },
  { key: "ttlKelas", title: "Ttl. Kls" },
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
        <Pencil className="text-blue-600 cursor-pointer" size={18} />
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

const dummyData: LaporanNilaiItem[] = Array.from({ length: 20 }, (_, i) => ({
  kode: `MK${i + 101}`,
  mataKuliah: `Mata Kuliah ${i + 1}`,
  jurusan: i % 2 === 0 ? "Informatika" : "Sistem Informasi",
  ttlJadwal: "Senin, 07.00–09.00",
  kelas: ["A", "B", "C"][i % 3],
  ttlKelas: ["A", "B", "C"][i % 3],
  status: i % 4 === 0 ? "Sudah Final" : "Belum Diinput",
}));

export const Default = () => {
  const [options, setOptions] = useState<DataTableOptions<LaporanNilaiItem>>({
    page: 1,
    itemsPerPage: 10,
    sortBy: undefined,
    sortDesc: false,
  });

  const paginated = dummyData.slice(
    (options.page - 1) * options.itemsPerPage,
    options.page * options.itemsPerPage
  );

  return (
    <div className="p-4">
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
};
