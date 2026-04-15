import { useEffect, useState } from 'react';
import {
  ArrowUpDown,
  Calendar,
  Clock3,
  IndianRupee,
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react';

import api from '../utils/api';
import { toast } from './Toast';
import EventDetailModal from './EventDetailModal';

const CATEGORY_OPTIONS = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar'];

const METRIC_STYLES = {
  events: {
    container: 'bg-brand-50 text-brand-700',
    icon: Calendar,
  },
  seats: {
    container: 'bg-emerald-50 text-emerald-700',
    icon: Users,
  },
  booked: {
    container: 'bg-amber-50 text-amber-700',
    icon: TrendingUp,
  },
  free: {
    container: 'bg-slate-100 text-slate-700',
    icon: Ticket,
  },
};

function formatEventDate(dateString) {
  const date = new Date(dateString);

  return {
    day: date.toLocaleDateString('en-IN', { day: '2-digit' }),
    month: date.toLocaleDateString('en-IN', { month: 'short' }),
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

function getFillWidth(event) {
  if (!event.max_capacity) {
    return 0;
  }

  return ((event.max_capacity - event.available_seats) / event.max_capacity) * 100;
}

export default function StudentDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, [category, sortBy]);

  async function fetchEvents() {
    setLoading(true);

    try {
      const params = { status: 'upcoming', sort_by: sortBy };

      if (category) {
        params.category = category;
      }

      if (search) {
        params.search = search;
      }

      const response = await api.get('/events', { params });
      setEvents(response.data.data.events || []);
    } catch {
      toast.error('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    fetchEvents();
  }

  const totalEvents = events.length;
  const totalSeats = events.reduce((sum, event) => sum + (event.max_capacity || 0), 0);
  const availableSeats = events.reduce((sum, event) => sum + (event.available_seats || 0), 0);
  const freeEvents = events.filter((event) => Number.parseFloat(event.registration_fee) === 0).length;

  const metrics = [
    {
      label: 'Upcoming events',
      value: totalEvents,
      style: METRIC_STYLES.events,
    },
    {
      label: 'Seats available',
      value: availableSeats,
      style: METRIC_STYLES.seats,
    },
    {
      label: 'Seats booked',
      value: totalSeats - availableSeats,
      style: METRIC_STYLES.booked,
    },
    {
      label: 'Free events',
      value: freeEvents,
      style: METRIC_STYLES.free,
    },
  ];

  return (
    <div className="page-shell space-y-8">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="section-eyebrow">Student dashboard</p>
          <div className="space-y-2">
            <h1 className="section-title">Discover upcoming campus events</h1>
            <p className="section-copy max-w-2xl">
              Browse what&apos;s happening next, filter by category, and register without leaving the page.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <ArrowUpDown className="h-4 w-4 text-slate-400" />
          <label htmlFor="event-sort" className="text-sm font-medium text-slate-600">
            Sort by
          </label>
          <select
            id="event-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
          >
            <option value="date">Nearest first</option>
            <option value="popularity">Most popular</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, style, value }) => {
          const Icon = style.icon;

          return (
            <article key={label} className="glass-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${style.container}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="glass-card p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div>
              <label htmlFor="event-search" className="mb-2 block text-sm font-medium text-slate-700">
                Search events
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="event-search"
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by event name, topic, or keyword"
                  className="input-field pl-11"
                />
              </div>
            </div>

            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                Category
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategory('')}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    category === ''
                      ? 'border-brand-200 bg-brand-50 text-brand-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All events
                </button>
                {CATEGORY_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setCategory((current) => (current === option ? '' : option))}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      category === option
                        ? 'border-brand-200 bg-brand-50 text-brand-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </form>

          <div className="flex items-end lg:justify-end">
            <button type="button" onClick={handleSearchSubmit} className="btn-primary w-full lg:w-auto">
              <Search className="h-4 w-4" />
              Apply filters
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
            <span className="text-sm font-medium text-slate-600">Loading upcoming events</span>
          </div>
        </div>
      ) : events.length === 0 ? (
        <section className="glass-card px-6 py-16 text-center">
          <Calendar className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-5 text-xl font-semibold text-slate-900">No events match your filters</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Try clearing the category or using a broader search term.
          </p>
          {(category || search) && (
            <button
              type="button"
              onClick={() => {
                setCategory('');
                setSearch('');
              }}
              className="btn-secondary mt-6"
            >
              Clear filters
            </button>
          )}
        </section>
      ) : (
        <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => {
            const date = formatEventDate(event.event_date);
            const fillWidth = Math.min(100, getFillWidth(event));
            const fullyBooked = event.available_seats <= 0;
            const eventPrice = Number.parseFloat(event.registration_fee);

            return (
              <article key={event.event_id} className="glass-card flex h-full flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <span className="badge border-slate-200 bg-slate-50 text-slate-600">
                      {event.category_name}
                    </span>
                    <div>
                      <h2 className="text-xl font-semibold leading-8 text-slate-900">{event.event_name}</h2>
                      {event.description && (
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="min-w-[72px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {date.month}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{date.day}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-slate-400" />
                    <span>{date.full} at {date.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>
                      {event.venue_name}
                      {event.building ? `, ${event.building}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-slate-400" />
                    <span>{eventPrice > 0 ? `₹${eventPrice.toFixed(0)}` : 'Free to attend'}</span>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">Seat availability</span>
                    <span className={`font-semibold ${fullyBooked ? 'text-red-600' : 'text-slate-900'}`}>
                      {event.available_seats} / {event.max_capacity}
                    </span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-200">
                    <div
                      className={`h-2 rounded-full ${fullyBooked ? 'bg-red-500' : 'bg-brand-500'}`}
                      style={{ width: `${fillWidth}%` }}
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <div className="text-sm text-slate-500">
                    {fullyBooked ? 'Registration closed' : 'Seats still available'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(event)}
                    className="btn-primary"
                  >
                    View details
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRegistrationChange={fetchEvents}
        />
      )}
    </div>
  );
}
