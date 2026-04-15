import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { toast } from './Toast';

const DEMO_ACCOUNTS = [
  ['Student', 'sneha.reddy@iiit-bh.ac.in'],
  ['Organizer', 'priya.sharma@iiit-bh.ac.in'],
  ['Admin', 'arjun.mehta@iiit-bh.ac.in'],
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields.');
      return;
    }

    if (!email.toLowerCase().endsWith('@iiit-bh.ac.in')) {
      toast.error('Only IIIT Bhubaneswar emails (@iiit-bh.ac.in) are allowed.');
      return;
    }

    setLoading(true);

    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.first_name}!`);
      navigate(user.role === 'student' ? '/student/dashboard' : '/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr,0.9fr] lg:px-8">
        <section className="space-y-8">
          <div className="space-y-4">
            <p className="section-eyebrow">Campus event platform</p>
            <h1 className="section-title max-w-xl">
              Manage registrations, attendance, and campus events from one clean dashboard.
            </h1>
            <p className="section-copy max-w-xl">
              CampusHub keeps the workflow straightforward for students, organizers, and admins. Sign in with your institutional email to continue.
            </p>
          </div>

          <div className="glass-card max-w-xl p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">Demo access</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use any of the seeded accounts below with the password <span className="font-medium text-slate-900">Password123!</span>.
            </p>
            <div className="mt-6 space-y-4">
              {DEMO_ACCOUNTS.map(([role, value]) => (
                <div key={role} className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-medium text-slate-700">{role}</span>
                  <span className="text-sm text-slate-500">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="glass-card p-8 sm:p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use your IIIT Bhubaneswar email address to access the portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="yourname@iiit-bh.ac.in"
                  className="input-field pl-11"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-11 pr-11"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-700 transition hover:text-brand-800">
              Create one
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
