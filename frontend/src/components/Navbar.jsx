/**
 * ============================================================
 * Navbar — Global Navigation with Notification Center
 * ============================================================
 *
 * Features:
 *  - Glassmorphism sticky nav
 *  - Notification bell with unread count badge
 *  - Dropdown notification panel with mark-as-read
 *  - Role-aware navigation links
 *  - User avatar with role indicator
 * ============================================================
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  LogOut,
  LayoutDashboard,
  CalendarDays,
  Bell,
  Sparkles,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  Info,
  X,
  ChevronRight,
} from 'lucide-react';

/* ── Notification type styling ── */
const NOTIF_STYLES = {
  reminder:     { icon: Clock,          color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  update:       { icon: Info,           color: 'text-brand-400',   bg: 'bg-brand-500/10' },
  cancellation: { icon: AlertTriangle,  color: 'text-red-400',     bg: 'bg-red-500/10' },
  general:      { icon: Bell,           color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

export default function Navbar() {
  const { user, logout }  = useAuth();
  const navigate           = useNavigate();
  const location           = useLocation();
  const dropdownRef        = useRef(null);

  // ── Notification State ──
  const [showNotifs, setShowNotifs]     = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]   = useState(0);
  const [notifsLoading, setNotifsLoading] = useState(false);

  // ── Fetch notifications ──
  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await api.get('/users/me/notifications', { params: { limit: 20 } });
      setNotifications(res.data.data.notifications || []);
      setUnreadCount(res.data.data.unread_count || 0);
    } catch {
      /* Silently fail — navbar shouldn't crash for notifications */
    }
  }

  async function handleMarkRead(notifId) {
    try {
      await api.patch(`/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => n.notification_id === notifId ? { ...n, is_read: 1 } : n)
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* ignore */ }
  }

  async function handleMarkAllRead() {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  }

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

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1)  return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24)  return `${hr}h ago`;
    const d = Math.floor(hr / 24);
    return `${d}d ago`;
  }

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

          {/* ── Nav Links + Actions ── */}
          <div className="flex items-center gap-1">

            {/* Dashboard Link */}
            <Link
              to={dashboardPath}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive(dashboardPath)}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            {/* My Events — Student only */}
            {user?.role === 'student' && (
              <Link
                to="/student/my-events"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/student/my-events')}`}
              >
                <CalendarDays className="w-4 h-4" />
                <span className="hidden sm:inline">My Events</span>
              </Link>
            )}

            {/* ── Notification Bell ── */}
            <div className="relative ml-1" ref={dropdownRef}>
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className={`relative p-2 rounded-lg transition-all
                  ${showNotifs
                    ? 'text-brand-400 bg-brand-500/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {/* Unread badge */}
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full
                                   flex items-center justify-center text-[10px] font-bold text-white
                                   shadow-lg shadow-red-500/30 animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* ── Notification Dropdown ── */}
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-96 max-w-[90vw] glass-card
                                border border-gray-700/50 shadow-2xl shadow-black/40 animate-slide-down
                                overflow-hidden z-50">

                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-brand-400" />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="badge bg-brand-500/20 text-brand-400 text-[10px]">
                          {unreadCount} new
                        </span>
                      )}
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-brand-400 hover:text-brand-300 font-medium
                                   flex items-center gap-1 transition-colors"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-10 text-center">
                        <Bell className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-800/30">
                        {notifications.map((notif) => {
                          const style = NOTIF_STYLES[notif.type] || NOTIF_STYLES.general;
                          const Icon  = style.icon;
                          const isUnread = !notif.is_read;

                          return (
                            <div
                              key={notif.notification_id}
                              className={`px-4 py-3 flex gap-3 transition-colors cursor-pointer
                                         hover:bg-gray-800/30
                                         ${isUnread ? 'bg-brand-500/[0.03]' : ''}`}
                              onClick={() => isUnread && handleMarkRead(notif.notification_id)}
                            >
                              {/* Icon */}
                              <div className={`w-9 h-9 rounded-lg ${style.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                <Icon className={`w-4 h-4 ${style.color}`} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-sm leading-snug ${isUnread ? 'text-white font-medium' : 'text-gray-400'}`}>
                                    {notif.title}
                                  </p>
                                  {isUnread && (
                                    <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                <p className="text-[10px] text-gray-600 mt-1">{timeAgo(notif.sent_at)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-gray-800/50 text-center">
                      <p className="text-xs text-gray-600">
                        Showing latest {notifications.length} notifications
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── User Badge ── */}
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-800">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-purple-600
                              flex items-center justify-center text-white text-xs font-bold
                              shadow-md shadow-brand-500/20">
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
