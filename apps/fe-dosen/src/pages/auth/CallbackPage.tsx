import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function CallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // The AuthProvider handles the callback automatically
    // This page just shows a loading state while processing
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Memproses Login...
        </h2>
        <p className="text-gray-500">
          Mohon tunggu sebentar
        </p>
        <div className="mt-6 flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
