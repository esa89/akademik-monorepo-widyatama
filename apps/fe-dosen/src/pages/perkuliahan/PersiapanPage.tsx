"use client";

import { Card, Input, Button, Table } from "@widyatama/ui";
import { useState } from "react";

interface MataKuliah {
  kode: string;
  nama: string;
  sks: number;
}

const dummyMataKuliah: MataKuliah[] = [
  { kode: "190651006", nama: "Desain dan Analisis Algoritma (strategi Algoritma)", sks: 3 },
  { kode: "190633007", nama: "Pemrograman Berorientasi Objek I", sks: 3 },
  { kode: "190643007", nama: "Pemrograman Berorientasi Objek II", sks: 3 },
  { kode: "190633005", nama: "Struktur Data & Algoritma Lanjut", sks: 2 },
  { kode: "190632006", nama: "Struktur Data & Algoritma Lanjut Praktikum", sks: 1 },
];

export default function PersiapanPage() {
  const [semester, setSemester] = useState("Ganjil 2024/2025");
  const [search, setSearch] = useState("");

  const filtered = dummyMataKuliah.filter((mk) =>
    mk.nama.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">RENCANA PEMBELAJARAN</h1>

      <Card className="p-4 space-y-4">
        <div>
          <p className="font-semibold text-gray-700">Semester</p>
          <Input
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full md:w-64 mt-1"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="secondary">Reset</Button>
          <Button variant="primary">Filter</Button>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            Show <strong>10</strong> entries
          </div>
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>

        <Table
          columns={[
            { label: "No", render: (_, i) => i + 1 },
            { label: "Matakuliah", render: (item) => `${item.kode} - ${item.nama}` },
            { label: "SKS", render: (item) => item.sks },
            {
              label: "Action",
              render: () => (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    SAP
                  </Button>
                  <Button size="sm" variant="outline">
                    RPS
                  </Button>
                </div>
              ),
            },
          ]}
          data={filtered}
        />

        <div className="text-sm text-gray-500">
          Showing 1 to {filtered.length} of {filtered.length} entries
        </div>
      </Card>
    </div>
  );
}
