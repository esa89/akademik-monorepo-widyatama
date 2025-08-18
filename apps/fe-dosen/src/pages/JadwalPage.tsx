import { useEffect, useState } from "react";
import {
  DataTable,
  type Header,
  type DataTableOptions,
  Combobox,
} from "@widyatama/ui";

type Jadwal = {
  kode: string;
  mataKuliah: string;
  jurusan: string;
  jadwalKuliah: string;
  jadwalUTS: string;
  jadwalUAS: string;
  kelas: string;
  ruangan: string;
  reg: string;
};

const headers: Header<Jadwal>[] = [
  { key: "kode", title: "Kode", sortable: true },
  { key: "mataKuliah", title: "Mata Kuliah", sortable: true },
  { key: "jurusan", title: "Jurusan", sortable: true },
  { key: "jadwalKuliah", title: "Jadwal Kuliah", sortable: true },
  { key: "jadwalUTS", title: "Jadwal UTS", sortable: true },
  { key: "jadwalUAS", title: "Jadwal UAS", sortable: true },
  { key: "kelas", title: "Kelas", sortable: true },
  { key: "ruangan", title: "Ruangan", sortable: true },
  { key: "reg", title: "Reg", sortable: true },
];

const dummyData: Jadwal[] = [
  {
    kode: "ART101",
    mataKuliah: "Graphic Design Fundamentals",
    jurusan: "Informatika",
    jadwalKuliah: "Senin, 07.00–09.00",
    jadwalUTS: "Senin, 07.00–09.00",
    jadwalUAS: "Senin, 07.00–09.00",
    kelas: "A",
    ruangan: "Design Studio A",
    reg: "A",
  },
  {
    kode: "ART103",
    mataKuliah: "Digital Illustration",
    jurusan: "Informatika",
    jadwalKuliah: "Senin, 07.00–09.00",
    jadwalUTS: "Senin, 07.00–09.00",
    jadwalUAS: "Senin, 07.00–09.00",
    kelas: "B",
    ruangan: "Computer Lab 2",
    reg: "B1",
  },
  {
    kode: "UXD301",
    mataKuliah: "UX/UI Design Principles",
    jurusan: "Bahasa Inggris",
    jadwalKuliah: "Senin, 07.00–09.00",
    jadwalUTS: "Senin, 07.00–09.00",
    jadwalUAS: "Senin, 07.00–09.00",
    kelas: "C",
    ruangan: "Design Lab 1",
    reg: "A",
  },
  {
    kode: "ART101",
    mataKuliah: "History of Design Essay",
    jurusan: "Informatika",
    jadwalKuliah: "Senin, 07.00–09.00",
    jadwalUTS: "Senin, 07.00–09.00",
    jadwalUAS: "Senin, 07.00–09.00",
    kelas: "A",
    ruangan: "Lecture Hall B",
    reg: "A",
  },
  {
    kode: "ITD201",
    mataKuliah: "Product Design Prototype",
    jurusan: "Informatika",
    jadwalKuliah: "Senin, 07.00–09.00",
    jadwalUTS: "Senin, 07.00–09.00",
    jadwalUAS: "Senin, 07.00–09.00",
    kelas: "A",
    ruangan: "Prototype Lab",
    reg: "A",
  },
  {
    kode: "ART103",
    mataKuliah: "Color Theory and Application",
    jurusan: "Sistem Informasi",
    jadwalKuliah: "Senin, 07.00–09.00",
    jadwalUTS: "Senin, 07.00–09.00",
    jadwalUAS: "Senin, 07.00–09.00",
    kelas: "A",
    ruangan: "Design Studio B",
    reg: "A",
  },
  {
    kode: "ART202",
    mataKuliah: "Visual Communication Design",
    jurusan: "Informatika",
    jadwalKuliah: "Senin, 07.00–09.00",
    jadwalUTS: "Senin, 07.00–09.00",
    jadwalUAS: "Senin, 07.00–09.00",
    kelas: "A",
    ruangan: "Design Studio B",
    reg: "A",
  },
];

const semesterOptions = [
  { label: "Semester Ganjil", value: "ganjil" },
  { label: "Semester Genap", value: "genap" },
];

export default function JadwalPage() {
  const [data, setData] = useState<Jadwal[]>([]);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<DataTableOptions<Jadwal>>({
    page: 1,
    itemsPerPage: 5,
    sortBy: "kode",
    sortDesc: false,
  });
  const [selectedSemester, setSelectedSemester] = useState("ganjil");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      let filtered = dummyData;

      if (searchTerm) {
        filtered = filtered.filter((item) =>
          item.mataKuliah.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      const sorted = [...filtered].sort((a, b) => {
        const key = options.sortBy!;
        const aVal = a[key];
        const bVal = b[key];
        if (aVal < bVal) return options.sortDesc ? 1 : -1;
        if (aVal > bVal) return options.sortDesc ? -1 : 1;
        return 0;
      });

      const start = (options.page - 1) * options.itemsPerPage;
      const end = start + options.itemsPerPage;
      setData(sorted.slice(start, end));
      setLoading(false);
    }, 300);
  }, [options, searchTerm]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Jadwal Perkuliahan</h1>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
        <Combobox
          options={semesterOptions}
          value={selectedSemester}
          onChange={setSelectedSemester}
          placeholder="Pilih Semester"
        />
        <input
          type="text"
          placeholder="Cari mata kuliah..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-3 py-2 rounded w-full sm:w-64 text-sm"
        />
      </div>

      <DataTable<Jadwal>
        headers={headers}
        items={data}
        totalItems={dummyData.length}
        loading={loading}
        options={options}
        onOptionsChange={setOptions}
      />
    </div>
  );
}
