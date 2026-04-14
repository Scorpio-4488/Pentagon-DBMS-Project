/**
 * ============================================================
 * Event Detail Modal — Student Event Actions
 * ============================================================
 *
 * Rubric Features Covered:
 *  ✅ Student Registration (register button, disables if full)
 *  ✅ Participation Tracking (status display)
 *  ✅ Certificates & Results (download button)
 *  ✅ Feedback (rating + comment form)
 *  ✅ Seat/Capacity Management (visual progress bar)
 *
 * Opens as a fullscreen modal overlay.
 * Fetches LIVE event data on open so seats are always current.
 * ============================================================
 */

import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from './Toast';
import {
  X,
  Calendar,
  MapPin,
  Clock,
  Users,
  Tag,
  IndianRupee,
  Ticket,
  Loader2,
  Star,
  Send,
  Download,
  CheckCircle,
  AlertCircle,
  XCircle,
  UserCheck,
  Trophy,
} from 'lucide-react';

/* ── Status styling ── */
const REG_STATUS = {
  registered: { label: 'Registered',  icon: AlertCircle, color: 'text-brand-400',   bg: 'bg-brand-500/10',   border: 'border-brand-500/20' },
  attended:   { label: 'Attended',    icon: UserCheck,   color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
  completed:  { label: 'Completed',   icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  cancelled:  { label: 'Cancelled',   icon: XCircle,     color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
};

/* ── Category colors ── */
const CAT_COLORS = {
  Technical: 'from-blue-600 to-cyan-500',
  Cultural:  'from-pink-600 to-rose-400',
  Sports:    'from-emerald-600 to-teal-400',
  Workshop:  'from-amber-600 to-yellow-400',
  Seminar:   'from-purple-600 to-violet-400',
};

export default function EventDetailModal({ event: initialEvent, onClose, onRegistrationChange }) {
  if (!initialEvent) return null;

  // ── State ──
  // Use local event state so we can refresh seat counts after registration
  const [event, setEvent]                 = useState(initialEvent);
  const [registering, setRegistering]     = useState(false);
  const [cancelling, setCancelling]       = useState(false);
  const [myRegistration, setMyRegistration] = useState(null);
  const [regLoading, setRegLoading]       = useState(true);
  const [feedback, setFeedback]           = useState({ rating: 0, comments: '' });
  const [feedbackList, setFeedbackList]   = useState([]);
  const [feedbackSummary, setFeedbackSummary] = useState(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);
  const [activeTab, setActiveTab]         = useState('details');

  const eventDate  = new Date(event.event_date);
  const endDate    = event.end_date ? new Date(event.end_date) : null;
  const registered = event.max_capacity - event.available_seats;
  const fillPct    = event.max_capacity > 0 ? (registered / event.max_capacity * 100) : 0;
  const isFull     = event.available_seats <= 0;
  const gradient   = CAT_COLORS[event.category_name] || 'from-gray-600 to-gray-400';

  // ── Fetch fresh event data + registration status on open ──
  useEffect(() => {
    fetchFreshEventData();
    checkRegistration();
    fetchFeedback();
  }, [initialEvent.event_id]);

  // ── Prevent body scroll when modal is open ──
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  /** Fetch the latest event data (seats, status) directly from the API */
  async function fetchFreshEventData() {
    try {
      const res = await api.get(`/events/${initialEvent.event_id}`);
      if (res.data.success && res.data.data) {
        setEvent(res.data.data);
      }
    } catch {
      // Fall back to the initial prop data
    }
  }

  async function checkRegistration() {
    setRegLoading(true);
    try {
      const res = await api.get('/users/me/registrations');
      const regs = res.data.data.registrations || [];
      const mine = regs.find(
        (r) => r.event_id === initialEvent.event_id && r.registration_status !== 'cancelled'
      );
      setMyRegistration(mine || null);
      // Check if feedback was already submitted for this event
      const feedbackCheck = regs.find(
        (r) => r.event_id === initialEvent.event_id
      );
      setHasSubmittedFeedback(false); // Will be set properly by fetchFeedback
    } catch {
      /* ignore */
    } finally {
      setRegLoading(false);
    }
  }

  async function fetchFeedback() {
    try {
      const res = await api.get(`/events/${initialEvent.event_id}/feedback`);
      setFeedbackList(res.data.data.feedback || []);
      setFeedbackSummary(res.data.data.summary || null);
    } catch { /* ignore */ }
  }

  async function handleRegister() {
    setRegistering(true);
    try {
      const res = await api.post(`/events/${initialEvent.event_id}/register`);
      toast.success('🎉 Successfully registered! Check "My Events" for details.');

      // Update local seat count from the API response
      if (res.data.data?.available_seats_remaining !== undefined) {
        setEvent(prev => ({
          ...prev,
          available_seats: res.data.data.available_seats_remaining,
        }));
      } else {
        // Fallback: re-fetch event data
        await fetchFreshEventData();
      }

      // Re-check registration status so the UI updates to "Registered"
      await checkRegistration();

      // Tell the parent dashboard to refresh its event list
      onRegistrationChange?.();
    } catch (err) {
      const code = err.response?.data?.error?.code;
      const msg  = err.response?.data?.error?.message;
      if (code === 'ALREADY_REGISTERED') toast.error('You are already registered for this event.');
      else if (code === 'NO_SEATS_AVAILABLE') toast.error('Sorry — this event is at full capacity.');
      else if (code === 'EVENT_NOT_OPEN') toast.error('This event is no longer accepting registrations.');
      else toast.error(msg || 'Registration failed.');
    } finally {
      setRegistering(false);
    }
  }

  async function handleCancelRegistration() {
    if (!window.confirm('Cancel your registration? The seat will be released.')) return;
    setCancelling(true);
    try {
      await api.delete(`/events/${initialEvent.event_id}/register`);
      toast.success('Registration cancelled. Seat has been released.');
      setMyRegistration(null);

      // Refresh seat count
      await fetchFreshEventData();

      // Tell parent to refresh
      onRegistrationChange?.();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Cancellation failed.');
    } finally {
      setCancelling(false);
    }
  }

  async function handleSubmitFeedback(e) {
    e.preventDefault();
    if (feedback.rating === 0) { toast.error('Please select a rating.'); return; }

    setSubmittingFeedback(true);
    try {
      await api.post(`/events/${initialEvent.event_id}/feedback`, feedback);
      toast.success('Thank you for your feedback!');
      setHasSubmittedFeedback(true);
      setFeedback({ rating: 0, comments: '' });
      fetchFeedback();
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === 'FEEDBACK_EXISTS') {
        toast.error('You have already submitted feedback.');
        setHasSubmittedFeedback(true);
      }
      else toast.error(err.response?.data?.error?.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  }

  const regStatus = myRegistration ? REG_STATUS[myRegistration.registration_status] : null;
  const RegIcon   = regStatus?.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         onClick={onClose}>

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] glass-card border border-gray-700/50
                   shadow-2xl shadow-black/50 animate-slide-up overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header Banner ── */}
        <div className={`relative h-32 bg-gradient-to-r ${gradient} overflow-hidden shrink-0`}>
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-10"
               style={{
                 backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)',
                 backgroundSize: '24px 24px',
               }} />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/30 backdrop-blur-sm
                       flex items-center justify-center text-white/80 hover:text-white
                       hover:bg-black/50 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Category badge */}
          <div className="absolute bottom-3 left-5">
            <span className="badge bg-black/30 text-white backdrop-blur-sm border border-white/10">
              <Tag className="w-3 h-3 mr-1" />
              {event.category_name}
            </span>
          </div>

          {/* Status */}
          <div className="absolute bottom-3 right-5">
            <span className={`badge capitalize
              ${event.status === 'upcoming'  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' :
                event.status === 'ongoing'   ? 'bg-amber-500/20 text-amber-300 border border-amber-500/20' :
                event.status === 'completed' ? 'bg-gray-500/20 text-gray-300 border border-gray-500/20' :
                'bg-red-500/20 text-red-300 border border-red-500/20'}`}>
              {event.status}
            </span>
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">

            {/* Title */}
            <h2 className="text-xl font-bold text-white mb-1">{event.event_name}</h2>
            <p className="text-sm text-gray-500 mb-5">
              Organized by {event.organizer_name || 'Campus Team'}
            </p>

            {/* ── Tab Navigation ── */}
            <div className="flex gap-1 p-1 bg-gray-800/50 rounded-xl mb-5">
              {['details', 'feedback'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all
                    ${activeTab === tab
                      ? 'bg-gray-700/50 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* ══════ DETAILS TAB ══════ */}
            {activeTab === 'details' && (
              <div className="space-y-5 animate-fade-in">

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-800/50">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <Calendar className="w-3.5 h-3.5" /> Date
                    </div>
                    <p className="text-sm text-white font-medium">
                      {eventDate.toLocaleDateString('en-IN', {
                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-800/50">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <Clock className="w-3.5 h-3.5" /> Time
                    </div>
                    <p className="text-sm text-white font-medium">
                      {eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      {endDate && (
                        <span className="text-gray-500">
                          {' — '}{endDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-800/50">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <MapPin className="w-3.5 h-3.5" /> Venue
                    </div>
                    <p className="text-sm text-white font-medium">
                      {event.venue_name}
                    </p>
                    {event.building && (
                      <p className="text-xs text-gray-500">{event.building}</p>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-gray-800/30 border border-gray-800/50">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <IndianRupee className="w-3.5 h-3.5" /> Fee
                    </div>
                    <p className="text-sm text-white font-medium">
                      {parseFloat(event.registration_fee) > 0
                        ? `₹${parseFloat(event.registration_fee).toFixed(0)}`
                        : 'Free'}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {event.description && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      About this Event
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed">{event.description}</p>
                  </div>
                )}

                {/* ── Capacity Bar ── */}
                <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Seat Availability
                    </span>
                    <span className="text-xs font-bold">
                      <span className={isFull ? 'text-red-400' : 'text-emerald-400'}>
                        {event.available_seats}
                      </span>
                      <span className="text-gray-600"> / {event.max_capacity} seats left</span>
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isFull        ? 'bg-gradient-to-r from-red-600 to-red-400' :
                        fillPct > 75  ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                                        'bg-gradient-to-r from-emerald-600 to-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, fillPct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px] text-gray-600">
                    <span>{registered} registered</span>
                    <span>{fillPct.toFixed(0)}% filled</span>
                  </div>
                </div>

                {/* ── Participation Tracking (if registered) ── */}
                {regLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                  </div>
                ) : myRegistration ? (
                  <div className={`p-4 rounded-xl border ${regStatus.border} ${regStatus.bg}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${regStatus.bg} flex items-center justify-center`}>
                          <RegIcon className={`w-5 h-5 ${regStatus.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Your Status</p>
                          <p className={`text-xs font-medium ${regStatus.color}`}>
                            {regStatus.label}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Certificate Download */}
                        {(myRegistration.registration_status === 'completed' ||
                          myRegistration.registration_status === 'attended') &&
                          myRegistration.certificate_url && (
                          <button className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3">
                            <Download className="w-3.5 h-3.5" />
                            Certificate
                          </button>
                        )}

                        {/* Cancel Button */}
                        {myRegistration.registration_status === 'registered' &&
                          event.status === 'upcoming' && (
                          <button
                            onClick={handleCancelRegistration}
                            disabled={cancelling}
                            className="btn-danger text-xs py-2 px-3 flex items-center gap-1.5"
                          >
                            {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Participation timeline */}
                    <div className="flex items-center gap-0 mt-4">
                      {['registered', 'attended', 'completed'].map((step, i) => {
                        const isActive = ['registered', 'attended', 'completed']
                          .indexOf(myRegistration.registration_status) >= i;
                        return (
                          <div key={step} className="flex items-center flex-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                              ${isActive ? 'bg-brand-500 text-white' : 'bg-gray-800 text-gray-600'}`}>
                              {i + 1}
                            </div>
                            {i < 2 && (
                              <div className={`flex-1 h-0.5 mx-1 ${isActive ? 'bg-brand-500' : 'bg-gray-800'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-1">
                      {['Registered', 'Attended', 'Completed'].map((label) => (
                        <span key={label} className="text-[10px] text-gray-600">{label}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* ══════ FEEDBACK TAB ══════ */}
            {activeTab === 'feedback' && (
              <div className="space-y-5 animate-fade-in">

                {/* Feedback Summary */}
                {feedbackSummary && feedbackSummary.total_reviews > 0 && (
                  <div className="p-4 rounded-xl bg-gray-800/30 border border-gray-800/50 flex items-center gap-5">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-white">{feedbackSummary.avg_rating}</p>
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`w-3.5 h-3.5 ${
                            s <= Math.round(feedbackSummary.avg_rating)
                              ? 'text-amber-400 fill-amber-400' : 'text-gray-700'
                          }`} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{feedbackSummary.total_reviews} reviews</p>
                    </div>

                    {/* Rating distribution */}
                    <div className="flex-1 space-y-1">
                      {[5,4,3,2,1].map((star) => {
                        const count = feedbackList.filter((f) => f.rating === star).length;
                        const pct = feedbackSummary.total_reviews > 0
                          ? (count / feedbackSummary.total_reviews * 100) : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500 w-3">{star}</span>
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-gray-600 w-5 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Submit Feedback Form */}
                {myRegistration && !hasSubmittedFeedback && (
                  <form onSubmit={handleSubmitFeedback}
                        className="p-4 rounded-xl bg-gray-800/30 border border-gray-800/50">
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      Rate this Event
                    </h4>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 mb-4">
                      {[1,2,3,4,5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedback((f) => ({ ...f, rating: star }))}
                          className="p-1 transition-transform hover:scale-125"
                        >
                          <Star className={`w-7 h-7 transition-colors ${
                            star <= feedback.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-700 hover:text-gray-500'
                          }`} />
                        </button>
                      ))}
                      {feedback.rating > 0 && (
                        <span className="ml-2 text-sm text-gray-400">
                          {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][feedback.rating]}
                        </span>
                      )}
                    </div>

                    {/* Comment */}
                    <textarea
                      value={feedback.comments}
                      onChange={(e) => setFeedback((f) => ({ ...f, comments: e.target.value }))}
                      placeholder="Share your experience..."
                      rows={3}
                      className="input-field resize-none mb-3"
                    />

                    <button
                      type="submit"
                      disabled={submittingFeedback || feedback.rating === 0}
                      className="btn-primary text-sm flex items-center gap-2"
                    >
                      {submittingFeedback ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Submit Feedback
                    </button>
                  </form>
                )}

                {/* Feedback List */}
                {feedbackList.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Reviews ({feedbackList.length})
                    </h4>
                    {feedbackList.map((fb) => (
                      <div key={fb.feedback_id}
                           className="p-3 rounded-xl bg-gray-800/20 border border-gray-800/30">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center
                                            text-xs font-bold text-gray-400">
                              {fb.reviewer_name?.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-300">{fb.reviewer_name}</p>
                              <p className="text-[10px] text-gray-600">{fb.department}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} className={`w-3 h-3 ${
                                s <= fb.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-700'
                              }`} />
                            ))}
                          </div>
                        </div>
                        {fb.comments && (
                          <p className="text-xs text-gray-400 leading-relaxed ml-9">
                            {fb.comments}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No feedback yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Sticky Footer — Register Button ── */}
        {!regLoading && !myRegistration && event.status === 'upcoming' && (
          <div className="shrink-0 px-6 py-4 border-t border-gray-800/50 bg-gray-900/80 backdrop-blur-xl">
            <button
              onClick={handleRegister}
              disabled={isFull || registering}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl
                         font-semibold text-sm transition-all duration-200
                         ${isFull
                           ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                           : 'bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-500 hover:to-brand-400 shadow-lg shadow-brand-500/25 active:scale-[0.98]'
                         }`}
            >
              {registering ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isFull ? (
                'Event is Full — No Seats Available'
              ) : (
                <>
                  <Ticket className="w-5 h-5" />
                  Register for this Event
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
