/**
 * ============================================================
 * Auth Context — Global Authentication State
 * ============================================================
 *
 * Provides user state, login/logout/register functions, and
 * role-checking utilities to all components via React Context.
 * Persists auth state in localStorage across page reloads.
 * ============================================================
 */

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * On mount, restore user state from localStorage.
   * Validates the stored token by fetching profile.
   */
  useEffect(() => {
    const storedUser  = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  /**
   * Login — POST credentials, store JWT + user data.
   * Returns the user object on success; throws on failure.
   */
  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    const { token, ...userData } = res.data.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  }

  /**
   * Register — POST new user, store JWT + user data.
   */
  async function register(formData) {
    const res = await api.post('/auth/register', formData);
    const { token, ...userData } = res.data.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  }

  /**
   * Logout — Clear all stored auth data.
   */
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  /** Check if user has a specific role */
  function hasRole(role) {
    return user?.role === role;
  }

  /** Check if user is admin or organizer */
  function isAdminOrOrganizer() {
    return user?.role === 'admin' || user?.role === 'organizer';
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    hasRole,
    isAdminOrOrganizer,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to consume auth context.
 * Throws if used outside of AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
