/**
 * ============================================================
 * Protected Route Wrapper
 * ============================================================
 *
 * Restricts route access based on authentication and role.
 * Redirects unauthenticated users to /login and unauthorized
 * users to their appropriate dashboard.
 * ============================================================
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * @param {string[]} allowedRoles - Roles permitted to access this route.
 *                                  If empty, any authenticated user can access.
 * @param {React.ReactNode} children - The protected component to render.
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, loading, isAuthenticated } = useAuth();

  // Show nothing while restoring auth state from localStorage
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role → redirect to their dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const redirectPath = user.role === 'student'
      ? '/student/dashboard'
      : '/admin/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
