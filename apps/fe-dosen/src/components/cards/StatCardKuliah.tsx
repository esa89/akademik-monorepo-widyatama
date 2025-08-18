// src/components/StatCardKuliah.tsx
import { Button } from "@widyatama/ui";
import { HiClock, HiLocationMarker, HiUser } from "react-icons/hi";

type StatCardKuliahProps = {
  title: string;
  code: string;
  lecturer: string;
  time: string;
  location: string;
  color: string; // misal: 'border-purple-400'
};

export default function StatCardKuliah({
  title,
  code,
  lecturer,
  time,
  location,
  color,
}: StatCardKuliahProps) {
  return (
    <div
      className={`rounded-lg shadow-md p-4 w-64 border-t-4 ${color} bg-white flex flex-col justify-between`}
      style={{ minHeight: "220px" }}
    >
      <div>
        <h3 className="font-semibold text-sm">{title} – {code}</h3>
        <div className="h-px bg-gray-300 my-1" />

        <div className="text-sm text-gray-800 space-y-1">
          <div className="flex items-center gap-2">
            <HiUser className="text-gray-500" /> {lecturer}
          </div>
          <div className="flex items-center gap-2">
            <HiClock className="text-gray-500" /> {time}
          </div>
          <div className="flex items-center gap-2">
            <HiLocationMarker className="text-gray-500" /> {location}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Button className="bg-primary text-white px-4 py-1 text-sm">
          Absen
        </Button>
      </div>
    </div>
  );
}
