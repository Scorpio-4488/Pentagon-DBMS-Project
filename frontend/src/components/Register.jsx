/**
 * ============================================================
 * Register Page Component
 * ============================================================
 *
 * Student registration form. Posts to /api/auth/register,
 * stores JWT, and redirects to the student dashboard.
 * ============================================================
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from './Toast';
import { Sparkles, Mail, Lock, User, Building2, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({
    first_name: '',
    last_name:  '',
    email:      '',
    password:   '',
    department: '',
  });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const user = await register({ ...form, role: 'student' });
      toast.success(`Account created! Welcome, ${user.first_name}!`);
      navigate('/student/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Registration failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* ── Background ── */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[128px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-brand-600/20 rounded-full blur-[128px] animate-pulse-slow" />
      </div>

      <div className="w-full max-w-md animate-fade-in">

        {/* ── Header ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                          bg-gradient-to-br from-brand-500 to-purple-600
                          shadow-2xl shadow-brand-500/30 mb-5">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Join <span className="text-gradient">CampusHub</span>
          </h1>
          <p className="text-gray-400">Create your student account</p>
        </div>

        {/* ── Form ── */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-fname" className="block text-sm font-medium text-gray-300 mb-1.5">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    id="reg-fname"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder="Sneha"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="reg-lname" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Last Name
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

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@university.edu"
                  className="input-field pl-11"
                  required
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label htmlFor="reg-dept" className="block text-sm font-medium text-gray-300 mb-1.5">
                Department
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
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

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="reg-password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  className="input-field pl-11 pr-11"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Login Link ── */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
