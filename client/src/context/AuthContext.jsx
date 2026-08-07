/**
 * context/AuthContext.jsx
 * Simple JWT-based admin auth context replacing Clerk.
 */

import { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { setAuthToken } from '../lib/api';

export const AuthContext = createContext(null);

const TOKEN_KEY = 'amc_admin_token';
const ADMIN_KEY = 'amc_admin_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem(ADMIN_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setLoading(false);
      return;
    }
    setAuthToken(storedToken);
    axios
      .get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
      .then(({ data }) => {
        setAdmin(data.admin);
        setToken(storedToken);
      })
      .catch(() => {
        // Token expired or invalid — clear it
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ADMIN_KEY);
        setToken(null);
        setAdmin(null);
        setAuthToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/login`,
      { email, password }
    );
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(data.admin));
    setToken(data.token);
    setAdmin(data.admin);
    setAuthToken(data.token);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
    setToken(null);
    setAdmin(null);
    setAuthToken(null);
  }, []);

  const getToken = useCallback(async () => {
    return token || localStorage.getItem(TOKEN_KEY);
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, admin, isSignedIn: !!token, loading, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

