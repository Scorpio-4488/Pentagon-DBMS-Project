/**
 * ============================================================
 * Navbar Component — Top Navigation Bar
 * ============================================================
 *
 * Displays brand name, navigation links based on user role,
 * and a logout button. Uses glass-morphism styling.
 * ============================================================
 */

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  LayoutDashboard,
  CalendarDays,
  Bell,
  User,
  Sparkles,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const isActive = (path) =>
    location.pathname === path
      ? 'text-brand-400 bg-brand-500/10'
      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50';

  const dashboardPath = user?.role === 'student'
    ? '/student/dashboard'
    : '/admin/dashboard';

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-gray-950/80 border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* ── Brand ── */}
          <Link to={dashboardPath} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600
                            flex items-center justify-center shadow-lg shadow-brand-500/25
                            group-hover:shadow-brand-500/40 transition-shadow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Campus<span className="text-brand-400">Hub</span>
            </span>
          </Link>

          {/* ── Nav Links ── */}
          <div className="flex items-center gap-1">
            <Link
              to={dashboardPath}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive(dashboardPath)}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            {user?.role === 'student' && (
              <Link
                to="/student/my-events"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/student/my-events')}`}
              >
                <CalendarDays className="w-4 h-4" />
                <span className="hidden sm:inline">My Events</span>
              </Link>
            )}

            {/* ── User Badge ── */}
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-800">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-purple-600
                              flex items-center justify-center text-white text-xs font-bold">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-200 leading-tight">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>

            {/* ── Logout ── */}
            <button
              onClick={handleLogout}
              className="ml-2 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10
                         rounded-lg transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
