/**
 * ============================================================
 * Student Dashboard — Event Explorer
 * ============================================================
 *
 * Main student view that:
 *   1. Fetches upcoming events from GET /api/events
 *   2. Displays them in a grid with category, date, capacity
 *   3. Allows registration via POST /api/events/:id/register
 *   4. Gracefully handles 409 (already registered) and
 *      capacity-full errors with toast notifications
 * ============================================================
 */

import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from './Toast';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  MapPin,
  Users,
  Tag,
  Search,
  Filter,
  Ticket,
  TrendingUp,
  Clock,
  ChevronDown,
  Loader2,
  IndianRupee,
} from 'lucide-react';

// ── Category color map ──
const CATEGORY_COLORS = {
  Technical: { bg: 'bg-blue-500/10',   text: 'text-blue-400',    border: 'border-blue-500/20' },
  Cultural:  { bg: 'bg-pink-500/10',   text: 'text-pink-400',    border: 'border-pink-500/20' },
  Sports:    { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  Workshop:  { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
  Seminar:   { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/20' },
};

function getCategoryStyle(name) {
  return CATEGORY_COLORS[name] || { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };
}

export default function StudentDashboard() {
  const { user } = useAuth();

  // ── State ──
  const [events, setEvents]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [registering, setRegistering] = useState(null); // event_id being registered
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ── Fetch events on mount and when filters change ──
  useEffect(() => {
    fetchEvents();
  }, [category]);

  async function fetchEvents() {
    setLoading(true);
    try {
      const params = { status: 'upcoming' };
      if (category) params.category = category;
      if (search)   params.search   = search;

      const res = await api.get('/events', { params });
      setEvents(res.data.data.events || []);
    } catch (err) {
      toast.error('Failed to load events. Is the backend running?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchEvents();
  }

  /**
   * Register for an event.
   * Catches and displays specific error codes from the stored procedure.
   */
  async function handleRegister(eventId) {
    setRegistering(eventId);
    try {
      await api.post(`/events/${eventId}/register`);
      toast.success('Successfully registered! Check "My Events" for details.');

      // Update the local state to reflect the seat change
      setEvents((prev) =>
        prev.map((e) =>
          e.event_id === eventId
            ? { ...e, available_seats: Math.max(0, e.available_seats - 1) }
            : e
        )
      );
    } catch (err) {
      const status = err.response?.status;
      const code   = err.response?.data?.error?.code;
      const msg    = err.response?.data?.error?.message;

      if (status === 409 && code === 'ALREADY_REGISTERED') {
        toast.error('You are already registered for this event.');
      } else if (status === 409 && code === 'NO_SEATS_AVAILABLE') {
        toast.error('Sorry! This event is at full capacity.');
      } else if (status === 400 && code === 'EVENT_NOT_OPEN') {
        toast.error('This event is no longer accepting registrations.');
      } else if (status === 403) {
        toast.error('Only students can register for events.');
      } else {
        toast.error(msg || 'Registration failed. Please try again.');
      }
    } finally {
      setRegistering(null);
    }
  }

  // ── Derived stats ──
  const totalEvents    = events.length;
  const totalSeats     = events.reduce((sum, e) => sum + (e.max_capacity || 0), 0);
  const availableSeats = events.reduce((sum, e) => sum + (e.available_seats || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">

      {/* ── Page Header ── */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
          Explore Events
        </h1>
        <p className="text-gray-400">
          Discover and register for upcoming campus events
        </p>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalEvents}</p>
            <p className="text-sm text-gray-500">Upcoming Events</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{availableSeats}</p>
            <p className="text-sm text-gray-500">Seats Available</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalSeats - availableSeats}</p>
            <p className="text-sm text-gray-500">Total Registrations</p>
          </div>
        </div>
      </div>

      {/* ── Search & Filters ── */}
      <div className="glass-card p-4 mb-8">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events by name or keyword..."
              className="input-field pl-10"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field pl-10 pr-10 appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="">All Categories</option>
              <option value="Technical">Technical</option>
              <option value="Cultural">Cultural</option>
              <option value="Sports">Sports</option>
              <option value="Workshop">Workshop</option>
              <option value="Seminar">Seminar</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          <button type="submit" className="btn-primary whitespace-nowrap">
            Search
          </button>
        </form>
      </div>

      {/* ── Event Grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-400">No events found</p>
          <p className="text-sm text-gray-600 mt-1">Try adjusting your filters or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event, index) => {
            const catStyle  = getCategoryStyle(event.category_name);
            const fillPct   = event.max_capacity > 0
              ? ((event.max_capacity - event.available_seats) / event.max_capacity * 100).toFixed(0)
              : 0;
            const isFull    = event.available_seats <= 0;
            const eventDate = new Date(event.event_date);

            return (
              <div
                key={event.event_id}
                className="glass-card overflow-hidden group hover:border-gray-700/70
                           transition-all duration-300 animate-slide-up flex flex-col"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* Card Top — Category & Fill Rate */}
                <div className="p-5 pb-0 flex items-center justify-between">
                  <span className={`badge ${catStyle.bg} ${catStyle.text} border ${catStyle.border}`}>
                    {event.category_name}
                  </span>
                  <span className={`text-xs font-semibold ${isFull ? 'text-red-400' : 'text-gray-500'}`}>
                    {fillPct}% filled
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-2 leading-snug
                                 group-hover:text-brand-300 transition-colors">
                    {event.event_name}
                  </h3>

                  <div className="space-y-2.5 text-sm text-gray-400 mb-4 flex-1">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-gray-600 shrink-0" />
                      <span>
                        {eventDate.toLocaleDateString('en-IN', {
                          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                        })}{' '}
                        <span className="text-gray-600">•</span>{' '}
                        {eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-gray-600 shrink-0" />
                      <span>{event.venue_name}, {event.building}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-gray-600 shrink-0" />
                      <span>
                        <strong className={isFull ? 'text-red-400' : 'text-emerald-400'}>
                          {event.available_seats}
                        </strong>
                        <span className="text-gray-600"> / {event.max_capacity} seats</span>
                      </span>
                    </div>
                    {event.registration_fee > 0 && (
                      <div className="flex items-center gap-2.5">
                        <IndianRupee className="w-4 h-4 text-gray-600 shrink-0" />
                        <span>₹{parseFloat(event.registration_fee).toFixed(0)} registration fee</span>
                      </div>
                    )}
                  </div>

                  {/* Capacity bar */}
                  <div className="mb-4">
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull
                            ? 'bg-red-500'
                            : fillPct > 75
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, fillPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Register Button */}
                  <button
                    onClick={() => handleRegister(event.event_id)}
                    disabled={isFull || registering === event.event_id}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                                font-semibold text-sm transition-all duration-200
                                ${isFull
                                  ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                                  : 'bg-brand-600/20 text-brand-400 border border-brand-500/20 hover:bg-brand-600/30 hover:border-brand-500/40 active:scale-[0.98]'
                                }`}
                  >
                    {registering === event.event_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isFull ? (
                      'Fully Booked'
                    ) : (
                      <>
                        <Ticket className="w-4 h-4" />
                        Register Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
