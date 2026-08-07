/**
 * hooks/useAdmin.js
 * Data fetching hooks for the admin dashboard.
 * Reads JWT from AuthContext (localStorage) on each request.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { adminApi, setAuthToken } from '../lib/api';

/**
 * Ensures the axios instance has the current token before any call.
 */
function useAdminToken() {
  const { token, isSignedIn } = useAuth();

  const withToken = useCallback(
    async (fn) => {
      if (!isSignedIn || !token) return;
      setAuthToken(token);
      return fn();
    },
    [token, isSignedIn]
  );

  return withToken;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export function useAdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const withToken = useAdminToken();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await withToken(async () => {
        const { data } = await adminApi.getStats();
        setStats(data);
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load stats.');
    } finally {
      setLoading(false);
    }
  }, [withToken]);

  useEffect(() => { refresh(); }, [refresh]);

  return { stats, loading, error, refresh };
}

// ─── Registrations List ───────────────────────────────────────────────────────

export function useAdminRegistrations(params = {}) {
  const [data, setData] = useState({ registrations: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const withToken = useAdminToken();

  const load = useCallback(
    async (queryParams) => {
      setLoading(true);
      try {
        await withToken(async () => {
          const { data: res } = await adminApi.getRegistrations(queryParams || params);
          setData(res);
        });
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load registrations.');
      } finally {
        setLoading(false);
      }
    },
    [withToken, params]
  );

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...data, loading, error, load };
}

// ─── Payments List ────────────────────────────────────────────────────────────

export function useAdminPayments(params = {}) {
  const [data, setData] = useState({ payments: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const withToken = useAdminToken();

  const load = useCallback(
    async (queryParams) => {
      setLoading(true);
      try {
        await withToken(async () => {
          const { data: res } = await adminApi.getPayments(queryParams || params);
          setData(res);
        });
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load payments.');
      } finally {
        setLoading(false);
      }
    },
    [withToken, params]
  );

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...data, loading, error, load };
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function useAdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const withToken = useAdminToken();

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      await withToken(async () => {
        const { data } = await adminApi.getSettings();
        setSettings(data.settings);
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }, [withToken]);

  const saveSettings = useCallback(async (updates) => {
    setSaving(true);
    try {
      await withToken(async () => {
        await adminApi.updateSettings(updates);
        setSettings((prev) => ({ ...prev, ...updates }));
      });
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  }, [withToken]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  return { settings, loading, saving, error, saveSettings, loadSettings };
}
