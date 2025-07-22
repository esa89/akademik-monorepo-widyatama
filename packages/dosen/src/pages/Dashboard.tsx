import { HiCheck } from "react-icons/hi";
import { Button } from "@widyatama/ui";
import { FaHandPaper } from "react-icons/fa";
import StatCardKuliah from "@/components/cards/StatCardKuliah";
import StatCardTotKuliah from "@/components/cards/StatCardTotKuliah";

export default function Dashboard() {
  return (
    <div className="flex lg:flex-row gap-6">
      {/* KONTEN KIRI */}
      <div className="size-14 grow space-y-6">
        {/* Header Welcome */}
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-medium flex items-center gap-2">
            <FaHandPaper className="text-yellow-500" />
            Welcome, Esa Fauzi!
          </h1>
          <p className="text-sm text-gray-500">Jumat, 12 Jan 2023</p>
        </div>

        {/* Jadwal Selanjutnya */}
        <div className="bg-gray-100 rounded-lg p-4 flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-lg">Kuliah Anda Selanjutnya</h2>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-bold text-sm">Advanced Web Design</p>
                <p className="text-sm text-gray-600">Pukul: 1.30 PM–3.00 PM</p>
              </div>
              <Button variant="primary" className="flex items-center gap-2">
                <HiCheck />
                Absen
              </Button>
            </div>
          </div>
          <img src="/Isolation_Mode.svg" alt="Hero" className="h-24 hidden md:block" />
        </div>

        {/* Jadwal Hari Ini */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              📚 Jadwal Anda Hari Ini
            </h2>
            <a href="#" className="text-xs text-blue-600">View all →</a>
          </div>

          <div className="flex flex-wrap justify-start gap-4">
            <StatCardKuliah
              title="Graphic Fundamentals"
              code="ART101"
              lecturer="Prof. Smith"
              time="9:00 AM – 10:30 AM"
              location="Design Studio A"
              color="border-purple-400"
            />
            <StatCardKuliah
              title="Advanced Web Design"
              code="ITD201"
              lecturer="Dr. Johnson"
              time="1:30 PM – 3:00 PM"
              location="Computer Lab 3"
              color="border-yellow-400"
            />
            <StatCardKuliah
              title="User Experience Research"
              code="UXD301"
              lecturer="Prof. Davis"
              time="11:00 AM – 12:30 AM"
              location="Design Lab 2"
              color="border-sky-400"
            />
            <StatCardKuliah
              title="3D Animation Techniques"
              code="ANI301"
              lecturer="Dr. Martinez"
              time="2:00 PM – 5:00 PM"
              location="Animation Studio"
              color="border-green-400"
            />
            <StatCardKuliah
              title="User Experience Research"
              code="UXD301"
              lecturer="Prof. Davis"
              time="11:00 AM – 12:30 AM"
              location="Design Lab 2"
              color="border-sky-400"
            />
            <StatCardKuliah
              title="3D Animation Techniques"
              code="ANI301"
              lecturer="Dr. Martinez"
              time="2:00 PM – 5:00 PM"
              location="Animation Studio"
              color="border-green-400"
            />
          </div>
        </div>

        {/* Total Perkuliahan */}
        <div>
          <h2 className="font-semibold text-sm mb-2">📊 Total Perkuliahan</h2>
          <div className="flex flex-wrap gap-6">
            <StatCardTotKuliah count="3/16" title="Graphic Fundamentals" code="ITD201" color="#c4b5fd" />
            <StatCardTotKuliah count="3/16" title="Advanced Web Design" code="ITD201" color="#facc15" />
            <StatCardTotKuliah count="3/16" title="Advanced Web Design" code="ITD201" color="#38bdf8" />
            <StatCardTotKuliah count="3/16" title="Advanced Web Design" code="ITD201" color="#d4d4d8" />
            <StatCardTotKuliah count="3/16" title="Advanced Web Design" code="ITD201" color="#fca5a5" />
            <StatCardTotKuliah count="3/16" title="Advanced Web Design" code="ITD201" color="#86efac" />
          </div>
        </div>
      </div>

      
    </div>
  );
}
