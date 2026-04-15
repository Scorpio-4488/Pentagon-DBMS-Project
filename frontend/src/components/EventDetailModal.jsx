import { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock3,
  Download,
  IndianRupee,
  Loader2,
  MapPin,
  Send,
  Star,
  Ticket,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';

import api from '../utils/api';
import { toast } from './Toast';

const REGISTRATION_STYLES = {
  registered: {
    label: 'Registered',
    className: 'border-brand-200 bg-brand-50 text-brand-700',
    icon: Calendar,
  },
  attended: {
    label: 'Attended',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: UserCheck,
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

const EVENT_STATUS_STYLES = {
  upcoming: 'border-brand-200 bg-brand-50 text-brand-700',
  ongoing: 'border-amber-200 bg-amber-50 text-amber-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  cancelled: 'border-red-200 bg-red-50 text-red-700',
};

function formatEventDate(dateString) {
  const date = new Date(dateString);

  return {
    full: date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

export default function EventDetailModal({ event: initialEvent, onClose, onRegistrationChange }) {
  const [event, setEvent] = useState(initialEvent);
  const [registering, setRegistering] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [myRegistration, setMyRegistration] = useState(null);
  const [regLoading, setRegLoading] = useState(true);
  const [feedback, setFeedback] = useState({ rating: 0, comments: '' });
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackSummary, setFeedbackSummary] = useState(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    loadEvent();
    loadRegistration();
    loadFeedback();
  }, [initialEvent.event_id]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  async function loadEvent() {
    try {
      const response = await api.get(`/events/${initialEvent.event_id}`);
      if (response.data.success && response.data.data) {
        setEvent(response.data.data);
      }
    } catch {}
  }

  async function loadRegistration() {
    setRegLoading(true);

    try {
      const response = await api.get('/users/me/registrations');
      const registrations = response.data.data.registrations || [];
      const current = registrations.find(
        (registration) => (
          registration.event_id === initialEvent.event_id
            && registration.registration_status !== 'cancelled'
        )
      );

      setMyRegistration(current || null);
      setHasSubmittedFeedback(false);
    } catch {} finally {
      setRegLoading(false);
    }
  }

  async function loadFeedback() {
    try {
      const response = await api.get(`/events/${initialEvent.event_id}/feedback`);
      setFeedbackList(response.data.data.feedback || []);
      setFeedbackSummary(response.data.data.summary || null);
    } catch {}
  }

  async function handleRegister() {
    setRegistering(true);

    try {
      const response = await api.post(`/events/${initialEvent.event_id}/register`);
      toast.success('Successfully registered for the event.');

      if (response.data.data?.available_seats_remaining !== undefined) {
        setEvent((current) => ({
          ...current,
          available_seats: response.data.data.available_seats_remaining,
        }));
      } else {
        await loadEvent();
      }

      await loadRegistration();
      onRegistrationChange?.();
    } catch (error) {
      const code = error.response?.data?.error?.code;
      const message = error.response?.data?.error?.message;

      if (code === 'ALREADY_REGISTERED') {
        toast.error('You are already registered for this event.');
      } else if (code === 'NO_SEATS_AVAILABLE') {
        toast.error('This event is already at full capacity.');
      } else if (code === 'EVENT_NOT_OPEN') {
        toast.error('This event is no longer accepting registrations.');
      } else {
        toast.error(message || 'Registration failed.');
      }
    } finally {
      setRegistering(false);
    }
  }

  async function handleCancelRegistration() {
    if (!window.confirm('Cancel your registration? The released seat will become available again.')) {
      return;
    }

    setCancelling(true);

    try {
      await api.delete(`/events/${initialEvent.event_id}/register`);
      toast.success('Registration cancelled.');
      setMyRegistration(null);
      await loadEvent();
      onRegistrationChange?.();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Cancellation failed.');
    } finally {
      setCancelling(false);
    }
  }

  async function handleSubmitFeedback(eventObject) {
    eventObject.preventDefault();

    if (feedback.rating === 0) {
      toast.error('Please select a rating.');
      return;
    }

    setSubmittingFeedback(true);

    try {
      await api.post(`/events/${initialEvent.event_id}/feedback`, feedback);
      toast.success('Thank you for your feedback.');
      setHasSubmittedFeedback(true);
      setFeedback({ rating: 0, comments: '' });
      await loadFeedback();
    } catch (error) {
      const code = error.response?.data?.error?.code;

      if (code === 'FEEDBACK_EXISTS') {
        toast.error('You have already submitted feedback for this event.');
        setHasSubmittedFeedback(true);
      } else {
        toast.error(error.response?.data?.error?.message || 'Failed to submit feedback.');
      }
    } finally {
      setSubmittingFeedback(false);
    }
  }

  const eventDate = formatEventDate(event.event_date);
  const eventEndTime = event.end_date
    ? new Date(event.end_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null;
  const seatsFilled = event.max_capacity - event.available_seats;
  const fillPercent = event.max_capacity ? Math.min(100, (seatsFilled / event.max_capacity) * 100) : 0;
  const fullyBooked = event.available_seats <= 0;
  const registrationStyle = myRegistration
    ? REGISTRATION_STYLES[myRegistration.registration_status] || REGISTRATION_STYLES.registered
    : null;
  const RegistrationIcon = registrationStyle?.icon;
  const canRegister = !regLoading && !myRegistration && event.status === 'upcoming';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/30 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-auto flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]"
        onClick={(eventObject) => eventObject.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="badge border-slate-200 bg-slate-50 text-slate-600">
                  {event.category_name}
                </span>
                <span className={`badge ${EVENT_STATUS_STYLES[event.status] || EVENT_STATUS_STYLES.upcoming}`}>
                  {event.status}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{event.event_name}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Organized by {event.organizer_name || 'Campus team'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 flex gap-2 rounded-xl bg-slate-100 p-1">
            {['details', 'feedback'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition ${
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Calendar className="h-4 w-4" />
                    Date
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{eventDate.full}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Clock3 className="h-4 w-4" />
                    Time
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {eventDate.time}
                    {eventEndTime ? ` - ${eventEndTime}` : ''}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <MapPin className="h-4 w-4" />
                    Venue
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {event.venue_name}
                    {event.building ? `, ${event.building}` : ''}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <IndianRupee className="h-4 w-4" />
                    Registration fee
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {Number.parseFloat(event.registration_fee) > 0
                      ? `₹${Number.parseFloat(event.registration_fee).toFixed(0)}`
                      : 'Free'}
                  </p>
                </div>
              </div>

              {event.description && (
                <section className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900">About this event</h3>
                  <p className="text-sm leading-7 text-slate-600">{event.description}</p>
                </section>
              )}

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Seat availability</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {seatsFilled} registered · {event.available_seats} seats left
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${fullyBooked ? 'text-red-600' : 'text-slate-900'}`}>
                    {event.available_seats}/{event.max_capacity}
                  </span>
                </div>
                <div className="mt-4 h-2 rounded-full bg-slate-200">
                  <div
                    className={`h-2 rounded-full ${fullyBooked ? 'bg-red-500' : 'bg-brand-500'}`}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              </section>

              {regLoading ? (
                <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
                </div>
              ) : myRegistration ? (
                <section className={`rounded-2xl border p-5 ${registrationStyle.className}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/70">
                        <RegistrationIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Your registration</h3>
                        <p className="mt-1 text-sm">{registrationStyle.label}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {myRegistration.certificate_url && (
                        <a
                          href={myRegistration.certificate_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary"
                        >
                          <Download className="h-4 w-4" />
                          Certificate
                        </a>
                      )}

                      {myRegistration.registration_status === 'registered' && event.status === 'upcoming' && (
                        <button
                          type="button"
                          onClick={handleCancelRegistration}
                          disabled={cancelling}
                          className="btn-danger"
                        >
                          {cancelling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          Cancel registration
                        </button>
                      )}
                    </div>
                  </div>
                </section>
              ) : (
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-lg font-semibold text-slate-900">Registration status</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {event.status === 'upcoming'
                      ? 'You have not registered for this event yet.'
                      : 'Registration is not available for this event right now.'}
                  </p>
                </section>
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-6">
              {feedbackSummary && feedbackSummary.total_reviews > 0 && (
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                      <p className="text-4xl font-semibold text-slate-900">{feedbackSummary.avg_rating}</p>
                      <div className="mt-3 flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.round(feedbackSummary.avg_rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {feedbackSummary.total_reviews} review{feedbackSummary.total_reviews === 1 ? '' : 's'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = feedbackList.filter((entry) => entry.rating === star).length;
                        const width = feedbackSummary.total_reviews
                          ? (count / feedbackSummary.total_reviews) * 100
                          : 0;

                        return (
                          <div key={star} className="flex items-center gap-3">
                            <span className="w-8 text-sm font-medium text-slate-600">{star}★</span>
                            <div className="h-2 flex-1 rounded-full bg-slate-200">
                              <div className="h-2 rounded-full bg-amber-400" style={{ width: `${width}%` }} />
                            </div>
                            <span className="w-10 text-right text-sm text-slate-500">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}

              {myRegistration && !hasSubmittedFeedback && (
                <form onSubmit={handleSubmitFeedback} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Share your feedback</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Let others know what stood out and how the event could improve.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedback((current) => ({ ...current, rating: star }))}
                          className="rounded-lg p-1 transition hover:scale-110"
                        >
                          <Star
                            className={`h-7 w-7 ${
                              star <= feedback.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={feedback.comments}
                      onChange={(eventObject) => setFeedback((current) => ({ ...current, comments: eventObject.target.value }))}
                      rows={4}
                      placeholder="Share your experience with the event"
                      className="input-field resize-none"
                    />

                    <button type="submit" disabled={submittingFeedback || feedback.rating === 0} className="btn-primary">
                      {submittingFeedback ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Submit feedback
                    </button>
                  </div>
                </form>
              )}

              {feedbackList.length > 0 ? (
                <section className="space-y-3">
                  {feedbackList.map((entry) => (
                    <article key={entry.feedback_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">{entry.reviewer_name}</h4>
                          <p className="mt-1 text-xs text-slate-500">{entry.department}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= entry.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {entry.comments && (
                        <p className="mt-4 text-sm leading-7 text-slate-600">{entry.comments}</p>
                      )}
                    </article>
                  ))}
                </section>
              ) : (
                <section className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-14 text-center">
                  <Star className="mx-auto h-8 w-8 text-slate-300" />
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">No feedback yet</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Reviews from attendees will appear here once they&apos;re submitted.
                  </p>
                </section>
              )}
            </div>
          )}
        </div>

        {canRegister && (
          <div className="border-t border-slate-200 bg-white px-6 py-5 sm:px-8">
            <button
              type="button"
              onClick={handleRegister}
              disabled={fullyBooked || registering}
              className="btn-primary w-full"
            >
              {registering ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : fullyBooked ? (
                'Event is full'
              ) : (
                <>
                  <Ticket className="h-5 w-5" />
                  Register for this event
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
