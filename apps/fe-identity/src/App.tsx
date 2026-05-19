import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, createDefaultAuthConfig } from '@widyatama/sso-react';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';

// Auth configuration for fe-identity
const authConfig = createDefaultAuthConfig(
  import.meta.env.VITE_AUTHENTIK_CLIENT_ID || 'fe-identity',
  import.meta.env.VITE_AUTHENTIK_CLIENT_SECRET || '',
  `${window.location.origin}/auth/callback`,
  import.meta.env.VITE_AUTHENTIK_ISSUER_URL
);

function App() {
  return (
    <AuthProvider config={authConfig}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/auth/callback" element={<CallbackPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
