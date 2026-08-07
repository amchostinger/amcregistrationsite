/**
 * services/registrationService.js
 * Core business logic for registrations.
 */

const { query } = require('../config/db');

/**
 * Generate a unique AMC2027-XXXXX reference number.
 * Uses COUNT(*) to derive the next sequence number.
 */
async function generateRef() {
  const [rows] = await query('SELECT COUNT(*) AS count FROM registrants');
  const num = String(Number(rows[0].count) + 1).padStart(5, '0');
  return `AMC2027-${num}`;
}

/**
 * Registration fees in USD defaults when conference_settings cannot be read.
 */
const FEES = {
  Delegate: 400,
  Observer: 400,
  'Invited Guest': 400,
};
const ACCOMMODATION_FEE_PER_NIGHT = 80; // Paid to hotel separately

function normalizeRegistrantData(data) {
  const delegateDetails = typeof data.delegate_details === 'string'
    ? (() => {
        try { return JSON.parse(data.delegate_details); } catch { return []; }
      })()
    : Array.isArray(data.delegate_details)
      ? data.delegate_details
      : [];

  const normalized = {
    ...data,
    num_people: Math.max(1, Number(data.num_people || 1)),
    accommodation: Boolean(data.accommodation),
    hotel_rooms: Number(data.hotel_rooms || 0),
    accommodation_nights: Number(data.accommodation_nights || 0),
    amount_paid: Number(data.amount_paid || 0),
    delegate_details: delegateDetails,
  };

  if (normalized.accommodation) {
    normalized.hotel_rooms = Math.max(1, normalized.hotel_rooms || 1);
    normalized.accommodation_nights = Math.max(0, normalized.accommodation_nights || 5);
  } else {
    normalized.hotel_rooms = Number(data.hotel_rooms || 0);
    normalized.accommodation_nights = 0;
  }

  return normalized;
}

function calculateHotelTotal(data, accommodationNights = 0, defaultRate = ACCOMMODATION_FEE_PER_NIGHT) {
  if (!data.accommodation) return 0;
  const perNight = Number(data.hotel_price_usd || defaultRate || 0);
  const rooms = Math.max(1, Number(data.hotel_rooms || 0));
  return rooms * Number(accommodationNights || 0) * perNight;
}

/**
 * Calculate total payment amount for conference registration only.
 * Accommodation is handled separately by the hotel.
 *
 * @param {string} category       — 'Delegate' | 'Observer' | 'Invited Guest'
 * @param {number} numPeople      — Number of people in the delegation
 * @param {Array} delegateDetails — Details for additional delegates
 * @returns {number} Total in USD
 */
function calculateTotal(category, numPeople = 1, delegateDetails = []) {
  const people = Math.max(1, Number(numPeople || 1));
  const baseFee = FEES[category] || FEES.Delegate;

  if (Array.isArray(delegateDetails) && delegateDetails.length > 0) {
    return delegateDetails.reduce((sum, delegate) => {
      const delegateCategory = delegate?.category || category;
      return sum + (FEES[delegateCategory] || FEES.Delegate);
    }, baseFee);
  }

  return baseFee * people;
}

function calculateConferenceTotal(normalized, fees) {
  const mainCategoryFee = fees[normalized.category] || fees.Delegate;
  const delegates = Array.isArray(normalized.delegate_details) ? normalized.delegate_details : [];
  if (delegates.length > 0) {
    return delegates.reduce((sum, delegate) => {
      const category = delegate?.category || normalized.category;
      return sum + (fees[category] || fees.Delegate);
    }, mainCategoryFee);
  }
  return mainCategoryFee * normalized.num_people;
}

async function calculateRegistrantTotals(data) {
  const normalized = normalizeRegistrantData(data);
  const fees = await getLiveFees();
  const conferenceTotal = calculateConferenceTotal(normalized, fees);
  const hotelTotal = 0;
  const grandTotal = conferenceTotal;
  const amountPaid = Number(normalized.amount_paid || 0);
  const balanceDue = Math.max(0, grandTotal - amountPaid);
  return { conferenceTotal, hotelTotal, grandTotal, amountPaid, balanceDue };
}

/**
 * Fetch live fees from conference_settings (overrides hardcoded defaults).
 * Falls back to hardcoded values if DB is unavailable.
 */
async function getLiveFees() {
  try {
    const [rows] = await query(
      `SELECT setting_key, setting_value FROM conference_settings
       WHERE setting_key IN (
         'registration_fee_delegate_usd',
         'registration_fee_observer_usd',
         'registration_fee_guest_usd',
         'accommodation_fee_per_night_usd'
       )`
    );

    const map = {};
    rows.forEach((r) => { map[r.setting_key] = Number(r.setting_value); });

    return {
      Delegate: map['registration_fee_delegate_usd'] || FEES.Delegate,
      Observer: map['registration_fee_observer_usd'] || FEES.Observer,
      'Invited Guest': map['registration_fee_guest_usd'] || FEES['Invited Guest'],
      accommodationPerNight: map['accommodation_fee_per_night_usd'] || ACCOMMODATION_FEE_PER_NIGHT,
    };
  } catch {
    return { Delegate: FEES.Delegate, Observer: FEES.Observer, 'Invited Guest': FEES['Invited Guest'], accommodationPerNight: ACCOMMODATION_FEE_PER_NIGHT };
  }
}

async function createRegistrant(data) {
  const ref = await generateRef();
  const normalized = normalizeRegistrantData(data);
  const totals = await calculateRegistrantTotals(normalized);

  await query(
    `INSERT INTO registrants
       (registration_ref, designation, first_name, last_name, email, phone,
        office, category, church, country, accommodation, accommodation_nights,
        num_people, delegate_details, dietary_requirements, special_requests,
        hotel_id, hotel_booking_id, hotel_name, hotel_room_type, hotel_price_usd, hotel_rooms,
        conference_total, hotel_total, grand_total, amount_paid, balance_due)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ref,
      normalized.designation,
      normalized.first_name,
      normalized.last_name,
      normalized.email,
      normalized.phone || null,
      normalized.office,
      normalized.category,
      normalized.church || null,
      normalized.country || null,
      normalized.accommodation ? 1 : 0,
      normalized.accommodation_nights,
      normalized.num_people,
      JSON.stringify(normalized.delegate_details || []),
      normalized.dietary_requirements || null,
      normalized.special_requests || null,
      normalized.hotel_id || null,
      normalized.hotel_booking_id || null,
      normalized.hotel_name || null,
      normalized.hotel_room_type || null,
      Number(normalized.hotel_price_usd || 0),
      normalized.hotel_rooms,
      totals.conferenceTotal,
      totals.hotelTotal,
      totals.grandTotal,
      totals.amountPaid,
      totals.balanceDue,
    ]
  );

  const [rows] = await query('SELECT * FROM registrants WHERE registration_ref = ?', [ref]);
  return rows[0];
}

async function recalculateRegistrantTotals(registrant) {
  let record = registrant;
  const needsFreshRow = !record.category || typeof record.num_people === 'undefined' || typeof record.accommodation === 'undefined';

  if (needsFreshRow) {
    const [rows] = await query('SELECT * FROM registrants WHERE id = ?', [record.id]);
    if (!rows.length) throw new Error('Registrant not found');
    record = { ...rows[0], ...record };
  }

  const totals = await calculateRegistrantTotals(record);
  await query(
    `UPDATE registrants
       SET conference_total = ?, hotel_total = ?, grand_total = ?,
           amount_paid = ?, balance_due = ?
     WHERE id = ?`,
    [
      totals.conferenceTotal,
      totals.hotelTotal,
      totals.grandTotal,
      totals.amountPaid,
      totals.balanceDue,
      record.id,
    ]
  );
  return totals;
}

module.exports = { generateRef, calculateTotal, getLiveFees, createRegistrant, calculateRegistrantTotals, recalculateRegistrantTotals };
