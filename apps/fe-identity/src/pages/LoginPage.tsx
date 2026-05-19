import { useState, useEffect } from 'react';
import { Button, Input } from '@widyatama/ui';
import { GraduationCap, BookOpen, Users, Award, ArrowRight, Sparkles } from 'lucide-react';

// Stats data for left panel
const stats = [
  {
    value: '15,000+',
    label: 'Mahasiswa Aktif',
    color: 'bg-gradient-to-br from-primary-600 to-primary-800',
  },
  {
    value: '500+',
    label: 'Dosen & Staff',
    color: 'bg-gradient-to-br from-secondary-500 to-secondary-700',
  },
];

// Features for left panel
const features = [
  { icon: BookOpen, text: '50+ Program Studi' },
  { icon: Users, text: 'Komunitas Aktif' },
  { icon: Award, text: 'Akreditasi A' },
];

// API URL
const API_IDENTITY_URL = import.meta.env.VITE_API_IDENTITY_URL || 'http://localhost:3013';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Get return URL, client_id, and state from query params
  const urlParams = new URLSearchParams(window.location.search);
  const returnTo = urlParams.get('return_to') || '';
  const clientId = urlParams.get('client_id') || 'fe-dosen';
  const state = urlParams.get('state') || '';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Call the identity API for direct authentication
      const response = await fetch(`${API_IDENTITY_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store tokens in localStorage
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Determine correct portal based on user's role from API response
      const userRoles: string[] = data.user?.roles || [];
      const rolePortalMap: Record<string, string> = {
        dosen: 'http://localhost:6173',
        mahasiswa: 'http://localhost:5175',
        admin_akademik: 'http://localhost:6175',
        jurusan: 'http://localhost:6174',
        kaprodi: 'http://localhost:6174',
      };
      const correctPortal = userRoles
        .map(r => rolePortalMap[r])
        .find(url => url) || 'http://localhost:6173';

      // Determine the mock code based on username
      const mockCode = data.user?.username === 'admin.akademik'
        ? 'mock-code-admin.akademik'
        : data.user?.username === 'mahasiswa.test'
        ? 'mock-code-mahasiswa.test'
        : 'mock-code-dosen.test';

      if (returnTo) {
        const returnUrl = new URL(decodeURIComponent(returnTo));
        const requestedPortal = returnUrl.origin;

        // If user's role matches the requested portal, redirect back to the callback URL
        if (userRoles.some(r => rolePortalMap[r] === requestedPortal)) {
          returnUrl.searchParams.set('code', mockCode);
          if (state) {
            returnUrl.searchParams.set('state', state);
          }
          window.location.href = returnUrl.toString();
        } else {
          // Role doesn't match - redirect to correct portal's callback
          const targetUrl = new URL(`${correctPortal}/auth/callback`);
          targetUrl.searchParams.set('code', mockCode);
          if (state) {
            targetUrl.searchParams.set('state', state);
          }
          window.location.href = targetUrl.toString();
        }
      } else {
        // No return_to - redirect to correct portal based on role
        const targetUrl = new URL(`${correctPortal}/auth/callback`);
        targetUrl.searchParams.set('code', mockCode);
        if (state) {
          targetUrl.searchParams.set('state', state);
        }
        window.location.href = targetUrl.toString();
      }

    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOLogin = () => {
    // Fallback to OAuth if needed
    window.location.href = `${API_IDENTITY_URL}/auth/oauth?return_to=${returnTo}&client_id=${clientId}`;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Visual Side */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80"
            alt="Campus"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/90 via-primary-800/80 to-secondary-900/90" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">Universitas Widyatama</h1>
              <p className="text-white/70 text-sm">Sistem Akademik Terpadu</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="space-y-4 my-auto">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`${stat.color} rounded-2xl p-6 backdrop-blur-sm max-w-xs transform hover:scale-105 transition-transform duration-300`}
              >
                <div className="text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-white/90 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2"
              >
                <feature.icon className="w-4 h-4 text-white" />
                <span className="text-white text-sm">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 bg-gray-50/50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">Universitas Widyatama</h1>
              <p className="text-gray-500 text-xs">Sistem Akademik Terpadu</p>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="flex justify-end mb-8">
            <span className="text-gray-500 text-sm">Belum punya akun? </span>
            <a href="#" className="text-primary font-medium text-sm ml-1 hover:underline">
              Hubungi Admin
            </a>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Masuk ke <span className="text-primary">Widyatama</span>
            </h2>
            <p className="text-gray-500 text-sm">
              Selamat datang di portal akademik. Silakan masuk untuk melanjutkan.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email atau Username"
              type="text"
              placeholder="nama@widyatama.ac.id atau username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <Input
                label="Kata Sandi"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="flex justify-end mt-1">
                <a
                  href="#"
                  className="text-primary text-sm font-medium hover:underline"
                >
                  Lupa kata sandi?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center"
              disabled={isLoading}
            >
              {isLoading ? 'Memuat...' : 'Masuk'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50/50 text-gray-500">ATAU</span>
            </div>
          </div>

          {/* SSO Button */}
          <Button
            variant="outline"
            size="lg"
            className="w-full justify-center"
            onClick={handleSSOLogin}
            disabled={isLoading}
          >
            <Sparkles className="w-5 h-5 mr-2 text-primary" />
            Masuk dengan SSO Widyatama
          </Button>

          {/* Help Text */}
          <p className="text-center text-xs text-gray-400 mt-8">
            Dengan masuk, Anda menyetujui{' '}
            <a href="#" className="text-primary hover:underline">
              Syarat dan Ketentuan
            </a>{' '}
            serta{' '}
            <a href="#" className="text-primary hover:underline">
              Kebijakan Privasi
            </a>{' '}
            kami.
          </p>

          {/* Portal Links */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500 mb-4">Akses Portal:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Dosen', 'Mahasiswa', 'Akademik'].map((portal) => (
                <a
                  key={portal}
                  href={`http://localhost:${portal === 'Dosen' ? '6173' : portal === 'Mahasiswa' ? '5175' : '5174'}`}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors"
                >
                  {portal}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
