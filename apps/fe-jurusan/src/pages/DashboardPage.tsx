import { useQuery } from '@tanstack/react-query';
import { Target, BookOpen, Layers, ClipboardCheck, BarChart3, TrendingUp, GraduationCap } from 'lucide-react';
import { cplService, cpmkService, subCpmkService, assessmentService } from '@/services/obe.service';
import { QUERY_KEYS } from '@/constants';
import { StatCardSkeleton } from '@/components/common/LoadingSkeleton';
import { useUser } from '@widyatama/sso-react';

const statConfig = [
  { key: 'cpl', label: 'Total CPL', icon: Target, color: 'bg-blue-50 border-blue-200', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { key: 'cpmk', label: 'Total CPMK', icon: BookOpen, color: 'bg-indigo-50 border-indigo-200', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { key: 'subCpmk', label: 'Total Sub CPMK', icon: Layers, color: 'bg-purple-50 border-purple-200', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  { key: 'assessment', label: 'Total Assessment', icon: ClipboardCheck, color: 'bg-emerald-50 border-emerald-200', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
];

export default function DashboardPage() {
  const { user } = useUser();

  const cplQuery = useQuery({
    queryKey: QUERY_KEYS.cpl({ page: 1, limit: 1 }),
    queryFn: () => cplService.getAll({ page: 1, limit: 1 }),
  });

  const cpmkQuery = useQuery({
    queryKey: QUERY_KEYS.cpmk({ page: 1, limit: 1 }),
    queryFn: () => cpmkService.getAll({ page: 1, limit: 1 }),
  });

  const subCpmkQuery = useQuery({
    queryKey: QUERY_KEYS.subCpmk({ page: 1, limit: 1 }),
    queryFn: () => subCpmkService.getAll({ page: 1, limit: 1 }),
  });

  const assessmentQuery = useQuery({
    queryKey: QUERY_KEYS.assessment({ page: 1, limit: 1 }),
    queryFn: () => assessmentService.getAll({ page: 1, limit: 1 }),
  });

  const queries = [cplQuery, cpmkQuery, subCpmkQuery, assessmentQuery];
  const isLoading = queries.some((q) => q.isLoading);

  const totals = [
    cplQuery.data?.meta?.total ?? 0,
    cpmkQuery.data?.meta?.total ?? 0,
    subCpmkQuery.data?.meta?.total ?? 0,
    assessmentQuery.data?.meta?.total ?? 0,
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard OBE</h1>
          <p className="text-gray-500 mt-1">
            Selamat datang, {user?.name || 'Admin Jurusan'}! Kelola sistem OBE jurusan Anda.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-400">Sistem</p>
          <p className="text-lg font-bold text-primary">OBE SYSTAMA</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading
          ? statConfig.map((_, i) => <StatCardSkeleton key={i} />)
          : statConfig.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.key}
                  className={`p-6 rounded-2xl border ${stat.color} shadow-sm transition-transform hover:scale-[1.02]`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                      <h3 className="text-3xl font-bold text-gray-900">{totals[i]}</h3>
                    </div>
                    <div className={`p-3 ${stat.iconBg} rounded-xl shadow-sm`}>
                      <Icon size={24} className={stat.iconColor} />
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* OBE Overview & Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OBE Hierarchy */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-gray-800">Hierarki OBE</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'CPL (Capaian Pembelajaran Lulusan)', desc: 'Kompetensi lulusan yang harus dicapai', count: totals[0], color: 'bg-blue-500' },
              { label: 'CPMK (Capaian Pembelajaran Mata Kuliah)', desc: 'Kompetensi per mata kuliah', count: totals[1], color: 'bg-indigo-500' },
              { label: 'Sub CPMK', desc: 'Sub-kompetensi dari CPMK', count: totals[2], color: 'bg-purple-500' },
              { label: 'Assessment', desc: 'Penilaian berbasis OBE', count: totals[3], color: 'bg-emerald-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className={`w-2 h-12 ${item.color} rounded-full`} />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <span className="text-2xl font-bold text-gray-700">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-gray-800">Akses Cepat</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Kelola CPL', href: '/cpl', icon: Target, desc: 'Atur capaian pembelajaran lulusan' },
              { label: 'Kelola CPMK', href: '/cpmk', icon: BookOpen, desc: 'Atur kompetensi mata kuliah' },
              { label: 'Kelola Sub CPMK', href: '/sub-cpmk', icon: Layers, desc: 'Atur sub-kompetensi' },
              { label: 'Kelola Assessment', href: '/assessments', icon: ClipboardCheck, desc: 'Atur penilaian OBE' },
            ].map((link) => {
              const LinkIcon = link.icon;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all group"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-primary/10 transition-colors">
                    <LinkIcon size={18} className="text-gray-600 group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{link.label}</p>
                    <p className="text-xs text-gray-500">{link.desc}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
