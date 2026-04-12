/**
 * ============================================================
 * Admin Dashboard — Event Manager & Analytics
 * ============================================================
 *
 * Admin/Organizer view that provides:
 *   1. An event creation form (POST /api/events)
 *   2. A live event table with attendance & feedback metrics
 *   3. Department-wide analytics overview
 * ============================================================
 */

import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from './Toast';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  Star,
  Loader2,
  ChevronDown,
  X,
  MapPin,
  Clock,
  IndianRupee,
  Activity,
  Building2,
  Eye,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();

  // ── State ──
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Analytics data
  const [popularEvents, setPopularEvents] = useState([]);
  const [deptStats, setDeptStats]         = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Event creation form
  const [createForm, setCreateForm] = useState({
    event_name:       '',
    description:      '',
    category_id:      '',
    venue_id:         '',
    event_date:       '',
    end_date:         '',
    max_capacity:     '',
    registration_fee: '0',
  });
  const [creating, setCreating] = useState(false);

  // Lookup data
  const categories = [
    { id: 1, name: 'Technical' },
    { id: 2, name: 'Cultural' },
    { id: 3, name: 'Sports' },
    { id: 4, name: 'Workshop' },
    { id: 5, name: 'Seminar' },
  ];
  const venues = [
    { id: 1, name: 'Main Auditorium' },
    { id: 2, name: 'Seminar Hall A' },
    { id: 3, name: 'Seminar Hall B' },
    { id: 4, name: 'Open Air Theatre' },
    { id: 5, name: 'Computer Lab 1' },
    { id: 6, name: 'Sports Complex' },
    { id: 7, name: 'Conference Room 101' },
  ];

  // ── Fetch data on mount ──
  useEffect(() => {
    fetchEvents();
    fetchAnalytics();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    try {
      const res = await api.get('/events', { params: { limit: 50 } });
      setEvents(res.data.data.events || []);
    } catch (err) {
      toast.error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAnalytics() {
    setAnalyticsLoading(true);
    try {
      const [popRes, deptRes] = await Promise.all([
        api.get('/analytics/popular-events', { params: { limit: 5 } }),
        api.get('/analytics/departments'),
      ]);
      setPopularEvents(popRes.data.data.events || []);
      setDeptStats(deptRes.data.data.departments || []);
    } catch (err) {
      console.error('Analytics fetch failed:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  // ── Create Event ──
  function handleCreateChange(e) {
    setCreateForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();

    if (!createForm.event_name || !createForm.category_id || !createForm.venue_id ||
        !createForm.event_date || !createForm.max_capacity) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        ...createForm,
        category_id:      parseInt(createForm.category_id),
        venue_id:         parseInt(createForm.venue_id),
        max_capacity:     parseInt(createForm.max_capacity),
        registration_fee: parseFloat(createForm.registration_fee) || 0,
        end_date:         createForm.end_date || null,
      };
      await api.post('/events', payload);
      toast.success('Event created successfully!');

      // Reset form and refresh
      setCreateForm({
        event_name: '', description: '', category_id: '', venue_id: '',
        event_date: '', end_date: '', max_capacity: '', registration_fee: '0',
      });
      setShowCreateForm(false);
      fetchEvents();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to create event.';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  }

  // ── Derived stats ──
  const totalEvents     = events.length;
  const upcomingCount   = events.filter((e) => e.status === 'upcoming').length;
  const totalRegistered = events.reduce((sum, e) => sum + (e.max_capacity - e.available_seats), 0);

  // ── Status colors ──
  const statusStyle = (s) => ({
    upcoming:  'bg-brand-500/10 text-brand-400',
    ongoing:   'bg-amber-500/10 text-amber-400',
    completed: 'bg-emerald-500/10 text-emerald-400',
    cancelled: 'bg-red-500/10 text-red-400',
  }[s] || 'bg-gray-500/10 text-gray-400');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Event Manager</h1>
          <p className="text-gray-400">Create, manage, and analyze campus events</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary flex items-center gap-2 self-start"
        >
          {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreateForm ? 'Close Form' : 'Create Event'}
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalEvents}</p>
            <p className="text-sm text-gray-500">Total Events</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{upcomingCount}</p>
            <p className="text-sm text-gray-500">Upcoming</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalRegistered}</p>
            <p className="text-sm text-gray-500">Total Registrations</p>
          </div>
        </div>
      </div>

      {/* ── Create Event Form (Collapsible) ── */}
      {showCreateForm && (
        <div className="glass-card p-6 mb-8 animate-slide-down">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand-400" />
            Create New Event
          </h2>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Event Name */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Event Name <span className="text-red-400">*</span>
                </label>
                <input
                  name="event_name"
                  value={createForm.event_name}
                  onChange={handleCreateChange}
                  placeholder="e.g. CodeStorm 2026"
                  className="input-field"
                  required
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                <textarea
                  name="description"
                  value={createForm.description}
                  onChange={handleCreateChange}
                  placeholder="Describe the event..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    name="category_id"
                    value={createForm.category_id}
                    onChange={handleCreateChange}
                    className="input-field appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Venue <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    name="venue_id"
                    value={createForm.venue_id}
                    onChange={handleCreateChange}
                    className="input-field appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Select venue</option>
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Start Date & Time <span className="text-red-400">*</span>
                </label>
                <input
                  name="event_date"
                  type="datetime-local"
                  value={createForm.event_date}
                  onChange={handleCreateChange}
                  className="input-field"
                  required
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">End Date & Time</label>
                <input
                  name="end_date"
                  type="datetime-local"
                  value={createForm.end_date}
                  onChange={handleCreateChange}
                  className="input-field"
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Max Capacity <span className="text-red-400">*</span>
                </label>
                <input
                  name="max_capacity"
                  type="number"
                  min="1"
                  value={createForm.max_capacity}
                  onChange={handleCreateChange}
                  placeholder="100"
                  className="input-field"
                  required
                />
              </div>

              {/* Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Registration Fee (₹)</label>
                <input
                  name="registration_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={createForm.registration_fee}
                  onChange={handleCreateChange}
                  placeholder="0"
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={creating} className="btn-primary flex items-center gap-2">
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create Event
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Two-column layout: Events Table + Analytics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Events Table (2 cols) ── */}
        <div className="lg:col-span-2">
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-gray-800/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-400" />
                All Events
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No events found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800/50">
                      <th className="px-5 py-3 font-semibold">Event</th>
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold">Category</th>
                      <th className="px-5 py-3 font-semibold text-center">Seats</th>
                      <th className="px-5 py-3 font-semibold text-center">Fill %</th>
                      <th className="px-5 py-3 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/30">
                    {events.map((event) => {
                      const fillPct = event.max_capacity > 0
                        ? ((event.max_capacity - event.available_seats) / event.max_capacity * 100).toFixed(0)
                        : 0;

                      return (
                        <tr key={event.event_id} className="hover:bg-gray-800/20 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-white truncate max-w-[200px]">
                              {event.event_name}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">{event.venue_name}</p>
                          </td>
                          <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                            {new Date(event.event_date).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </td>
                          <td className="px-5 py-3.5 text-gray-400">{event.category_name}</td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="text-white font-medium">{event.max_capacity - event.available_seats}</span>
                            <span className="text-gray-600"> / {event.max_capacity}</span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    fillPct > 90 ? 'bg-red-500' : fillPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${fillPct}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-8">{fillPct}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`badge ${statusStyle(event.status)}`}>
                              {event.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Analytics Sidebar (1 col) ── */}
        <div className="space-y-6">

          {/* Popular Events */}
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-gray-800/50">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Popular Events
              </h3>
            </div>
            <div className="p-4">
              {analyticsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                </div>
              ) : popularEvents.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-4">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {popularEvents.map((ev, i) => (
                    <div key={ev.event_id} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-gray-800 flex items-center justify-center
                                       text-xs font-bold text-gray-500">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">{ev.event_name}</p>
                        <p className="text-xs text-gray-600">{ev.category_name}</p>
                      </div>
                      <span className={`text-xs font-bold ${
                        ev.fill_rate_pct > 80 ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {ev.fill_rate_pct}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Department Stats */}
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-gray-800/50">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-400" />
                Department Participation
              </h3>
            </div>
            <div className="p-4">
              {analyticsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                </div>
              ) : deptStats.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-4">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {deptStats.map((dept) => {
                    const maxReg = Math.max(...deptStats.map((d) => d.total_registrations));
                    const barW = maxReg > 0 ? (dept.total_registrations / maxReg * 100) : 0;

                    return (
                      <div key={dept.department}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-300 text-xs truncate">{dept.department}</span>
                          <span className="text-xs text-gray-500">
                            {dept.total_registrations} reg · {dept.unique_students} students
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-700"
                            style={{ width: `${barW}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
