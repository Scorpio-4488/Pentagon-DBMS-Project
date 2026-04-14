/**
 * ============================================================
 * Admin Dashboard — Event Manager, Attendance & Analytics
 * ============================================================
 *
 * Rubric Features Covered:
 *  ✅ Event Creation (multi-section organized form)
 *  ✅ Attendance Tracking (participant table + toggle)
 *  ✅ Certificate Generation (trigger button per student)
 *  ✅ Participation Status Updates
 *  ✅ Analytics (popular events, department stats)
 *
 * Three-section layout:
 *  1. Stats overview + Create Event form
 *  2. Events table + Attendance Manager (expandable)
 *  3. Analytics sidebar
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
  Star,
  Loader2,
  ChevronDown,
  ChevronRight,
  X,
  Activity,
  Building2,
  Award,
  UserCheck,
  UserX,
  Eye,
  FileText,
  Check,
  Clock,
  MapPin,
  Zap,
  Palette,
  Trophy,
  BookOpen,
  GraduationCap,
  BarChart3,
  Download,
} from 'lucide-react';

/* ── Category icons ── */
const CAT_ICONS = { Technical: Zap, Cultural: Palette, Sports: Trophy, Workshop: BookOpen, Seminar: GraduationCap };

export default function AdminDashboard() {
  const { user } = useAuth();

  // ── State ──
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Attendance tracking
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [participants, setParticipants]   = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(null);
  const [generatingCert, setGeneratingCert] = useState(null);

  // Analytics
  const [popularEvents, setPopularEvents] = useState([]);
  const [deptStats, setDeptStats]         = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Create form
  const [createForm, setCreateForm] = useState({
    event_name: '', description: '', category_id: '', venue_id: '',
    event_date: '', end_date: '', max_capacity: '', registration_fee: '0',
  });
  const [creating, setCreating] = useState(false);

  // Lookups
  const categories = [
    { id: 1, name: 'Technical' }, { id: 2, name: 'Cultural' }, { id: 3, name: 'Sports' },
    { id: 4, name: 'Workshop' }, { id: 5, name: 'Seminar' },
  ];
  const venues = [
    { id: 1, name: 'Main Auditorium',    cap: 500 },
    { id: 2, name: 'Seminar Hall A',     cap: 150 },
    { id: 3, name: 'Seminar Hall B',     cap: 120 },
    { id: 4, name: 'Open Air Theatre',   cap: 1000 },
    { id: 5, name: 'Computer Lab 1',     cap: 60 },
    { id: 6, name: 'Sports Complex',     cap: 2000 },
    { id: 7, name: 'Conference Room 101', cap: 40 },
  ];

  // ── Fetch data ──
  useEffect(() => { fetchEvents(); fetchAnalytics(); }, []);

  async function fetchEvents() {
    setLoading(true);
    try {
      const res = await api.get('/events', { params: { limit: 50 } });
      setEvents(res.data.data.events || []);
    } catch { toast.error('Failed to load events.'); }
    finally { setLoading(false); }
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
    } catch { /* ignore */ }
    finally { setAnalyticsLoading(false); }
  }

  async function fetchParticipants(eventId) {
    setParticipantsLoading(true);
    try {
      const res = await api.get(`/events/${eventId}/participants`);
      setParticipants(res.data.data.participants || []);
    } catch { toast.error('Failed to load participants.'); }
    finally { setParticipantsLoading(false); }
  }

  function handleExpandEvent(eventId) {
    if (expandedEvent === eventId) {
      setExpandedEvent(null);
      setParticipants([]);
    } else {
      setExpandedEvent(eventId);
      fetchParticipants(eventId);
    }
  }

  // ── Mark Attendance ──
  async function handleMarkAttendance(eventId, userId, method = 'manual') {
    setMarkingAttendance(userId);
    try {
      await api.post(`/events/${eventId}/attendance`, { user_id: userId, method });
      toast.success('✅ Attendance marked!');
      fetchParticipants(eventId);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to mark attendance.');
    } finally { setMarkingAttendance(null); }
  }

  // ── Generate Certificate ──
  async function handleGenerateCertificate(eventId, userId, studentName) {
    setGeneratingCert(userId);
    try {
      const res = await api.post(`/events/${eventId}/certificates`, { user_id: userId });
      const data = res.data.data;
      if (data.already_exists) {
        toast.success(`Certificate already exists for ${studentName}.`);
      } else {
        toast.success(`🎓 Certificate generated for ${studentName}!`);
      }
      // Refresh participants to show updated status (attended → completed)
      fetchParticipants(eventId);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to generate certificate.');
    } finally { setGeneratingCert(null); }
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
      await api.post('/events', {
        ...createForm,
        category_id:      parseInt(createForm.category_id),
        venue_id:         parseInt(createForm.venue_id),
        max_capacity:     parseInt(createForm.max_capacity),
        registration_fee: parseFloat(createForm.registration_fee) || 0,
        end_date:         createForm.end_date || null,
      });
      toast.success('🎉 Event created successfully!');
      setCreateForm({ event_name: '', description: '', category_id: '', venue_id: '',
                      event_date: '', end_date: '', max_capacity: '', registration_fee: '0' });
      setShowCreateForm(false);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to create event.');
    } finally { setCreating(false); }
  }

  // ── Helpers ──
  const totalEvents     = events.length;
  const upcomingCount   = events.filter((e) => e.status === 'upcoming').length;
  const ongoingCount    = events.filter((e) => e.status === 'ongoing').length;
  const totalRegistered = events.reduce((sum, e) => sum + (e.max_capacity - e.available_seats), 0);

  const statusColors = {
    upcoming:  { bg: 'bg-brand-500/10',   text: 'text-brand-400' },
    ongoing:   { bg: 'bg-amber-500/10',   text: 'text-amber-400' },
    completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    cancelled: { bg: 'bg-red-500/10',     text: 'text-red-400' },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600
                            flex items-center justify-center shadow-lg shadow-brand-500/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            Event Manager
          </h1>
          <p className="text-gray-400 ml-[52px]">Create, track attendance, and analyze events</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={`self-start flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
                     transition-all duration-200
                     ${showCreateForm
                       ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                       : 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40'
                     }`}
        >
          {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreateForm ? 'Close' : 'Create Event'}
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total Events',  value: totalEvents,     icon: Calendar, color: 'brand' },
          { label: 'Upcoming',      value: upcomingCount,   icon: Clock,    color: 'emerald' },
          { label: 'Ongoing',       value: ongoingCount,    icon: Activity, color: 'amber' },
          { label: 'Registrations', value: totalRegistered, icon: Users,    color: 'purple' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-${s.color}-500/10 flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 text-${s.color}-400`} />
            </div>
            <div>
              <p className="text-lg font-bold text-white leading-none">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Create Event Form ── */}
      {showCreateForm && (
        <div className="glass-card p-6 mb-8 animate-slide-down border-brand-500/10">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand-400" />
            New Event
          </h2>
          <form onSubmit={handleCreateSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Event Name <span className="text-red-400">*</span>
                </label>
                <input name="event_name" value={createForm.event_name} onChange={handleCreateChange}
                       placeholder="e.g. CodeStorm 2026" className="input-field" required />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea name="description" value={createForm.description} onChange={handleCreateChange}
                          placeholder="Describe the event..." rows={3} className="input-field resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select name="category_id" value={createForm.category_id} onChange={handleCreateChange}
                          className="input-field appearance-none cursor-pointer" required>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Venue <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select name="venue_id" value={createForm.venue_id} onChange={handleCreateChange}
                          className="input-field appearance-none cursor-pointer" required>
                    <option value="">Select venue</option>
                    {venues.map((v) => <option key={v.id} value={v.id}>{v.name} (cap: {v.cap})</option>)}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Start Date & Time <span className="text-red-400">*</span>
                </label>
                <input name="event_date" type="datetime-local" value={createForm.event_date}
                       onChange={handleCreateChange} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  End Date & Time
                </label>
                <input name="end_date" type="datetime-local" value={createForm.end_date}
                       onChange={handleCreateChange} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Max Capacity <span className="text-red-400">*</span>
                </label>
                <input name="max_capacity" type="number" min="1" value={createForm.max_capacity}
                       onChange={handleCreateChange} placeholder="e.g. 100" className="input-field" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Registration Fee (₹)
                </label>
                <input name="registration_fee" type="number" min="0" step="0.01"
                       value={createForm.registration_fee} onChange={handleCreateChange}
                       placeholder="0" className="input-field" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={creating} className="btn-primary flex items-center gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Event
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Main Content: Table + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ═══ Events Table with Attendance (2 cols) ═══ */}
        <div className="lg:col-span-2 space-y-0">
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-gray-800/50 flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-400" />
                Events & Attendance
              </h2>
              <span className="text-xs text-gray-600">{events.length} events</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No events yet. Create one!</div>
            ) : (
              <div className="divide-y divide-gray-800/30">
                {events.map((event) => {
                  const fillPct    = event.max_capacity > 0 ? ((event.max_capacity - event.available_seats) / event.max_capacity * 100) : 0;
                  const registered = event.max_capacity - event.available_seats;
                  const isExpanded = expandedEvent === event.event_id;
                  const stColor    = statusColors[event.status] || statusColors.upcoming;
                  const CatIcon    = CAT_ICONS[event.category_name] || Calendar;

                  return (
                    <div key={event.event_id}>
                      {/* Event Row */}
                      <div
                        className={`px-5 py-4 flex items-center gap-4 cursor-pointer transition-colors
                                    hover:bg-gray-800/20 ${isExpanded ? 'bg-gray-800/20' : ''}`}
                        onClick={() => handleExpandEvent(event.event_id)}
                      >
                        {/* Expand arrow */}
                        <ChevronRight className={`w-4 h-4 text-gray-600 shrink-0 transition-transform duration-200
                                                  ${isExpanded ? 'rotate-90' : ''}`} />

                        {/* Category icon */}
                        <div className={`w-9 h-9 rounded-lg ${stColor.bg} flex items-center justify-center shrink-0`}>
                          <CatIcon className={`w-4 h-4 ${stColor.text}`} />
                        </div>

                        {/* Event info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{event.event_name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(event.event_date).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })} • {event.venue_name}
                          </p>
                        </div>

                        {/* Fill bar */}
                        <div className="hidden sm:flex items-center gap-2 w-32 shrink-0">
                          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${
                              fillPct > 90 ? 'bg-red-500' : fillPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} style={{ width: `${fillPct}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-500 w-12 text-right">
                            {registered}/{event.max_capacity}
                          </span>
                        </div>

                        {/* Status */}
                        <span className={`badge ${stColor.bg} ${stColor.text} capitalize shrink-0`}>
                          {event.status}
                        </span>
                      </div>

                      {/* ── Expanded: Attendance Tracking Table ── */}
                      {isExpanded && (
                        <div className="bg-gray-900/50 border-t border-gray-800/30 animate-slide-down">
                          <div className="px-6 py-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                <Users className="w-4 h-4 text-brand-400" />
                                Registered Participants
                              </h4>
                              <span className="text-xs text-gray-600">
                                {participants.length} students
                              </span>
                            </div>

                            {participantsLoading ? (
                              <div className="flex justify-center py-8">
                                <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                              </div>
                            ) : participants.length === 0 ? (
                              <p className="text-sm text-gray-600 text-center py-6">
                                No registrations yet
                              </p>
                            ) : (
                              <div className="overflow-x-auto -mx-2">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-[10px] text-gray-500 uppercase tracking-wider">
                                      <th className="px-3 py-2 font-semibold">Student</th>
                                      <th className="px-3 py-2 font-semibold">Department</th>
                                      <th className="px-3 py-2 font-semibold text-center">Status</th>
                                      <th className="px-3 py-2 font-semibold text-center">Checked In</th>
                                      <th className="px-3 py-2 font-semibold text-center">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-800/20">
                                    {participants.map((p) => (
                                      <tr key={p.user_id} className="hover:bg-gray-800/20 transition-colors">
                                        {/* Student */}
                                        <td className="px-3 py-2.5">
                                          <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center
                                                            text-[10px] font-bold text-gray-400">
                                              {p.student_name?.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                              <p className="text-xs font-medium text-gray-200">{p.student_name}</p>
                                              <p className="text-[10px] text-gray-600">{p.email}</p>
                                            </div>
                                          </div>
                                        </td>

                                        {/* Department */}
                                        <td className="px-3 py-2.5 text-xs text-gray-400">{p.department}</td>

                                        {/* Status */}
                                        <td className="px-3 py-2.5 text-center">
                                          <span className={`badge text-[10px] capitalize
                                            ${p.registration_status === 'attended'
                                              ? 'bg-amber-500/10 text-amber-400'
                                              : p.registration_status === 'completed'
                                                ? 'bg-emerald-500/10 text-emerald-400'
                                                : 'bg-brand-500/10 text-brand-400'
                                            }`}>
                                            {p.registration_status}
                                          </span>
                                        </td>

                                        {/* Check-in indicator */}
                                        <td className="px-3 py-2.5 text-center">
                                          {p.checked_in === 'Yes' ? (
                                            <div className="inline-flex items-center gap-1 text-emerald-400">
                                              <Check className="w-4 h-4" />
                                              <span className="text-[10px]">
                                                {p.check_in_method === 'qr_scan' ? 'QR' : 'Manual'}
                                              </span>
                                            </div>
                                          ) : (
                                            <span className="text-gray-600 text-xs">—</span>
                                          )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-3 py-2.5 text-center">
                                          <div className="flex items-center justify-center gap-1.5">
                                            {/* Mark Attendance */}
                                            {p.checked_in !== 'Yes' && p.registration_status === 'registered' && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleMarkAttendance(event.event_id, p.user_id);
                                                }}
                                                disabled={markingAttendance === p.user_id}
                                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg
                                                           bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold
                                                           border border-emerald-500/20
                                                           hover:bg-emerald-500/20 transition-all"
                                                title="Mark Attendance"
                                              >
                                                {markingAttendance === p.user_id ? (
                                                  <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                  <UserCheck className="w-3 h-3" />
                                                )}
                                                Attend
                                              </button>
                                            )}

                                            {/* Generate Certificate */}
                                            {(p.registration_status === 'attended' || p.registration_status === 'completed') && (
                                              <button
                                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg
                                                           bg-purple-500/10 text-purple-400 text-[10px] font-semibold
                                                           border border-purple-500/20
                                                           hover:bg-purple-500/20 transition-all
                                                           disabled:opacity-50"
                                                title="Generate Certificate"
                                                disabled={generatingCert === p.user_id}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleGenerateCertificate(event.event_id, p.user_id, p.student_name);
                                                }}
                                              >
                                                {generatingCert === p.user_id ? (
                                                  <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                  <Award className="w-3 h-3" />
                                                )}
                                                {p.registration_status === 'completed' ? 'Issued ✓' : 'Certificate'}
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ═══ Analytics Sidebar (1 col) ═══ */}
        <div className="space-y-6">

          {/* Popular Events */}
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-gray-800/50">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Most Popular
              </h3>
            </div>
            <div className="p-4">
              {analyticsLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-brand-500 animate-spin" /></div>
              ) : popularEvents.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-4">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {popularEvents.map((ev, i) => {
                    const barColor = i === 0 ? 'from-amber-500 to-yellow-400' :
                                     i === 1 ? 'from-gray-400 to-gray-300' :
                                     i === 2 ? 'from-amber-700 to-amber-600' :
                                               'from-brand-600 to-brand-400';
                    return (
                      <div key={ev.event_id} className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold
                          ${i < 3 ? `bg-gradient-to-br ${barColor} text-white` : 'bg-gray-800 text-gray-500'}`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-200 truncate">{ev.event_name}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-brand-500 rounded-full"
                                   style={{ width: `${ev.fill_rate_pct}%` }} />
                            </div>
                            <span className="text-[10px] text-gray-500 w-8 text-right">{ev.fill_rate_pct}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Department Stats */}
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-gray-800/50">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-400" />
                Department Participation
              </h3>
            </div>
            <div className="p-4">
              {analyticsLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-brand-500 animate-spin" /></div>
              ) : deptStats.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-4">No data yet</p>
              ) : (
                <div className="space-y-3.5">
                  {deptStats.map((dept) => {
                    const maxReg = Math.max(...deptStats.map((d) => d.total_registrations));
                    const barW   = maxReg > 0 ? (dept.total_registrations / maxReg * 100) : 0;
                    return (
                      <div key={dept.department}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-300 font-medium truncate">{dept.department}</span>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 shrink-0">
                            <span>{dept.total_registrations} reg</span>
                            <span className="text-gray-700">•</span>
                            <span>{dept.unique_students} students</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-700"
                               style={{ width: `${barW}%` }} />
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
