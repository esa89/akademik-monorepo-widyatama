import { useAuth } from '@widyatama/sso-react';
import { Button } from '@widyatama/ui';
import { GraduationCap, ArrowRight, Sparkles } from 'lucide-react';

// fe-identity URL
const IDENTITY_URL = import.meta.env.VITE_IDENTITY_URL || 'http://localhost:5174';

export default function LoginPage() {
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Portal Dosen
          </h1>
          <p className="text-gray-500">
            Universitas Widyatama
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Selamat Datang
            </h2>
            <p className="text-sm text-gray-500">
              Silakan masuk untuk mengakses sistem akademik
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full justify-center"
            onClick={handleLogin}
            disabled={isLoading}
            iconLeft={<Sparkles className="w-5 h-5" />}
          >
            {isLoading ? 'Memuat...' : 'Masuk dengan SSO'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Masuk menggunakan akun SSO Widyatama
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-8">
          &copy; {new Date().getFullYear()} Universitas Widyatama
        </p>
      </div>
    </div>
  );
}
