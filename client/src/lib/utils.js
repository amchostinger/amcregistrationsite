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
 * Trigger a browser CSV download from a Blob.
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
 * Badge colour mapping for registration/payment statuses.
 */
export function getStatusBadgeClass(status) {
  const map = {
    confirmed: 'bg-green-100 text-green-700',
    paid:       'bg-green-100 text-green-700',
    pending:    'bg-yellow-100 text-yellow-700',
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
  'Administrative Assistant','AMC Executive Member','Bishop','Conference Secretary',
  'General Secretary','Prelate','Presiding Bishop','Secretary of Conference',
];
