import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import MyEvents from './components/MyEvents';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Register from './components/Register';
import StudentDashboard from './components/StudentDashboard';
import { ToastContainer } from './components/Toast';
import { useAuth } from './context/AuthContext';

function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <Navbar />
      <main className="pb-12">
        <Outlet />
      </main>
    </div>
  );
}

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return user.role === 'student'
    ? <Navigate to="/student/dashboard" replace />
    : <Navigate to="/admin/dashboard" replace />;
}

export default function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          element={(
            <ProtectedRoute allowedRoles={['student']}>
              <AppLayout />
            </ProtectedRoute>
          )}
        >
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/my-events" element={<MyEvents />} />
        </Route>

        <Route
          element={(
            <ProtectedRoute allowedRoles={['admin', 'organizer']}>
              <AppLayout />
            </ProtectedRoute>
          )}
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
