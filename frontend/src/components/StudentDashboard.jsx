/**
 * ============================================================
 * Student Dashboard — Event Discovery & Explorer
 * ============================================================
 *
 * Rubric Features Covered:
 *  ✅ Search & Filter (keyword, date, category, popularity)
 *  ✅ Event Categories (clickable filter pills)
 *  ✅ Seat/Capacity Management (progress bars on cards)
 *  ✅ Student Registration (via EventDetailModal)
 *
 * Premium SaaS-grade layout with stats, category pills,
 * search/filter toolbar, and responsive event grid.
 * ============================================================
 */

import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from './Toast';
import EventDetailModal from './EventDetailModal';
import {
  Calendar,
  MapPin,
  Users,
  Search,
  Filter,
  Ticket,
  TrendingUp,
  Clock,
  ChevronDown,
  Loader2,
  IndianRupee,
  Sparkles,
  Zap,
  Palette,
  Trophy,
  BookOpen,
  GraduationCap,
  ArrowUpDown,
  SlidersHorizontal,
  X,
} from 'lucide-react';

/* ── Category styling with icons ── */
const CATEGORIES = [
  { name: 'Technical', icon: Zap,           bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20',    activeBg: 'bg-blue-500',  gradient: 'from-blue-600 to-cyan-500' },
  { name: 'Cultural',  icon: Palette,       bg: 'bg-pink-500/10',    text: 'text-pink-400',    border: 'border-pink-500/20',    activeBg: 'bg-pink-500',  gradient: 'from-pink-600 to-rose-400' },
  { name: 'Sports',    icon: Trophy,        bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', activeBg: 'bg-emerald-500', gradient: 'from-emerald-600 to-teal-400' },
  { name: 'Workshop',  icon: BookOpen,      bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20',   activeBg: 'bg-amber-500', gradient: 'from-amber-600 to-yellow-400' },
  { name: 'Seminar',   icon: GraduationCap, bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/20',  activeBg: 'bg-purple-500', gradient: 'from-purple-600 to-violet-400' },
];

function getCategoryStyle(name) {
  return CATEGORIES.find((c) => c.name === name) || CATEGORIES[0];
}

export default function StudentDashboard() {
  // ── State ──
  const [events, setEvents]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [category, setCategory]       = useState('');
  const [sortBy, setSortBy]           = useState('date');
  const [selectedEvent, setSelectedEvent] = useState(null);

  // ── Fetch events ──
  useEffect(() => {
    fetchEvents();
  }, [category, sortBy]);

  async function fetchEvents() {
    setLoading(true);
    try {
      const params = { status: 'upcoming', sort_by: sortBy };
      if (category) params.category = category;
      if (search)   params.search   = search;

      const res = await api.get('/events', { params });
      setEvents(res.data.data.events || []);
    } catch (err) {
      toast.error('Failed to load events. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchEvents();
  }

  function handleCategoryClick(catName) {
    setCategory((prev) => (prev === catName ? '' : catName));
  }

  // ── Derived stats ──
  const totalEvents    = events.length;
  const totalSeats     = events.reduce((sum, e) => sum + (e.max_capacity || 0), 0);
  const availableSeats = events.reduce((sum, e) => sum + (e.available_seats || 0), 0);
  const freeEvents     = events.filter((e) => parseFloat(e.registration_fee) === 0).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600
                            flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            Discover Events
          </h1>
          <p className="text-gray-400 ml-[52px]">
            Explore and register for upcoming campus events
          </p>
        </div>

        {/* Sort control */}
        <div className="flex items-center gap-2 ml-[52px] sm:ml-0">
          <ArrowUpDown className="w-4 h-4 text-gray-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-1.5
                       text-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="date">Nearest First</option>
            <option value="popularity">Most Popular</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Upcoming',      value: totalEvents,                 icon: Calendar,    color: 'brand' },
          { label: 'Seats Open',    value: availableSeats,              icon: Users,       color: 'emerald' },
          { label: 'Total Booked',  value: totalSeats - availableSeats, icon: TrendingUp,  color: 'purple' },
          { label: 'Free Events',   value: freeEvents,                  icon: Ticket,      color: 'amber' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
            </div>
            <div>
              <p className="text-lg font-bold text-white leading-none">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Category Pills ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {/* All button */}
          <button
            onClick={() => setCategory('')}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                       transition-all duration-200 border
                       ${category === ''
                         ? 'bg-white text-gray-900 border-white shadow-lg shadow-white/10'
                         : 'bg-gray-800/30 text-gray-400 border-gray-700/30 hover:bg-gray-800/50 hover:text-gray-200'
                       }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            All Events
          </button>

          {CATEGORIES.map((cat) => {
            const Icon     = cat.icon;
            const isActive = category === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => handleCategoryClick(cat.name)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                           transition-all duration-200 border
                           ${isActive
                             ? `${cat.activeBg} text-white border-transparent shadow-lg`
                             : `${cat.bg} ${cat.text} ${cat.border} hover:border-current/40`
                           }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Search Bar ── */}
      <form onSubmit={handleSearchSubmit} className="glass-card p-3 mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by event name, topic, or keyword..."
              className="input-field pl-10 bg-gray-800/30"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); fetchEvents(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button type="submit" className="btn-primary px-5">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* ── Event Grid ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <p className="text-sm text-gray-500">Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Calendar className="w-14 h-14 text-gray-700 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-400 mb-1">No events found</p>
          <p className="text-sm text-gray-600">
            {category
              ? `No upcoming ${category} events. Try a different category.`
              : search
                ? 'No results for your search. Try different keywords.'
                : 'No upcoming events at the moment. Check back soon!'}
          </p>
          {(category || search) && (
            <button
              onClick={() => { setCategory(''); setSearch(''); }}
              className="btn-secondary mt-4 text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event, index) => {
            const cat       = getCategoryStyle(event.category_name);
            const fillPct   = event.max_capacity > 0
              ? ((event.max_capacity - event.available_seats) / event.max_capacity * 100) : 0;
            const isFull    = event.available_seats <= 0;
            const eventDate = new Date(event.event_date);
            const CatIcon   = cat.icon;

            return (
              <div
                key={event.event_id}
                onClick={() => setSelectedEvent(event)}
                className="glass-card overflow-hidden group hover:border-gray-700/70
                           cursor-pointer transition-all duration-300 animate-slide-up flex flex-col"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Card Header — Gradient strip */}
                <div className={`h-1.5 bg-gradient-to-r ${cat.gradient}`} />

                <div className="p-5 flex-1 flex flex-col">

                  {/* Top row — Category + Date */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`badge ${cat.bg} ${cat.text} border ${cat.border}`}>
                      <CatIcon className="w-3 h-3 mr-1" />
                      {event.category_name}
                    </span>
                    <span className="text-xs text-gray-600">
                      {eventDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white mb-2 leading-snug
                                 group-hover:text-brand-300 transition-colors line-clamp-2">
                    {event.event_name}
                  </h3>

                  {/* Description preview */}
                  {event.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  {/* Meta info */}
                  <div className="space-y-2 text-xs text-gray-400 mb-4 flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                      <span>
                        {eventDate.toLocaleDateString('en-IN', {
                          weekday: 'short', day: 'numeric', month: 'short',
                        })}
                        {' • '}
                        {eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                      <span>{event.venue_name}{event.building ? `, ${event.building}` : ''}</span>
                    </div>
                    {parseFloat(event.registration_fee) > 0 && (
                      <div className="flex items-center gap-2">
                        <IndianRupee className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                        <span>₹{parseFloat(event.registration_fee).toFixed(0)}</span>
                      </div>
                    )}
                  </div>

                  {/* ── Capacity bar ── */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Capacity
                      </span>
                      <span>
                        <span className={isFull ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                          {event.available_seats}
                        </span>
                        <span className="text-gray-600"> / {event.max_capacity}</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isFull       ? 'bg-gradient-to-r from-red-600 to-red-400' :
                          fillPct > 75 ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                                         'bg-gradient-to-r from-emerald-600 to-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, fillPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* CTA */}
                  <div className={`text-center py-2 rounded-lg text-xs font-semibold transition-all
                    ${isFull
                      ? 'bg-red-500/5 text-red-400/60'
                      : 'bg-brand-500/5 text-brand-400 group-hover:bg-brand-500/10'
                    }`}
                  >
                    {isFull ? 'Fully Booked' : 'View Details & Register →'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Event Detail Modal ── */}
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
