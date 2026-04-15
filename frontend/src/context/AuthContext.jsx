import { createContext, useContext, useEffect, useState } from 'react';

import api from '../utils/api';

const AuthContext = createContext(null);
const USER_STORAGE_KEY = 'user';
const TOKEN_STORAGE_KEY = 'token';

function persistAuth(user, token) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

function clearStoredAuth() {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!storedUser || !storedToken) {
      setLoading(false);
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch {
      clearStoredAuth();
    } finally {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    const { token, ...userData } = response.data.data;

    persistAuth(userData, token);
    setUser(userData);

    return userData;
  }

  async function register(formData) {
    const response = await api.post('/auth/register', formData);
    const { token, ...userData } = response.data.data;

    persistAuth(userData, token);
    setUser(userData);

    return userData;
  }

  function logout() {
    clearStoredAuth();
    setUser(null);
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    hasRole: (role) => user?.role === role,
    isAdminOrOrganizer: () => user?.role === 'admin' || user?.role === 'organizer',
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
