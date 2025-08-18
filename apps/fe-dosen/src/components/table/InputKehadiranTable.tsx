"use client";

import { useState } from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaFileAlt,
  FaUsers,
} from "react-icons/fa";
import { Combobox, Input } from "@widyatama/ui";
import { useNavigate } from "react-router-dom";

type KehadiranStatus = true | false | null;

interface MataKuliah {
  kode: string;
  nama: string;
  kehadiran: KehadiranStatus[];
}

const dataMataKuliah: MataKuliah[] = [
  {
    kode: "ART101",
    nama: "Graphic Design Fundamentals",
    kehadiran: [true, false, null],
  },
  {
    kode: "ART101",
    nama: "Digital Illustration",
    kehadiran: [true, true, true],
  },
];

const semesterOptions = [
  { label: "Semester Ganjil", value: "ganjil" },
  { label: "Semester Genap", value: "genap" },
];

export function InputKehadiranTable() {
  const [selectedSemester, setSelectedSemester] = useState("ganjil");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleClick = (action: string, detail?: unknown) => {
    console.log(`Clicked: ${action}`, detail);
  };

  return (
    <div className="space-y-4">
      {/* Filter Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Combobox
          options={semesterOptions}
          value={selectedSemester}
          onChange={setSelectedSemester}
          placeholder="Pilih Semester"
          className="w-[250px]"
        />

        <Input
          placeholder="Cari mata kuliah..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-[250px]"
        />
      </div>

      {/* Tabel Kehadiran */}
      <div className="overflow-auto border rounded">
        <table className="table-auto w-full text-sm border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Mata Kuliah</th>
              <th className="px-2 py-2 text-center">Aksi</th>
              {Array.from({ length: 16 }, (_, i) => (
                <th key={i} className="px-2 py-2 text-center">
                  {i === 7 ? "UTS" : i === 15 ? "UAS" : i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataMataKuliah.map((mk, idx) => (
              <tr key={idx} className="even:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap">
                  {`${mk.kode} - ${mk.nama}`}
                </td>
                <td className="px-2 py-2">
                  <div className="flex gap-2 justify-center">
                    <button
                      title="Lihat Berita Acara"
                      onClick={() => handleClick("berita-acara", mk)}
                    >
                      <FaFileAlt className="text-blue-500 hover:text-blue-700" />
                    </button>
                    <button
                      title="Lihat Absensi"
                      onClick={() => handleClick("lihat-absensi", mk)}
                    >
                      <FaUsers className="text-blue-500 hover:text-blue-700" />
                    </button>
                  </div>
                </td>
                {Array.from({ length: 16 }, (_, i) => {
                  const status = mk.kehadiran[i];
                  const key = `${mk.kode}-${i}`;
                  return (
                    <td key={key} className="text-center">
                      {status === true && (
                        <button
                          title="Absensi sudah diinputkan dan selesai"
                          onClick={() => handleClick("sudah-input", { mk, i })}
                        >
                          <FaCheckCircle className="text-green-500 mx-auto hover:text-green-700" />
                        </button>
                      )}
                      {status === false && (
                        <button
                          title="Absensi Terlewat"
                          onClick={() => handleClick("terlewat", { mk, i })}
                        >
                          <FaTimesCircle className="text-red-500 mx-auto hover:text-red-700" />
                        </button>
                      )}
                      {status === null && (
                        <button
                          title="Absensi belum diinputkan"
                          onClick={() => navigate(`/kehadiran/${mk.kode}/${i + 1}`)}
                        >
                          <FaEdit className="text-blue-700 mx-auto hover:text-blue-900" />
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm pt-4">
        <div className="flex items-center gap-2">
          <FaCheckCircle className="text-green-500" />
          Absensi sudah diinputkan dan selesai
        </div>
        <div className="flex items-center gap-2">
          <FaEdit className="text-blue-700" />
          Absensi belum diinputkan
        </div>
        <div className="flex items-center gap-2">
          <FaTimesCircle className="text-red-500" />
          Absensi Terlewat
        </div>
        <div className="flex items-center gap-2">
          <FaFileAlt className="text-blue-500" />
          Lihat Berita Acara
        </div>
        <div className="flex items-center gap-2">
          <FaUsers className="text-blue-500" />
          Lihat Absensi
        </div>
      </div>
    </div>
  );
}
