import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useUser } from '@widyatama/sso-react';
import type { UserRole } from '@widyatama/sso-react';
import type { ReactNode } from 'react';
import { LogOut, ArrowRight } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ROLE_PORTAL_MAP: Record<string, string> = {
  dosen: 'http://localhost:6173',
  mahasiswa: 'http://localhost:5175',
  admin_akademik: 'http://localhost:6175',
  jurusan: 'http://localhost:6174',
  kaprodi: 'http://localhost:6174',
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const devBypass = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';
  if (devBypass) {
    return <>{children}</>;
  }

  const location = useLocation();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { hasAnyRole, roles } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const requiredRoles: UserRole[] = ['admin_akademik', 'jurusan', 'kaprodi'];
  const hasRequiredRole = hasAnyRole(requiredRoles);

  if (!hasRequiredRole) {
    const correctPortalFull = roles
      .map((r) => ROLE_PORTAL_MAP[r])
      .find((url) => url && url !== window.location.origin) || null;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">&#x1F6AB;</span>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-red-600">Akses Ditolak</h2>
          <p className="text-gray-700 mb-4">Anda tidak memiliki izin untuk mengakses Portal Admin Akademik.</p>
          <p className="text-sm text-gray-500 mb-6 bg-gray-50 p-3 rounded-lg border">
            Role Anda: <span className="font-semibold text-gray-700">{roles.join(', ') || 'None'}</span>
            <br />
            Role yang diperlukan: <span className="font-semibold text-gray-700">{requiredRoles.join(', ')}</span>
          </p>
          <div className="space-y-3">
            {correctPortalFull && (
              <a
                href={correctPortalFull}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Buka Portal Anda <ArrowRight className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={() => {
                localStorage.clear();
                logout().catch(() => {});
                window.location.href = '/login';
              }}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              Keluar & Login Ulang
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Memuat...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
