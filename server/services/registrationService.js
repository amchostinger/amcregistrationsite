/**
 * services/registrationService.js
 * Core business logic for registrations.
 */

const { query } = require('../config/db');

const REF_PREFIX = 'AMC2027-';
const REF_PAD = 5;
// MySQL's duplicate-key error. Two registrations that race past the same MAX()
// collide here rather than silently sharing a reference.
const ER_DUP_ENTRY = 'ER_DUP_ENTRY';
const REF_MAX_ATTEMPTS = 8;

/**
 * Generate the next AMC2027-XXXXX reference number.
 *
 * Derived from MAX(sequence), never COUNT(*). COUNT(*) shrinks whenever a
 * registrant row is deleted, which walks the generator backwards onto
 * references that are still in use — a deleted test record was enough to make
 * every subsequent registration fail on the registration_ref unique key.
 * MAX() only ever moves forward, so a deletion leaves a gap instead of a
 * collision.
 *
 * Only well-formed AMC2027-<digits> references are considered, so a manually
 * inserted reference in another format cannot perturb the sequence.
 */
async function nextRefSequence() {
  const [rows] = await query(
    `SELECT MAX(CAST(SUBSTRING(registration_ref, ?) AS UNSIGNED)) AS max_seq
       FROM registrants
      WHERE registration_ref REGEXP '^AMC2027-[0-9]+$'`,
    [REF_PREFIX.length + 1]
  );
  return Number(rows[0]?.max_seq || 0) + 1;
}

function formatRef(sequence) {
  return `${REF_PREFIX}${String(sequence).padStart(REF_PAD, '0')}`;
}

async function generateRef() {
  return formatRef(await nextRefSequence());
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
    office_other: typeof data.office_other === 'string' ? data.office_other.trim() : null,
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
  const normalized = normalizeRegistrantData(data);
  const totals = await calculateRegistrantTotals(normalized);

  // Two registrations submitted at the same instant can both read the same
  // MAX(sequence) before either has inserted. The unique key on
  // registration_ref is what actually arbitrates that race; this loop walks the
  // loser onto the next free reference instead of surfacing a 500 to a delegate
  // who did nothing wrong.
  let sequence = await nextRefSequence();
  let ref;

  for (let attempt = 1; ; attempt += 1) {
    ref = formatRef(sequence);
    try {
      await insertRegistrant(ref, normalized, totals);
      break;
    } catch (err) {
      if (err.code !== ER_DUP_ENTRY || attempt >= REF_MAX_ATTEMPTS) throw err;
      // Re-read rather than blindly incrementing: a burst of concurrent
      // registrations may have moved the sequence on by more than one.
      sequence = Math.max(sequence + 1, await nextRefSequence());
    }
  }

  const [rows] = await query('SELECT * FROM registrants WHERE registration_ref = ?', [ref]);
  return rows[0];
}

async function insertRegistrant(ref, normalized, totals) {
  await query(
    `INSERT INTO registrants
       (registration_ref, designation, first_name, last_name, email, phone,
        office, office_other, category, church, country, accommodation, accommodation_nights,
        num_people, delegate_details, dietary_requirements, special_requests,
        hotel_id, hotel_booking_id, hotel_name, hotel_room_type, hotel_price_usd, hotel_rooms,
        conference_total, hotel_total, grand_total, amount_paid, balance_due)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ref,
      normalized.designation,
      normalized.first_name,
      normalized.last_name,
      normalized.email,
      normalized.phone || null,
      normalized.office,
      // Only meaningful alongside office = 'Other'; blanked otherwise so a
      // stale value can never outlive the choice that produced it.
      normalized.office === 'Other' ? (normalized.office_other || null) : null,
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


/**
 * Re-derive a registrant's money columns from the payments ledger.
 *
 * The Paynow paths add each settled payment onto amount_paid as it lands. That
 * is fine going forward but cannot be undone, and a bank transfer confirmed by
 * an admin can also be reverted (wrong slip, duplicate row, refund). Summing
 * the 'paid' rows instead makes every admin action reversible and self-healing:
 * whatever the ledger says is what the registrant owes.
 *
 * @param {number} registrantId
 * @returns {Promise<{grandTotal:number, amountPaid:number, balanceDue:number, paymentStatus:string, registrationStatus:string}>}
 */
async function syncRegistrantFinancials(registrantId) {
  const [regRows] = await query('SELECT * FROM registrants WHERE id = ?', [registrantId]);
  if (!regRows.length) throw new Error('Registrant not found');
  const registrant = regRows[0];

  const [paidRows] = await query(
    `SELECT COALESCE(SUM(amount), 0) AS paid FROM payments
     WHERE registrant_id = ? AND status = 'paid'`,
    [registrantId]
  );

  const grandTotal = Number(registrant.grand_total || 0);
  const amountPaid = Number(paidRows[0].paid || 0);
  const balanceDue = Math.max(0, grandTotal - amountPaid);
  // Settled only when the whole fee is in. A part payment stays 'pending' so it
  // keeps showing up on the outstanding list.
  const settled = grandTotal > 0 && amountPaid >= grandTotal;

  const paymentStatus = settled ? 'paid' : 'pending';
  // A cancelled registration stays cancelled — money moving does not un-cancel it.
  const registrationStatus = registrant.registration_status === 'cancelled'
    ? 'cancelled'
    : (settled ? 'confirmed' : 'pending');

  await query(
    `UPDATE registrants
       SET amount_paid = ?, balance_due = ?, payment_status = ?, registration_status = ?
     WHERE id = ?`,
    [amountPaid, balanceDue, paymentStatus, registrationStatus, registrantId]
  );

  return { grandTotal, amountPaid, balanceDue, paymentStatus, registrationStatus };
}

/**
 * What to print for someone's office/role.
 *
 * 'Other' is a bucket, not a job title — the title the registrant typed lives
 * in office_other. Used by the admin dashboard, the PDFs and the emails so all
 * three read the same.
 */
function officeLabel(person) {
  if (!person) return '';
  const office = person.office || '';
  if (office !== 'Other') return office;
  const typed = (person.office_other || '').trim();
  return typed || 'Other';
}

module.exports = { generateRef, calculateTotal, getLiveFees, createRegistrant, calculateRegistrantTotals, recalculateRegistrantTotals, syncRegistrantFinancials, officeLabel };
