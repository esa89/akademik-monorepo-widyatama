import { useAuth } from '@widyatama/sso-react';
import { Navigate } from 'react-router-dom';

export default function CallbackPage() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Memproses autentikasi...</p>
      </div>
    </div>
  );
}
