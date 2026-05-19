import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, createDefaultAuthConfig } from '@widyatama/sso-react';
import '@widyatama/ui/style.css';
import '@/styles/index.css';
import App from './app/App';

const authConfig = createDefaultAuthConfig(
  import.meta.env.VITE_AUTHENTIK_CLIENT_ID || 'fe-jurusan',
  import.meta.env.VITE_AUTHENTIK_CLIENT_SECRET || '',
  `${window.location.origin}/auth/callback`,
  import.meta.env.VITE_AUTHENTIK_ISSUER_URL
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider config={authConfig}>
      <App />
    </AuthProvider>
  </StrictMode>,
);
