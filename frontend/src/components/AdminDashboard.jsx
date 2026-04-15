import { useEffect, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock3,
  Loader2,
  Plus,
  Trophy,
  Users,
  UserCheck,
  Award,
  Building2,
  Activity,
  X,
} from 'lucide-react';

import api from '../utils/api';
import { toast } from './Toast';

const CATEGORY_OPTIONS = [
  { id: 1, name: 'Technical' },
  { id: 2, name: 'Cultural' },
  { id: 3, name: 'Sports' },
  { id: 4, name: 'Workshop' },
  { id: 5, name: 'Seminar' },
];

const VENUE_OPTIONS = [
  { id: 1, name: 'Main Auditorium', capacity: 500 },
  { id: 2, name: 'Seminar Hall A', capacity: 150 },
  { id: 3, name: 'Seminar Hall B', capacity: 120 },
  { id: 4, name: 'Open Air Theatre', capacity: 1000 },
  { id: 5, name: 'Computer Lab 1', capacity: 60 },
  { id: 6, name: 'Sports Complex', capacity: 2000 },
  { id: 7, name: 'Conference Room 101', capacity: 40 },
];

const STATUS_STYLES = {
  upcoming: 'border-brand-200 bg-brand-50 text-brand-700',
  ongoing: 'border-amber-200 bg-amber-50 text-amber-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  cancelled: 'border-red-200 bg-red-50 text-red-700',
};

const METRIC_STYLES = {
  events: {
    icon: Calendar,
    container: 'bg-brand-50 text-brand-700',
  },
  upcoming: {
    icon: Clock3,
    container: 'bg-emerald-50 text-emerald-700',
  },
  ongoing: {
    icon: Activity,
    container: 'bg-amber-50 text-amber-700',
  },
  registrations: {
    icon: Users,
    container: 'bg-slate-100 text-slate-700',
  },
};

function formatEventDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [expandedEventId, setExpandedEventId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [markingAttendanceId, setMarkingAttendanceId] = useState(null);
  const [generatingCertificateId, setGeneratingCertificateId] = useState(null);

  const [popularEvents, setPopularEvents] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [createForm, setCreateForm] = useState({
    event_name: '',
    description: '',
    category_id: '',
    venue_id: '',
    event_date: '',
    end_date: '',
    max_capacity: '',
    registration_fee: '0',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchAnalytics();
  }, []);

  async function fetchEvents() {
    setLoading(true);

    try {
      const response = await api.get('/events', { params: { limit: 50 } });
      setEvents(response.data.data.events || []);
    } catch {
      toast.error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAnalytics() {
    setAnalyticsLoading(true);

    try {
      const [popularResponse, departmentResponse] = await Promise.all([
        api.get('/analytics/popular-events', { params: { limit: 5 } }),
        api.get('/analytics/departments'),
      ]);

      setPopularEvents(popularResponse.data.data.events || []);
      setDepartmentStats(departmentResponse.data.data.departments || []);
    } catch {
      toast.error('Failed to load analytics.');
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function fetchParticipants(eventId) {
    setParticipantsLoading(true);

    try {
      const response = await api.get(`/events/${eventId}/participants`);
      setParticipants(response.data.data.participants || []);
    } catch {
      toast.error('Failed to load participants.');
    } finally {
      setParticipantsLoading(false);
    }
  }

  function handleExpandEvent(eventId) {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
      setParticipants([]);
      return;
    }

    setExpandedEventId(eventId);
    fetchParticipants(eventId);
  }

  async function handleMarkAttendance(eventId, userId, method = 'manual') {
    setMarkingAttendanceId(userId);

    try {
      await api.post(`/events/${eventId}/attendance`, { user_id: userId, method });
      toast.success('Attendance marked.');
      fetchParticipants(eventId);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to mark attendance.');
    } finally {
      setMarkingAttendanceId(null);
    }
  }

  async function handleGenerateCertificate(eventId, userId, studentName) {
    setGeneratingCertificateId(userId);

    try {
      const response = await api.post(`/events/${eventId}/certificates`, { user_id: userId });
      const payload = response.data.data;

      if (payload.already_exists) {
        toast.success(`Certificate already exists for ${studentName}.`);
      } else {
        toast.success(`Certificate generated for ${studentName}.`);
      }

      fetchParticipants(eventId);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to generate certificate.');
    } finally {
      setGeneratingCertificateId(null);
    }
  }

  function handleCreateChange(event) {
    const { name, value } = event.target;
    setCreateForm((current) => ({ ...current, [name]: value }));
  }

  async function handleCreateSubmit(event) {
    event.preventDefault();

    if (
      !createForm.event_name
      || !createForm.category_id
      || !createForm.venue_id
      || !createForm.event_date
      || !createForm.max_capacity
    ) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setCreating(true);

    try {
      await api.post('/events', {
        ...createForm,
        category_id: Number.parseInt(createForm.category_id, 10),
        venue_id: Number.parseInt(createForm.venue_id, 10),
        max_capacity: Number.parseInt(createForm.max_capacity, 10),
        registration_fee: Number.parseFloat(createForm.registration_fee) || 0,
        end_date: createForm.end_date || null,
      });

      toast.success('Event created successfully.');
      setCreateForm({
        event_name: '',
        description: '',
        category_id: '',
        venue_id: '',
        event_date: '',
        end_date: '',
        max_capacity: '',
        registration_fee: '0',
      });
      setShowCreateForm(false);
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to create event.');
    } finally {
      setCreating(false);
    }
  }

  const totalEvents = events.length;
  const upcomingCount = events.filter((event) => event.status === 'upcoming').length;
  const ongoingCount = events.filter((event) => event.status === 'ongoing').length;
  const totalRegistrations = events.reduce(
    (sum, event) => sum + (event.max_capacity - event.available_seats),
    0
  );

  const metrics = [
    { label: 'Total events', value: totalEvents, style: METRIC_STYLES.events },
    { label: 'Upcoming', value: upcomingCount, style: METRIC_STYLES.upcoming },
    { label: 'Ongoing', value: ongoingCount, style: METRIC_STYLES.ongoing },
    { label: 'Registrations', value: totalRegistrations, style: METRIC_STYLES.registrations },
  ];

  const maxDepartmentRegistrations = Math.max(
    1,
    ...departmentStats.map((department) => department.total_registrations)
  );

  return (
    <div className="page-shell space-y-8">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="section-eyebrow">Organizer workspace</p>
          <h1 className="section-title">Manage events and attendance</h1>
          <p className="section-copy max-w-2xl">
            Create new events, monitor registrations, and follow participation trends from a single operational dashboard.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm((current) => !current)}
          className={showCreateForm ? 'btn-secondary' : 'btn-primary'}
        >
          {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showCreateForm ? 'Close form' : 'Create event'}
        </button>
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

      {showCreateForm && (
        <section className="glass-card p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Create a new event</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Add the core event details and publish it to the student dashboard.
            </p>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="event_name" className="mb-2 block text-sm font-medium text-slate-700">
                  Event name
                </label>
                <input
                  id="event_name"
                  name="event_name"
                  value={createForm.event_name}
                  onChange={handleCreateChange}
                  placeholder="CodeStorm 2026"
                  className="input-field"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={createForm.description}
                  onChange={handleCreateChange}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="Give attendees a quick overview of the event."
                />
              </div>

              <div>
                <label htmlFor="category_id" className="mb-2 block text-sm font-medium text-slate-700">
                  Category
                </label>
                <div className="relative">
                  <select
                    id="category_id"
                    name="category_id"
                    value={createForm.category_id}
                    onChange={handleCreateChange}
                    className="input-field appearance-none pr-10"
                    required
                  >
                    <option value="">Select category</option>
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label htmlFor="venue_id" className="mb-2 block text-sm font-medium text-slate-700">
                  Venue
                </label>
                <div className="relative">
                  <select
                    id="venue_id"
                    name="venue_id"
                    value={createForm.venue_id}
                    onChange={handleCreateChange}
                    className="input-field appearance-none pr-10"
                    required
                  >
                    <option value="">Select venue</option>
                    {VENUE_OPTIONS.map((venue) => (
                      <option key={venue.id} value={venue.id}>
                        {venue.name} ({venue.capacity})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label htmlFor="event_date" className="mb-2 block text-sm font-medium text-slate-700">
                  Start date and time
                </label>
                <input
                  id="event_date"
                  type="datetime-local"
                  name="event_date"
                  value={createForm.event_date}
                  onChange={handleCreateChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="end_date" className="mb-2 block text-sm font-medium text-slate-700">
                  End date and time
                </label>
                <input
                  id="end_date"
                  type="datetime-local"
                  name="end_date"
                  value={createForm.end_date}
                  onChange={handleCreateChange}
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="max_capacity" className="mb-2 block text-sm font-medium text-slate-700">
                  Max capacity
                </label>
                <input
                  id="max_capacity"
                  type="number"
                  min="1"
                  name="max_capacity"
                  value={createForm.max_capacity}
                  onChange={handleCreateChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="registration_fee" className="mb-2 block text-sm font-medium text-slate-700">
                  Registration fee
                </label>
                <input
                  id="registration_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  name="registration_fee"
                  value={createForm.registration_fee}
                  onChange={handleCreateChange}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={creating} className="btn-primary">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create event
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <section className="glass-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Events and attendance</h2>
              <p className="mt-1 text-sm text-slate-500">Review registrations and track attendance as events progress.</p>
            </div>
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
              {events.length} events
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : events.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Calendar className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No events yet</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create your first event to start collecting registrations.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {events.map((event) => {
                const registrations = event.max_capacity - event.available_seats;
                const fillPercent = event.max_capacity
                  ? Math.min(100, (registrations / event.max_capacity) * 100)
                  : 0;
                const expanded = expandedEventId === event.event_id;

                return (
                  <div key={event.event_id}>
                    <button
                      type="button"
                      onClick={() => handleExpandEvent(event.event_id)}
                      className={`flex w-full items-start gap-4 px-6 py-5 text-left transition hover:bg-slate-50 ${expanded ? 'bg-slate-50' : 'bg-white'}`}
                    >
                      <div className="mt-1 text-slate-400">
                        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>

                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <span className={`badge ${STATUS_STYLES[event.status] || STATUS_STYLES.upcoming}`}>
                                {event.status}
                              </span>
                              <span className="badge border-slate-200 bg-slate-50 text-slate-600">
                                {event.category_name}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">{event.event_name}</h3>
                            <p className="text-sm text-slate-500">
                              {formatEventDate(event.event_date)} · {event.venue_name}
                            </p>
                          </div>

                          <div className="min-w-[180px] rounded-xl border border-slate-200 bg-white px-4 py-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-slate-600">Capacity</span>
                              <span className="font-semibold text-slate-900">
                                {registrations}/{event.max_capacity}
                              </span>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-slate-200">
                              <div className="h-2 rounded-full bg-brand-500" style={{ width: `${fillPercent}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>

                    {expanded && (
                      <div className="border-t border-slate-200 bg-slate-50 px-6 py-6">
                        <div className="mb-4 flex items-center justify-between gap-4">
                          <div>
                            <h4 className="text-lg font-semibold text-slate-900">Registered participants</h4>
                            <p className="mt-1 text-sm text-slate-500">
                              Attendance actions and certificate issuance are available here.
                            </p>
                          </div>
                          <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">
                            {participants.length} students
                          </span>
                        </div>

                        {participantsLoading ? (
                          <div className="flex justify-center py-10">
                            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
                          </div>
                        ) : participants.length === 0 ? (
                          <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
                            No registrations yet.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                              <thead className="bg-slate-50">
                                <tr className="text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                                  <th className="px-4 py-3 font-semibold">Student</th>
                                  <th className="px-4 py-3 font-semibold">Department</th>
                                  <th className="px-4 py-3 font-semibold">Status</th>
                                  <th className="px-4 py-3 font-semibold">Check-in</th>
                                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {participants.map((participant) => {
                                  const canIssueCertificate = ['attended', 'completed'].includes(participant.registration_status);

                                  return (
                                    <tr key={participant.user_id}>
                                      <td className="px-4 py-4">
                                        <div className="space-y-1">
                                          <p className="font-medium text-slate-900">{participant.student_name}</p>
                                          <p className="text-xs text-slate-500">{participant.email}</p>
                                        </div>
                                      </td>
                                      <td className="px-4 py-4 text-slate-600">{participant.department || '—'}</td>
                                      <td className="px-4 py-4">
                                        <span className={`badge ${STATUS_STYLES[participant.registration_status] || STATUS_STYLES.upcoming}`}>
                                          {participant.registration_status}
                                        </span>
                                      </td>
                                      <td className="px-4 py-4 text-slate-600">
                                        {participant.checked_in === 'Yes'
                                          ? `Yes${participant.check_in_method ? ` · ${participant.check_in_method}` : ''}`
                                          : 'No'}
                                      </td>
                                      <td className="px-4 py-4">
                                        <div className="flex justify-end gap-2">
                                          {participant.checked_in !== 'Yes' && participant.registration_status === 'registered' && (
                                            <button
                                              type="button"
                                              onClick={() => handleMarkAttendance(event.event_id, participant.user_id)}
                                              disabled={markingAttendanceId === participant.user_id}
                                              className="btn-secondary"
                                            >
                                              {markingAttendanceId === participant.user_id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                              ) : (
                                                <UserCheck className="h-4 w-4" />
                                              )}
                                              Attend
                                            </button>
                                          )}

                                          {canIssueCertificate && (
                                            <button
                                              type="button"
                                              onClick={() => handleGenerateCertificate(
                                                event.event_id,
                                                participant.user_id,
                                                participant.student_name
                                              )}
                                              disabled={generatingCertificateId === participant.user_id}
                                              className="btn-primary px-4 py-2.5"
                                            >
                                              {generatingCertificateId === participant.user_id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                              ) : (
                                                <Award className="h-4 w-4" />
                                              )}
                                              Certificate
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="glass-card p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Popular events</h2>
                <p className="text-sm text-slate-500">Based on current fill rate.</p>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
              </div>
            ) : popularEvents.length === 0 ? (
              <p className="text-sm text-slate-500">No analytics data available yet.</p>
            ) : (
              <div className="space-y-4">
                {popularEvents.map((event, index) => (
                  <div key={event.event_id} className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{event.event_name}</p>
                        <p className="text-xs text-slate-500">{event.category_name}</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div className="h-2 rounded-full bg-brand-500" style={{ width: `${event.fill_rate_pct}%` }} />
                    </div>
                    <p className="text-xs text-slate-500">{event.fill_rate_pct}% filled</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="glass-card p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Department participation</h2>
                <p className="text-sm text-slate-500">Registrations across departments.</p>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
              </div>
            ) : departmentStats.length === 0 ? (
              <p className="text-sm text-slate-500">No analytics data available yet.</p>
            ) : (
              <div className="space-y-4">
                {departmentStats.map((department) => (
                  <div key={department.department} className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{department.department}</p>
                        <p className="text-xs text-slate-500">
                          {department.unique_students} students · {department.unique_events} events
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">
                        {department.total_registrations}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-slate-600"
                        style={{
                          width: `${(department.total_registrations / maxDepartmentRegistrations) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
