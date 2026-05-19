import { createBrowserRouter, Navigate } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import DashboardPage from '@/pages/DashboardPage';
import FacultyPage from '@/pages/FacultyPage';
import StudyProgramPage from '@/pages/StudyProgramPage';
import CurriculumPage from '@/pages/CurriculumPage';
import CoursePage from '@/pages/CoursePage';
import AcademicSemesterPage from '@/pages/AcademicSemesterPage';
import LoginPage from '@/pages/auth/LoginPage';
import CallbackPage from '@/pages/auth/CallbackPage';
import { ProtectedRoute, PublicRoute } from '@/components/auth/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/auth/callback',
    element: <CallbackPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'faculties', element: <FacultyPage /> },
      { path: 'study-programs', element: <StudyProgramPage /> },
      { path: 'curriculums', element: <CurriculumPage /> },
      { path: 'courses', element: <CoursePage /> },
      { path: 'academic-semesters', element: <AcademicSemesterPage /> },
    ],
  },
]);
