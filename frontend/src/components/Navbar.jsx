import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  CheckCheck,
  Clock3,
  Info,
  LayoutDashboard,
  LogOut,
  OctagonAlert,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const NOTIFICATION_STYLES = {
  reminder: {
    icon: Clock3,
    iconClass: 'text-amber-600',
    containerClass: 'bg-amber-50',
  },
  update: {
    icon: Info,
    iconClass: 'text-brand-600',
    containerClass: 'bg-brand-50',
  },
  cancellation: {
    icon: OctagonAlert,
    iconClass: 'text-red-600',
    containerClass: 'bg-red-50',
  },
  general: {
    icon: Bell,
    iconClass: 'text-slate-600',
    containerClass: 'bg-slate-100',
  },
};

function formatRelativeTime(dateString) {
  const diffInMinutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);

  if (diffInMinutes < 1) {
    return 'Just now';
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  return `${Math.floor(diffInHours / 24)}d ago`;
}

export default function Navbar() {
  const { logout, user } = useAuth();
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();

    const intervalId = window.setInterval(fetchNotifications, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchNotifications() {
    try {
      const response = await api.get('/users/me/notifications', { params: { limit: 20 } });
      setNotifications(response.data.data.notifications || []);
      setUnreadCount(response.data.data.unread_count || 0);
    } catch {}
  }

  async function handleMarkRead(notificationId) {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications((current) =>
        current.map((notification) => (
          notification.notification_id === notificationId
            ? { ...notification, is_read: 1 }
            : notification
        ))
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch {}
  }

  async function handleMarkAllRead() {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((current) => current.map((notification) => ({ ...notification, is_read: 1 })));
      setUnreadCount(0);
    } catch {}
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const dashboardPath = user?.role === 'student' ? '/student/dashboard' : '/admin/dashboard';

  function navItemClass(path) {
    return location.pathname === path
      ? 'bg-brand-50 text-brand-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to={dashboardPath} className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-700">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900">CampusHub</p>
            <p className="truncate text-sm text-slate-500">College event portal</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-2 md:flex">
            <Link
              to={dashboardPath}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${navItemClass(dashboardPath)}`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>

            {user?.role === 'student' && (
              <Link
                to="/student/my-events"
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${navItemClass('/student/my-events')}`}
              >
                <CalendarDays className="h-4 w-4" />
                My Events
              </Link>
            )}
          </nav>

          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((current) => !current)}
              className={`relative inline-flex h-10 w-10 items-center justify-center rounded-lg border transition ${
                showNotifications
                  ? 'border-brand-200 bg-brand-50 text-brand-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              aria-label="Toggle notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
                    <p className="text-xs text-slate-500">Recent updates and reminders</p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-50"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <Bell className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-700">No notifications yet</p>
                    <p className="mt-1 text-sm text-slate-500">Updates will appear here when something changes.</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => {
                      const style = NOTIFICATION_STYLES[notification.type] || NOTIFICATION_STYLES.general;
                      const Icon = style.icon;
                      const unread = !notification.is_read;

                      return (
                        <button
                          key={notification.notification_id}
                          type="button"
                          onClick={() => unread && handleMarkRead(notification.notification_id)}
                          className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50 ${unread ? 'bg-brand-50/40' : 'bg-white'}`}
                        >
                          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.containerClass}`}>
                            <Icon className={`h-4 w-4 ${style.iconClass}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className={`text-sm leading-6 ${unread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                                {notification.title}
                              </p>
                              {unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                              {notification.message}
                            </p>
                            <p className="mt-2 text-xs font-medium text-slate-400">
                              {formatRelativeTime(notification.sent_at)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 sm:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
              {user?.first_name?.[0]}
              {user?.last_name?.[0]}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="truncate text-xs capitalize text-slate-500">{user?.role}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
