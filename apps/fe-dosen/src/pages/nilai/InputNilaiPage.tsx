"use client";

import { BobotNilaiForm } from "@/components/nilai/BobotNilaiForm";
import { TableInputNilai, type NilaiMahasiswa } from "@/components/nilai/TableInputNilai";
import { Button } from "@widyatama/ui";
import { useState } from "react";

const dummyData: NilaiMahasiswa[] = [
  {
    npm: "1234",
    nama: "Jupri ada dibelakang",
    jurusan: "Informatika",
    nilai: { tugas: "", kuis: "", uts: "", uas: "", catatan: "" },
  },
  {
    npm: "2345",
    nama: "Lili",
    jurusan: "Informatika",
    nilai: { tugas: "", kuis: "", uts: "", uas: "", catatan: "" },
  },
];

export default function InputNilaiPage() {
  const [dataNilai, setDataNilai] = useState<NilaiMahasiswa[]>(dummyData);

  const handleSave = () => {
    console.log("Data nilai disimpan:", dataNilai);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500">
        <span className="text-blue-600 font-medium">Laporan Nilai</span> &gt; ART01 - Graphic Desain Fundamental
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-[#F5F7FF] border rounded-md p-4 space-y-1 text-sm font-medium text-gray-700 h-full">
          <div className="text-right font-semibold text-black text-base">Esa Fauzi, S.T., M.T.</div>
          <div className="text-blue-700 text-sm ">Input Nilai</div>
          <div className="text-black font-bold text-lg">Reg A – ART01 - Graphic Desain Fundamental</div>
          <div className="text-blue-700 text-sm ">Kelas A</div>
          <div className="text-blue-700 text-sm ">Jurusan Teknik Informatika</div>
        </div>

        <BobotNilaiForm /> {/* pastikan root div-nya pakai h-full */}
      </div>

      {/* Tabel Input Nilai */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Nilai Mahasiswa</h2>
        <TableInputNilai items={dataNilai} onChange={setDataNilai} />
      </div>

      {/* Tombol Aksi */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => history.back()}>Kembali</Button>
        <Button onClick={handleSave}>Simpan</Button>
      </div>
    </div>
  );
}
