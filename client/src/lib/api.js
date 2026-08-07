/**
 * lib/api.js
 * Axios instance pre-configured with the API base URL.
 * Admin requests automatically attach the Clerk Bearer token.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Origin the API is served from, i.e. VITE_API_URL without the trailing /api.
 * Used to resolve relative asset paths such as /uploads/speakers/x.jpg.
 */
export const API_ORIGIN = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');

/**
 * Resolve a stored image path to a fully usable URL.
 * Absolute URLs (http/https/data:) are returned untouched, so existing
 * speaker records that hold an external URL keep working.
 */
export function assetUrl(value) {
  if (!value) return '';
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return `${API_ORIGIN}${value.startsWith('/') ? '' : '/'}${value}`;
}

/**
 * Attach a Clerk JWT to admin API requests.
 * Call this once after signing in: setAuthToken(await getToken())
 */
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

// ─── Registration API ─────────────────────────────────────────────────────────

export const registrationApi = {
  submit: (data) => api.post('/registrations', data),
  getByRef: (ref) => api.get(`/registrations/${ref}`),
};

// ─── Payment API ──────────────────────────────────────────────────────────────

export const paymentApi = {
  initiate: (data) => api.post('/payments/initiate', data),
  poll: (paymentId) => api.get(`/payments/poll/${paymentId}`),
};

// ─── Admin API ────────────────────────────────────────────────────────────────

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getRegistrations: (params) => api.get('/admin/registrations', { params }),
  getRegistration: (id) => api.get(`/admin/registrations/${id}`),
  updateStatus: (id, status) => api.patch(`/admin/registrations/${id}/status`, { registration_status: status }),
  getPayments: (params) => api.get('/admin/payments', { params }),
  exportCsv: () => api.get('/admin/export/csv', { responseType: 'blob' }),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (settings) => api.patch('/admin/settings', settings),
  resendConfirmation: (id) => api.post(`/email/resend-confirmation/${id}`),
  resendPayment: (id) => api.post(`/email/resend-payment/${id}`),
};

export default api;
