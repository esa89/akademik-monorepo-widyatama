import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import DashboardPage from '@/pages/DashboardPage';
import CplPage from '@/pages/CplPage';
import CpmkPage from '@/pages/CpmkPage';
import SubCpmkPage from '@/pages/SubCpmkPage';
import AssessmentPage from '@/pages/AssessmentPage';
import RubricPage from '@/pages/RubricPage';
import VisiMisiPage from '@/pages/VisiMisiPage';
import LoginPage from '@/pages/auth/LoginPage';
import CallbackPage from '@/pages/auth/CallbackPage';
import { ProtectedRoute, PublicRoute } from '@/components/auth/ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/login', element: <PublicRoute><LoginPage /></PublicRoute> },
  { path: '/auth/callback', element: <CallbackPage /> },
  {
    path: '/',
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'cpl', element: <CplPage /> },
      { path: 'cpmk', element: <CpmkPage /> },
      { path: 'sub-cpmk', element: <SubCpmkPage /> },
      { path: 'assessments', element: <AssessmentPage /> },
      { path: 'rubrics', element: <RubricPage /> },
      { path: 'visi-misi', element: <VisiMisiPage /> },
    ],
  },
]);
