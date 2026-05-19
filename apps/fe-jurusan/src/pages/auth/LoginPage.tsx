import { useAuth } from '@widyatama/sso-react';
import { Button } from '@widyatama/ui';
import { GraduationCap } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <GraduationCap className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">OBE SYSTAMA</h1>
        <p className="text-gray-500 mb-8">Portal Jurusan - Outcome Based Education</p>
        <Button variant="primary" className="w-full" onClick={() => login()}>
          Masuk dengan SSO
        </Button>
      </div>
    </div>
  );
}
