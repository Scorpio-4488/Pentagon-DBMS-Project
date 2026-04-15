import { Navigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fb]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
    </div>
  );
}

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const redirectTo = user.role === 'student' ? '/student/dashboard' : '/admin/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
