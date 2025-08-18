import { Input, DataTable } from "@widyatama/ui";
import React, { useState } from "react";
import type { Header, DataTableOptions } from "@widyatama/ui";

export type NilaiMahasiswa = {
  npm: string;
  nama: string;
  jurusan: string;
  nilai: {
    tugas: string;
    kuis: string;
    uts: string;
    uas: string;
    catatan: string;
  };
};

type TableInputNilaiProps = {
  items: NilaiMahasiswa[];
  onChange?: (items: NilaiMahasiswa[]) => void;
};

export const TableInputNilai: React.FC<TableInputNilaiProps> = ({
  items,
  onChange,
}) => {
  const [data, setData] = useState<NilaiMahasiswa[]>(items);
  const [options, setOptions] = useState<DataTableOptions<NilaiMahasiswa>>({
    page: 1,
    itemsPerPage: 10,
    sortBy: undefined,
    sortDesc: false,
  });

  const handleValueChange = (
    index: number,
    field: keyof NilaiMahasiswa["nilai"],
    value: string
  ) => {
    const updated = [...data];
    updated[index].nilai = {
      ...updated[index].nilai,
      [field]: value,
    };
    setData(updated);
    onChange?.(updated);
  };

  const headers: Header<NilaiMahasiswa>[] = [
    { key: "npm", title: "NPM" },
    { key: "nama", title: "Nama" },
    { key: "jurusan", title: "Jurusan" },
    {
      key: "nilai",
      title: "Tugas",
      render: (_, index) => (
        <Input
          placeholder="Tugas"
          value={data[index].nilai.tugas}
          onChange={(e) =>
            handleValueChange(index, "tugas", e.target.value)
          }
        />
      ),
    },
    {
      key: "nilai",
      title: "Kuis",
      render: (_, index) => (
        <Input
          placeholder="Kuis"
          value={data[index].nilai.kuis}
          onChange={(e) =>
            handleValueChange(index, "kuis", e.target.value)
          }
        />
      ),
    },
    {
      key: "nilai",
      title: "UTS",
      render: (_, index) => (
        <Input
          placeholder="UTS"
          value={data[index].nilai.uts}
          onChange={(e) =>
            handleValueChange(index, "uts", e.target.value)
          }
        />
      ),
    },
    {
      key: "nilai",
      title: "UAS",
      render: (_, index) => (
        <Input
          placeholder="UAS"
          value={data[index].nilai.uas}
          onChange={(e) =>
            handleValueChange(index, "uas", e.target.value)
          }
        />
      ),
    },
    {
      key: "nilai",
      title: "Catatan",
      render: (_, index) => (
        <Input
          placeholder="Catatan"
          value={data[index].nilai.catatan}
          onChange={(e) =>
            handleValueChange(index, "catatan", e.target.value)
          }
        />
      ),
    },
  ];

  return (
    <DataTable
      headers={headers}
      items={data}
      totalItems={data.length}
      options={options}
      onOptionsChange={setOptions}
    />
  );
};
