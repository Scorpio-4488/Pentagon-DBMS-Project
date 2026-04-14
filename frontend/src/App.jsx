/**
 * ============================================================
 * App Component — Root Router & Layout
 * ============================================================
 *
 * Defines all application routes with role-based protection.
 * Wraps authenticated pages in a layout with Navbar.
 * ============================================================
 */

import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ToastContainer } from './components/Toast';

// Pages
import Login            from './components/Login';
import Register         from './components/Register';
import StudentDashboard from './components/StudentDashboard';
import MyEvents         from './components/MyEvents';
import AdminDashboard   from './components/AdminDashboard';
import ProtectedRoute   from './components/ProtectedRoute';
import Navbar           from './components/Navbar';

/**
 * Layout wrapper for authenticated pages.
 * Renders Navbar + page content.
 */
function AuthenticatedLayout() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

/**
 * Smart root redirect based on auth state and role.
 */
function RootRedirect() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
  return <Navigate to="/admin/dashboard" replace />;
}

export default function App() {
  return (
    <>
      {/* Global toast notification container */}
      <ToastContainer />

      <Routes>

        {/* ── Public Routes ── */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Student Routes ── */}
        <Route element={
          <ProtectedRoute allowedRoles={['student']}>
            <AuthenticatedLayout />
          </ProtectedRoute>
        }>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/my-events" element={<MyEvents />} />
        </Route>

        {/* ── Admin / Organizer Routes ── */}
        <Route element={
          <ProtectedRoute allowedRoles={['admin', 'organizer']}>
            <AuthenticatedLayout />
          </ProtectedRoute>
        }>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        {/* ── Root & Fallback ── */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </>
  );
}
