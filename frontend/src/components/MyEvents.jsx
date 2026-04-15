import { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
  OctagonAlert,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';

import api from '../utils/api';
import { toast } from './Toast';

const STATUS_STYLES = {
  registered: {
    label: 'Registered',
    className: 'border-brand-200 bg-brand-50 text-brand-700',
    icon: Calendar,
  },
  attended: {
    label: 'Attended',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: Clock3,
  },
  completed: {
    label: 'Completed',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'border-red-200 bg-red-50 text-red-700',
    icon: XCircle,
  },
};

export default function MyEvents() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  async function fetchRegistrations() {
    setLoading(true);

    try {
      const response = await api.get('/users/me/registrations');
      setRegistrations(response.data.data.registrations || []);
    } catch {
      toast.error('Failed to load your registrations.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(eventId) {
    if (!window.confirm('Are you sure you want to cancel this registration?')) {
      return;
    }

    setCancellingId(eventId);

    try {
      await api.delete(`/events/${eventId}/register`);
      toast.success('Registration cancelled. Seat has been released.');
      fetchRegistrations();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Cancellation failed.');
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          <span className="text-sm font-medium text-slate-600">Loading your events</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-8">
      <header className="space-y-3">
        <p className="section-eyebrow">My registrations</p>
        <h1 className="section-title">Track your event activity</h1>
        <p className="section-copy max-w-2xl">
          Review upcoming registrations, completed events, attendance status, and certificate availability in one place.
        </p>
      </header>

      {registrations.length === 0 ? (
        <section className="glass-card px-6 py-16 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-5 text-xl font-semibold text-slate-900">No registrations yet</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Register for an upcoming event to start building your activity history.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          {registrations.map((registration) => {
            const status = STATUS_STYLES[registration.registration_status] || STATUS_STYLES.registered;
            const StatusIcon = status.icon;
            const eventDate = new Date(registration.event_date);
            const canCancel = registration.registration_status === 'registered' && registration.event_status === 'upcoming';

            return (
              <article key={registration.registration_id} className="glass-card p-5 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {eventDate.toLocaleDateString('en-IN', { month: 'short' })}
                      </span>
                      <span className="mt-1 text-2xl font-semibold text-slate-900">
                        {eventDate.getDate()}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="space-y-1">
                        <h2 className="text-xl font-semibold text-slate-900">{registration.event_name}</h2>
                        <p className="text-sm text-slate-500">Organized by {registration.organizer_name}</p>
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {eventDate.toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-slate-400" />
                          {eventDate.toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {registration.venue_name}
                          {registration.building ? `, ${registration.building}` : ''}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`badge ${status.className}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status.label}
                        </span>
                        <span className="badge border-slate-200 bg-slate-50 text-slate-600">
                          {registration.category_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {registration.certificate_url && (
                      <a
                        href={registration.certificate_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Certificate
                      </a>
                    )}

                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => handleCancel(registration.event_id)}
                        disabled={cancellingId === registration.event_id}
                        className="btn-danger"
                      >
                        {cancellingId === registration.event_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Cancel registration
                      </button>
                    )}

                    {!canCancel && registration.registration_status === 'registered' && (
                      <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                        <OctagonAlert className="h-4 w-4" />
                        Registration locked
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
