/**
 * lib/utils.js — Shared utility functions
 */

/**
 * Format a number as USD currency string.
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string to a human-readable format.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr));
}

/**
 * Calculate conference registration fee breakdown.
 * All categories: $400 USD (covers lunch, dinner, conference package)
 * Accommodation is paid separately to hotels for bed & breakfast.
 */
export const FEES = {
  Delegate: 400,
  Observer: 400,
  'Invited Guest': 400,
};
export const ACCOMMODATION_PER_NIGHT = 80; // Paid to hotel separately

export function calculateTotal(category, numPeople = 1, delegateDetails = []) {
  const people = Math.max(1, Number(numPeople || 1));
  const mainFee = FEES[category] || FEES.Delegate;

  if (Array.isArray(delegateDetails) && delegateDetails.length > 0) {
    return delegateDetails.reduce((sum, delegate) => sum + (FEES[delegate?.category] || FEES.Delegate), mainFee);
  }

  return mainFee * people;
}

export function calculateAccommodationTotal(accommodation, nights = 0, hotelPriceUsd = 0, hotelRooms = 0) {
  if (!accommodation) return 0;
  return Math.max(0, nights) * (hotelPriceUsd || ACCOMMODATION_PER_NIGHT) * Math.max(1, hotelRooms);
}

/**
 * Calculate countdown to a target date.
 * Returns { days, hours, minutes, seconds } or null if past.
 */
export function getCountdown(targetDate) {
  const diff = new Date(targetDate) - new Date();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

/**
 * Does `value` fall inside the [from, to] range chosen in a date-range filter?
 *
 * `from`/`to` come from <input type="date"> as plain YYYY-MM-DD with no zone,
 * so they are widened to cover the whole local day — a record created at 16:40
 * still matches when "to" is set to that same date. An empty bound is open.
 */
export function inDateRange(value, from, to) {
  if (!from && !to) return true;
  if (!value) return false;
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return false;
  if (from && at < new Date(`${from}T00:00:00`)) return false;
  if (to && at > new Date(`${to}T23:59:59.999`)) return false;
  return true;
}

/**
 * Trigger a browser file download from a Blob (CSV and PDF exports).
 */
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Pull a readable message out of a failed download.
 *
 * Requests made with responseType:'blob' hand back the *error* body as a Blob
 * too, so `err.response.data.error` is undefined and the admin would otherwise
 * only ever see the generic fallback. Read the blob back as text first.
 */
export async function downloadErrorMessage(err, fallback) {
  const data = err?.response?.data;
  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text()).error || fallback;
    } catch {
      return fallback;
    }
  }
  return data?.error || fallback;
}

/**
 * Badge colour mapping for registration/payment statuses.
 */
export function getStatusBadgeClass(status) {
  const map = {
    confirmed: 'bg-green-100 text-green-700',
    paid:       'bg-green-100 text-green-700',
    pending:    'bg-yellow-100 text-yellow-700',
    // Registered but never started a payment — distinct from a pending attempt.
    unpaid:     'bg-orange-100 text-orange-700',
    failed:     'bg-red-100 text-red-700',
    cancelled:  'bg-gray-100 text-gray-600',
    refunded:   'bg-purple-100 text-purple-700',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}

/**
 * Designation list (mirrors DB ENUM)
 */
export const DESIGNATIONS = [
  'Archbishop','Bishop','Dr','His Eminence','Most Revd Dr','Most Revd Prof',
  'Mr','Mrs','Ms','Presiding Prelate','Revd','Revd Dr','Rt Revd','Very Revd',
];

/**
 * Office list (mirrors DB ENUM)
 */
export const OFFICES = [
  'Administrative Assistant','Admin Bishop','AMC Executive Member','Bishop','Conference Secretary',
  'General Secretary','Prelate','Presiding Bishop','Secretary of Conference','Other',
];
