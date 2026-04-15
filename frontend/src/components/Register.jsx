import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { toast } from './Toast';

const ROLE_OPTIONS = [
  {
    value: 'student',
    label: 'Student',
    description: 'Browse, register, and track your campus events.',
    icon: GraduationCap,
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Manage events, operations, and platform activity.',
    icon: ShieldCheck,
  },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    department: '',
    role: 'student',
    admin_secret_key: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'role' && value !== 'admin' ? { admin_secret_key: '' } : {}),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (!form.email.toLowerCase().endsWith('@iiit-bh.ac.in')) {
      toast.error('Only IIIT Bhubaneswar emails (@iiit-bh.ac.in) are allowed.');
      return;
    }

    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    if (!['student', 'admin'].includes(form.role)) {
      toast.error('Please choose a valid role.');
      return;
    }

    if (form.role === 'admin' && !form.admin_secret_key.trim()) {
      toast.error('Admin registration requires the admin key.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        department: form.department,
        role: form.role,
      };

      if (form.role === 'admin') {
        payload.admin_secret_key = form.admin_secret_key;
      }

      const user = await register(payload);
      toast.success(`Account created! Welcome, ${user.first_name}!`);
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr,0.95fr] lg:px-8">
        <section className="space-y-8">
          <div className="space-y-4">
            <p className="section-eyebrow">Account setup</p>
            <h1 className="section-title max-w-xl">
              Create a secure campus account and choose the access level you need before you sign in.
            </h1>
            <p className="section-copy max-w-xl">
              Student accounts can start exploring events right away. Admin accounts use the same form, but require an internal registration key for approval.
            </p>
          </div>

          <div className="glass-card max-w-xl p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">Before you continue</h2>
            <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                Use an email address ending with <span className="font-semibold text-slate-900">@iiit-bh.ac.in</span>.
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                Choose a password with at least 8 characters.
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                Admin registration is protected with an internal key. Student remains the default role.
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card p-8 sm:p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900">Create your account</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Fill in the details below to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-slate-700">Role</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {ROLE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const active = form.role === option.value;

                  return (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-xl border px-4 py-4 transition ${
                        active
                          ? 'border-brand-300 bg-brand-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={option.value}
                        checked={active}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg ${
                          active ? 'bg-white text-brand-700' : 'bg-slate-100 text-slate-600'
                        }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{option.description}</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="reg-fname" className="mb-2 block text-sm font-medium text-slate-700">
                  First name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="reg-fname"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder="Sneha"
                    className="input-field pl-11"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-lname" className="mb-2 block text-sm font-medium text-slate-700">
                  Last name
                </label>
                <input
                  id="reg-lname"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Reddy"
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="mb-2 block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="yourname@iiit-bh.ac.in"
                  className="input-field pl-11"
                  required
                />
              </div>
              <p className="mt-2 text-sm text-slate-500">Only IIIT Bhubaneswar email addresses are accepted.</p>
            </div>

            <div>
              <label htmlFor="reg-dept" className="mb-2 block text-sm font-medium text-slate-700">
                Department
              </label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="reg-dept"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  placeholder="Computer Science"
                  className="input-field pl-11"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  className="input-field pl-11 pr-11"
                  minLength={8}
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

            {form.role === 'admin' && (
              <div>
                <label htmlFor="reg-admin-key" className="mb-2 block text-sm font-medium text-slate-700">
                  Admin registration key
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="reg-admin-key"
                    name="admin_secret_key"
                    type={showAdminKey ? 'text' : 'password'}
                    value={form.admin_secret_key}
                    onChange={handleChange}
                    placeholder="Enter the internal admin key"
                    className="input-field pl-11 pr-11"
                    autoComplete="one-time-code"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminKey((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label={showAdminKey ? 'Hide admin registration key' : 'Show admin registration key'}
                  >
                    {showAdminKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  This key is required to prevent unauthorized admin sign-ups.
                </p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-700 transition hover:text-brand-800">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
