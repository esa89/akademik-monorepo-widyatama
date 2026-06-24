import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@widyatama/sso-react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Users, ChevronRight, AlertCircle, Filter } from "lucide-react";
import { lecturerService, academicClassService, semesterService } from "@/services/academic.service";
import type { AcademicClass } from "@/types";

export default function NilaiKelasPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");

  const { data: lecturerData, isLoading: lecturerLoading } = useQuery({
    queryKey: ["lecturer-me", user?.email],
    queryFn: () => lecturerService.findByEmail(user!.email),
    enabled: !!user?.email,
  });

  const lecturer = lecturerData?.data?.find(
    (l) => l.email.toLowerCase() === user?.email?.toLowerCase()
  );

  const { data: semesterData } = useQuery({
    queryKey: ["semesters"],
    queryFn: () => semesterService.getAll(),
  });

  const semesters = semesterData?.data ?? [];

  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ["my-classes", lecturer?.id, selectedSemesterId],
    queryFn: () =>
      academicClassService.getAll({
        lecturerId: lecturer!.id,
        semesterId: selectedSemesterId || undefined,
        limit: 100,
      }),
    enabled: !!lecturer?.id,
  });

  const classes: AcademicClass[] = classData?.data ?? [];
  const isLoading = lecturerLoading || classLoading;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Input Nilai</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Pilih kelas untuk memasukkan nilai mahasiswa berbasis CPMK
          </p>
        </div>

        {/* Semester filter */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedSemesterId}
            onChange={(e) => setSelectedSemesterId(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[200px]"
          >
            <option value="">Semua Semester</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-gray-400">{classes.length} kelas ditemukan</p>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !lecturer ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <AlertCircle className="w-10 h-10 mb-2 text-yellow-400" />
          <p className="text-sm">Akun dosen tidak ditemukan untuk email {user?.email}</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <BookOpen className="w-10 h-10 mb-2" />
          <p className="text-sm">
            {selectedSemesterId
              ? "Tidak ada kelas pada semester yang dipilih"
              : "Belum ada kelas yang ditugaskan"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {classes.map((cls) => (
            <ClassRow
              key={cls.id}
              cls={cls}
              onClick={() => navigate(`/nilai/${cls.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClassRow({ cls, onClick }: { cls: AcademicClass; onClick: () => void }) {
  const primaryLecturer = cls.lecturers.find((l) => l.role === "PRIMARY") ?? cls.lecturers[0];
  const lecturerName = primaryLecturer
    ? `${primaryLecturer.lecturer.frontTitle ? primaryLecturer.lecturer.frontTitle + " " : ""}${primaryLecturer.lecturer.name}${primaryLecturer.lecturer.backTitle ? ", " + primaryLecturer.lecturer.backTitle : ""}`
    : "–";

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all p-4 flex items-center justify-between group"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-gray-800">{cls.course.name}</p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                cls.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {cls.isActive ? "Aktif" : "Nonaktif"}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {cls.course.code} · Kelas {cls.code} · {cls.course.sks} SKS
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <span className="text-xs text-gray-500">
              <Users className="inline w-3 h-3 mr-1" />
              {cls.totalStudents} mahasiswa
            </span>
            <span className="text-xs text-gray-500">{cls.semester.name}</span>
            <span className="text-xs text-gray-500">{lecturerName}</span>
          </div>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0" />
    </button>
  );
}
