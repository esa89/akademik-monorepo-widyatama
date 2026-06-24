import { useQuery } from "@tanstack/react-query";
import { useUser } from "@widyatama/sso-react";
import { BookOpen, GraduationCap, Users, ClipboardCheck, AlertCircle } from "lucide-react";
import { FaHandPaper } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { lecturerService, academicClassService } from "@/services/academic.service";
import type { AcademicClass } from "@/types";

const CLASS_COLORS = [
  "border-purple-400",
  "border-yellow-400",
  "border-sky-400",
  "border-green-400",
  "border-rose-400",
  "border-orange-400",
];

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className={`bg-white rounded-xl border-l-4 ${color} shadow-sm p-4 flex items-center gap-4`}>
      <div className="text-gray-400">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function ClassCard({ cls, index, onNavigate }: { cls: AcademicClass; index: number; onNavigate: (id: string) => void }) {
  const color = CLASS_COLORS[index % CLASS_COLORS.length];
  const primaryLecturer = cls.lecturers.find((l) => l.role === "PRIMARY") ?? cls.lecturers[0];
  const lecturerName = primaryLecturer
    ? `${primaryLecturer.lecturer.frontTitle ? primaryLecturer.lecturer.frontTitle + " " : ""}${primaryLecturer.lecturer.name}`
    : "–";

  return (
    <div className={`rounded-xl shadow-sm border-t-4 ${color} bg-white p-4 flex flex-col gap-3 min-w-[220px] max-w-[250px]`}>
      <div>
        <p className="font-semibold text-sm text-gray-800 leading-tight">{cls.course.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{cls.course.code} · Kelas {cls.code}</p>
        <div className="h-px bg-gray-100 my-2" />
        <p className="text-xs text-gray-600">{lecturerName}</p>
        <p className="text-xs text-gray-500 mt-1">
          <Users className="inline w-3 h-3 mr-1" />
          {cls.totalStudents} mahasiswa · {cls.course.sks} SKS
        </p>
      </div>
      <button
        onClick={() => onNavigate(cls.id)}
        className="mt-auto text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 transition-colors"
      >
        Input Nilai
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const navigate = useNavigate();

  const { data: lecturerData, isLoading: lecturerLoading } = useQuery({
    queryKey: ["lecturer-me", user?.email],
    queryFn: () => lecturerService.findByEmail(user!.email),
    enabled: !!user?.email,
  });

  const lecturer = lecturerData?.data?.find(
    (l) => l.email.toLowerCase() === user?.email?.toLowerCase()
  );

  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ["my-classes", lecturer?.id],
    queryFn: () =>
      academicClassService.getAll({ lecturerId: lecturer!.id, isActive: true, limit: 100 }),
    enabled: !!lecturer?.id,
  });

  const classes: AcademicClass[] = classData?.data ?? [];
  const totalStudents = classes.reduce((sum, c) => sum + c.totalStudents, 0);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (lecturerLoading || classLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!lecturer && !lecturerLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
          <p className="font-medium">Akun dosen tidak ditemukan</p>
          <p className="text-sm mt-1">Email {user?.email} belum terdaftar sebagai dosen</p>
        </div>
      </div>
    );
  }

  const displayName = lecturer
    ? `${lecturer.frontTitle ? lecturer.frontTitle + " " : ""}${lecturer.name}`
    : user?.name ?? "Dosen";

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-medium flex items-center gap-2">
          <FaHandPaper className="text-yellow-500" />
          Selamat datang, {displayName}!
        </h1>
        <p className="text-sm text-gray-500">{today}</p>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-5 flex justify-between items-center text-white">
        <div>
          <p className="text-sm opacity-80">Semester Aktif</p>
          <h2 className="text-xl font-bold mt-1">
            {classes[0]?.semester?.name ?? "–"}
          </h2>
          <p className="text-sm opacity-80 mt-1">
            {classes[0]?.semester?.academicYear
              ? `T.A. ${classes[0].semester.academicYear}`
              : "Tidak ada kelas aktif saat ini"}
          </p>
        </div>
        <GraduationCap className="w-16 h-16 opacity-20" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen className="w-8 h-8" />}
          label="Total Kelas"
          value={classes.length}
          color="border-blue-500"
        />
        <StatCard
          icon={<Users className="w-8 h-8" />}
          label="Total Mahasiswa"
          value={totalStudents}
          color="border-green-500"
        />
        <StatCard
          icon={<ClipboardCheck className="w-8 h-8" />}
          label="Total SKS"
          value={classes.reduce((sum, c) => sum + c.course.sks, 0)}
          color="border-yellow-500"
        />
        <StatCard
          icon={<GraduationCap className="w-8 h-8" />}
          label="Program Studi"
          value={lecturer?.studyProgram?.name ?? "–"}
          color="border-purple-500"
        />
      </div>

      {/* Daftar Kelas */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-sm">Kelas Saya</h2>
          <button
            onClick={() => navigate("/nilai")}
            className="text-xs text-blue-600 hover:underline"
          >
            Lihat semua →
          </button>
        </div>

        {classes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2" />
            <p className="text-sm">Belum ada kelas aktif</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {classes.map((cls, i) => (
              <ClassCard
                key={cls.id}
                cls={cls}
                index={i}
                onNavigate={(id) => navigate(`/nilai/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
