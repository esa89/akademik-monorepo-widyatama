import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthSync } from '@/components/auth/AuthSync';

export default function App() {
  return (
    <QueryProvider>
      <AuthSync />
      <RouterProvider router={router} />
    </QueryProvider>
  );
}
