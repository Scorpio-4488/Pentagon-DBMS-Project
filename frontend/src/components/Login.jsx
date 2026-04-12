/**
 * ============================================================
 * Login Page Component
 * ============================================================
 *
 * Clean login form that:
 *   1. POSTs credentials to /api/auth/login
 *   2. Stores JWT + user data via AuthContext
 *   3. Redirects based on role (admin/organizer → admin dashboard,
 *      student → student dashboard)
 * ============================================================
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from './Toast';
import { Sparkles, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const { login }   = useAuth();
  const navigate     = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);

      toast.success(`Welcome back, ${user.first_name}!`);

      // Redirect based on role
      if (user.role === 'admin' || user.role === 'organizer') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">

      {/* ── Background Effects ── */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-[128px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-[128px] animate-pulse-slow" />
      </div>

      <div className="w-full max-w-md animate-fade-in">

        {/* ── Brand Header ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                          bg-gradient-to-br from-brand-500 to-purple-600
                          shadow-2xl shadow-brand-500/30 mb-5">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to <span className="text-gradient">CampusHub</span>
          </h1>
          <p className="text-gray-400">Sign in to manage your campus events</p>
        </div>

        {/* ── Login Form ── */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="input-field pl-11"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-11 pr-11"
                  autoComplete="current-password"
                  required
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
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* ── Demo Credentials ── */}
          <div className="mt-6 p-4 rounded-xl bg-brand-500/5 border border-brand-500/10">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-2">Demo Credentials</p>
            <div className="space-y-1.5 text-xs text-gray-400">
              <p><span className="text-gray-500">Student:</span> sneha.reddy@university.edu</p>
              <p><span className="text-gray-500">Organizer:</span> priya.sharma@university.edu</p>
              <p><span className="text-gray-500">Admin:</span> arjun.mehta@university.edu</p>
              <p><span className="text-gray-500">Password:</span> Password123!</p>
            </div>
          </div>
        </div>

        {/* ── Register Link ── */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
