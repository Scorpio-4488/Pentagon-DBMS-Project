/**
 * ============================================================
 * My Events — Student's Registered Events
 * ============================================================
 *
 * Displays all events the logged-in student has registered for,
 * with registration status, attendance info, and the ability
 * to cancel upcoming registrations.
 * ============================================================
 */

import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from './Toast';
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Loader2,
  Trash2,
} from 'lucide-react';

const STATUS_STYLES = {
  registered: { bg: 'bg-brand-500/10',   text: 'text-brand-400',    icon: AlertCircle },
  attended:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',    icon: Clock },
  completed:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400',  icon: CheckCircle },
  cancelled:  { bg: 'bg-red-500/10',     text: 'text-red-400',      icon: XCircle },
};

export default function MyEvents() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    fetchMyRegistrations();
  }, []);

  async function fetchMyRegistrations() {
    setLoading(true);
    try {
      const res = await api.get('/users/me/registrations');
      setRegistrations(res.data.data.registrations || []);
    } catch (err) {
      toast.error('Failed to load your registrations.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(eventId) {
    if (!window.confirm('Are you sure you want to cancel this registration?')) return;

    setCancelling(eventId);
    try {
      await api.delete(`/events/${eventId}/register`);
      toast.success('Registration cancelled. Seat has been released.');
      // Refresh the list
      fetchMyRegistrations();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Cancellation failed.';
      toast.error(msg);
    } finally {
      setCancelling(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">My Events</h1>
        <p className="text-gray-400">Your registrations, attendance, and certificates</p>
      </div>

      {registrations.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-400">No registrations yet</p>
          <p className="text-sm text-gray-600 mt-1">Explore events and register to see them here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg, i) => {
            const status = STATUS_STYLES[reg.registration_status] || STATUS_STYLES.registered;
            const StatusIcon = status.icon;
            const eventDate = new Date(reg.event_date);
            const canCancel = reg.registration_status === 'registered' && reg.event_status === 'upcoming';

            return (
              <div
                key={reg.registration_id}
                className="glass-card p-5 flex flex-col sm:flex-row sm:items-center gap-4
                           hover:border-gray-700/70 transition-all animate-slide-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Date block */}
                <div className="w-16 h-16 rounded-xl bg-gray-800/50 flex flex-col items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    {eventDate.toLocaleDateString('en-IN', { month: 'short' })}
                  </span>
                  <span className="text-xl font-bold text-white leading-none">
                    {eventDate.getDate()}
                  </span>
                </div>

                {/* Event info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white truncate">{reg.event_name}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {reg.venue_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-gray-600">{reg.category_name}</span>
                  </div>
                </div>

                {/* Status + Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Certificate link */}
                  {reg.certificate_url && (
                    <button className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3">
                      <FileText className="w-3.5 h-3.5" />
                      Certificate
                    </button>
                  )}

                  {/* Cancel button */}
                  {canCancel && (
                    <button
                      onClick={() => handleCancel(reg.event_id)}
                      disabled={cancelling === reg.event_id}
                      className="btn-danger text-xs flex items-center gap-1.5 py-1.5 px-3"
                    >
                      {cancelling === reg.event_id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      Cancel
                    </button>
                  )}

                  {/* Status badge */}
                  <span className={`badge ${status.bg} ${status.text} border border-current/20`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {reg.registration_status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
