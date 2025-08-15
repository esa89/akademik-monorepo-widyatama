// packages/dosen/src/components/nilai/BobotNilaiForm.tsx

import { Input, Button } from "@widyatama/ui";
import React from "react";

type BobotItem = {
  key: string;
  label: string;
  defaultPercentage: string;
};

const bobotData: BobotItem[] = [
  { key: "kehadiran", label: "Kehadiran", defaultPercentage: "10%" },
  { key: "tugas", label: "Tugas", defaultPercentage: "10%" },
  { key: "kuis", label: "Kuis", defaultPercentage: "20%" },
  { key: "uts", label: "UTS", defaultPercentage: "30%" },
  { key: "uas", label: "UAS", defaultPercentage: "30%" },
];

export const BobotNilaiForm: React.FC = () => {
  const [bobot, setBobot] = React.useState<Record<string, string>>({});

  const handleChange = (key: string, value: string) => {
    setBobot((prev) => ({ ...prev, [key]: value }));
  };

  const handleAmbilDariProdi = () => {
    const newBobot: Record<string, string> = {};
    bobotData.forEach((item) => {
      newBobot[item.key] = item.defaultPercentage.replace("%", "");
    });
    setBobot(newBobot);
  };

  return (
    <div className="border rounded-md p-4 space-y-4 shadow-sm bg-white">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Bobot Nilai</h2>
        <Button variant="outline" onClick={handleAmbilDariProdi}>
          Ambil Dari Persentase Jurusan
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 font-semibold border-b pb-2">
        <div>Komponen</div>
        <div>Persentase</div>
        <div>Persentase Prodi</div>
      </div>

      {bobotData.map((item) => (
        <div
          key={item.key}
          className="grid grid-cols-3 gap-4 items-center border-b py-2"
        >
          <div>{item.label}</div>
          <Input
            placeholder="Input text"
            value={bobot[item.key] || ""}
            onChange={(e) => handleChange(item.key, e.target.value)}
          />
          <div>{item.defaultPercentage}</div>
        </div>
      ))}
    </div>
  );
};
