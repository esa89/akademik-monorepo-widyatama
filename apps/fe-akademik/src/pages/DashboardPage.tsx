import { StatCard } from '@/components/common/StatCard';
import { Card } from '@widyatama/ui';
import {
  Building2,
  GraduationCap,
  BookMarked,
  CalendarDays,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { facultyService } from '@/services/faculty.service';
import { studyProgramService } from '@/services/studyProgram.service';
import { courseService } from '@/services/course.service';
import { academicSemesterService } from '@/services/academicSemester.service';

const chartData = [
  { name: 'Jan', fakultas: 4, prodi: 12, matkul: 45 },
  { name: 'Feb', fakultas: 5, prodi: 14, matkul: 52 },
  { name: 'Mar', fakultas: 5, prodi: 16, matkul: 58 },
  { name: 'Apr', fakultas: 6, prodi: 18, matkul: 64 },
  { name: 'Mei', fakultas: 6, prodi: 20, matkul: 70 },
  { name: 'Jun', fakultas: 7, prodi: 22, matkul: 78 },
  { name: 'Jul', fakultas: 7, prodi: 24, matkul: 85 },
];

const barData = [
  { name: 'Teknik', value: 8 },
  { name: 'Ekonomi', value: 6 },
  { name: 'Hukum', value: 4 },
  { name: 'Kedokteran', value: 3 },
  { name: 'Sosial', value: 5 },
];

export default function DashboardPage() {
  const { data: faculties } = useQuery({
    queryKey: ['faculties-count'],
    queryFn: () => facultyService.getAll({ page: 1, limit: 1 }),
  });

  const { data: studyPrograms } = useQuery({
    queryKey: ['study-programs-count'],
    queryFn: () => studyProgramService.getAll({ page: 1, limit: 1 }),
  });

  const { data: courses } = useQuery({
    queryKey: ['courses-count'],
    queryFn: () => courseService.getAll({ page: 1, limit: 1 }),
  });

  const { data: semesters } = useQuery({
    queryKey: ['semesters-current'],
    queryFn: () => academicSemesterService.getAll({ page: 1, limit: 1, isCurrent: true }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Ringkasan data akademik terkini</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Fakultas"
          value={faculties?.meta.total ?? 0}
          icon={<Building2 size={20} />}
          trend="+12%"
          trendUp
        />
        <StatCard
          title="Total Program Studi"
          value={studyPrograms?.meta.total ?? 0}
          icon={<GraduationCap size={20} />}
          trend="+8%"
          trendUp
        />
        <StatCard
          title="Total Mata Kuliah"
          value={courses?.meta.total ?? 0}
          icon={<BookMarked size={20} />}
          trend="+15%"
          trendUp
        />
        <StatCard
          title="Semester Aktif"
          value={semesters?.data[0]?.name ?? '-'}
          icon={<CalendarDays size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Pertumbuhan Data Akademik</h3>
              <p className="text-xs text-gray-500">Tren penambahan data 7 bulan terakhir</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Fakultas
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                Prodi
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="fakultas" stroke="#373B85" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="prodi" stroke="#EB891A" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="matkul" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Distribusi Program Studi</h3>
            <p className="text-xs text-gray-500">Berdasarkan fakultas</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#373B85" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Aktivitas Terbaru</h3>
            <p className="text-xs text-gray-500">Log aktivitas sistem akademik</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { action: 'Fakultas Teknik ditambahkan', time: '2 jam lalu', icon: <Building2 size={16} /> },
            { action: 'Kurikulum 2024 diperbarui', time: '5 jam lalu', icon: <TrendingUp size={16} /> },
            { action: 'Semester Ganjil 2024/2025 diaktifkan', time: '1 hari lalu', icon: <CalendarDays size={16} /> },
            { action: '15 Mata Kuliah baru diimpor', time: '2 hari lalu', icon: <BookMarked size={16} /> },
            { action: 'Program Studi S1 Informatika ditambahkan', time: '3 hari lalu', icon: <Users size={16} /> },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="p-2 bg-white rounded-md text-primary">{item.icon}</div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{item.action}</p>
                <p className="text-xs text-gray-500">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
