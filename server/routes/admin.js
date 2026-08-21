/**
 * routes/admin.js
 * All routes protected by Clerk authentication middleware.
 * Admin-only API endpoints for the dashboard.
 */

const express = require('express');
const { Parser } = require('json2csv');

const { query, pool } = require('../config/db');
const clerkAuth = require('../middleware/clerkAuth');
const pdfService = require('../services/pdfService');

const router = express.Router();

// Apply Clerk auth to all admin routes
router.use(clerkAuth);

/**
 * Who performed an admin action, for the audit trail.
 *
 * The JWT issued by POST /api/auth/login carries { id, email, name } — there is
 * no `userId` claim, so every call site reading `req.auth.userId` was passing
 * undefined, which mysql2 rejects. Because auditLog swallows its own errors,
 * that failed silently and the audit trail stayed empty.
 */
const adminRef = (req) => req.auth?.email || (req.auth?.id != null ? String(req.auth.id) : null);

// Helper: log admin action to audit trail
async function auditLog(adminClerkId, action, targetTable, targetId, notes) {
  await query(
    `INSERT INTO admin_audit_log (admin_clerk_id, action, target_table, target_id, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [adminClerkId || null, action, targetTable || null, targetId || null, notes || null]
  ).catch((err) => console.error('[Audit Log Error]', err.message));
}

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────

router.get('/stats', async (req, res, next) => {
  try {
    const [totals] = await query(
      `SELECT
         COUNT(*) AS totalRegistrations,
         SUM(registration_status = 'confirmed') AS confirmedCount,
         SUM(registration_status = 'pending') AS pendingCount
       FROM registrants`
    );

    const [revenue] = await query(
      `SELECT COALESCE(SUM(p.amount), 0) AS totalRevenue
       FROM payments p
       WHERE p.status = 'paid'`
    );

    const [outstanding] = await query(
      `SELECT COALESCE(SUM(balance_due), 0) AS totalOutstanding,
              COALESCE(SUM(grand_total), 0) AS totalExpected
       FROM registrants`
    );

    const [byCategory] = await query(
      `SELECT category, COUNT(*) AS count FROM registrants GROUP BY category`
    );

    const [byCountry] = await query(
      `SELECT country, COUNT(*) AS count FROM registrants
       WHERE country IS NOT NULL GROUP BY country ORDER BY count DESC LIMIT 20`
    );

    const [recent] = await query(
      `SELECT r.id, r.registration_ref, r.designation, r.first_name, r.last_name,
              r.category, r.country, r.church, r.payment_status, r.registration_status, r.created_at
       FROM registrants r
       ORDER BY r.created_at DESC LIMIT 10`
    );

    return res.json({
      totalRegistrations: Number(totals[0].totalRegistrations),
      confirmedCount: Number(totals[0].confirmedCount),
      pendingCount: Number(totals[0].pendingCount),
      totalRevenue: Number(revenue[0].totalRevenue),
      totalOutstanding: Number(outstanding[0].totalOutstanding),
      totalExpected: Number(outstanding[0].totalExpected),
      byCategory,
      byCountry,
      recentRegistrations: recent,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/registrations ────────────────────────────────────────────

/**
 * A date-range bound arrives from <input type="date"> as YYYY-MM-DD. The "to"
 * bound is widened to the end of that day so a record saved at 16:40 still
 * falls inside a range that ends on its own date.
 */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
function dateBound(value, endOfDay) {
  if (!value || !DATE_ONLY.test(value)) return null;
  return endOfDay ? `${value} 23:59:59` : `${value} 00:00:00`;
}

/**
 * Search + filter clause shared by the registrations list and the CSV export,
 * so an export always contains exactly the rows the admin is looking at.
 */
function registrationFilters(q) {
  const conditions = ['1=1'];
  const params = [];

  if (q.search) {
    conditions.push(`(r.first_name LIKE ? OR r.last_name LIKE ? OR r.email LIKE ?
                      OR r.registration_ref LIKE ? OR r.phone LIKE ?
                      OR r.church LIKE ? OR r.country LIKE ?)`);
    const s = `%${q.search}%`;
    params.push(s, s, s, s, s, s, s);
  }
  if (q.status) {
    conditions.push('r.registration_status = ?');
    params.push(q.status);
  }
  if (q.category) {
    conditions.push('r.category = ?');
    params.push(q.category);
  }
  if (q.payment_status) {
    conditions.push('r.payment_status = ?');
    params.push(q.payment_status);
  }
  if (q.country) {
    conditions.push('r.country = ?');
    params.push(q.country);
  }

  const from = dateBound(q.date_from, false);
  const to = dateBound(q.date_to, true);
  if (from) { conditions.push('r.created_at >= ?'); params.push(from); }
  if (to) { conditions.push('r.created_at <= ?'); params.push(to); }

  return { where: conditions.join(' AND '), params };
}

router.get('/registrations', async (req, res, next) => {
  try {
    const pageValue = parseInt(req.query.page || '1', 10);
    const limitValue = parseInt(req.query.limit || '20', 10);
    const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
    const limit = Number.isInteger(limitValue) && limitValue > 0 ? Math.min(100, limitValue) : 20;
    const offset = (page - 1) * limit;

    const { where, params } = registrationFilters(req.query);

    const [countRows] = await query(
      `SELECT COUNT(*) AS total FROM registrants r WHERE ${where}`,
      params
    );

    const [rows] = await query(
      `SELECT r.*, p.amount, p.payment_method, p.status AS paynow_status, p.paid_at
       FROM registrants r
       LEFT JOIN payments p ON p.registrant_id = r.id AND p.status = 'paid'
       WHERE ${where}
       ORDER BY r.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return res.json({
      registrations: rows,
      total: Number(countRows[0].total),
      page,
      limit,
      totalPages: Math.ceil(Number(countRows[0].total) / limit),
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/registrations/:id ────────────────────────────────────────

router.get('/registrations/:id', async (req, res, next) => {
  try {
    const [rows] = await query('SELECT * FROM registrants WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Registrant not found.' });

    const [payments] = await query(
      'SELECT * FROM payments WHERE registrant_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );

    return res.json({ registrant: rows[0], payments });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/admin/registrations/:id/status ───────────────────────────────

router.patch('/registrations/:id/status', async (req, res, next) => {
  try {
    const { registration_status } = req.body;
    const validStatuses = ['pending','confirmed','cancelled'];

    if (!validStatuses.includes(registration_status)) {
      return res.status(422).json({ error: 'Invalid status value.' });
    }

    const [rows] = await query('SELECT id FROM registrants WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Registrant not found.' });

    await query(
      'UPDATE registrants SET registration_status = ? WHERE id = ?',
      [registration_status, req.params.id]
    );

    await auditLog(
      adminRef(req),
      'UPDATE_STATUS',
      'registrants',
      req.params.id,
      `Set registration_status to '${registration_status}'`
    );

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/payments ──────────────────────────────────────────────────

/**
 * The payments view is driven by *registrations*, not by rows in the payments
 * table, so its total always reconciles with the registrations page.
 *
 * Counting payment rows meant a registrant who never started a payment appeared
 * nowhere here — 18 registrations against 9 payment rows — and the nine people
 * who owed the most were precisely the ones missing. Each registration now
 * contributes exactly one row: its settled payment if there is one, otherwise
 * its most recent attempt, otherwise a synthetic 'unpaid' row.
 */
const PAYMENT_JOIN = `
  FROM registrants r
  LEFT JOIN payments p ON p.id = (
    SELECT p2.id FROM payments p2
    WHERE p2.registrant_id = r.id
    ORDER BY (p2.status = 'paid') DESC, p2.paid_at DESC, p2.created_at DESC
    LIMIT 1
  )`;

/** Status shown for a registration with no payment row at all. */
const DERIVED_STATUS = `COALESCE(p.status, 'unpaid')`;
/** Date a row is filtered and sorted on: when it was paid, attempted, or registered. */
const DERIVED_DATE = `COALESCE(p.paid_at, p.created_at, r.created_at)`;

/**
 * Search + filter clause shared by the payments list and the payments PDF
 * export, so a report always contains exactly the rows the admin is looking at.
 */
function paymentFilters(q) {
  const conditions = ['1=1'];
  const params = [];

  if (q.search) {
    conditions.push(`(r.registration_ref LIKE ? OR r.first_name LIKE ? OR r.last_name LIKE ?
                      OR r.email LIKE ? OR p.paynow_reference LIKE ?)`);
    const s = `%${q.search}%`;
    params.push(s, s, s, s, s);
  }
  if (q.status) {
    // Matches 'unpaid' too, which no payments row can carry.
    conditions.push(`${DERIVED_STATUS} = ?`);
    params.push(q.status);
  }
  if (q.method) {
    conditions.push('p.payment_method = ?');
    params.push(q.method);
  }
  if (q.currency) {
    conditions.push('p.currency = ?');
    params.push(q.currency);
  }
  if (q.category) {
    conditions.push('r.category = ?');
    params.push(q.category);
  }

  const from = dateBound(q.date_from, false);
  const to = dateBound(q.date_to, true);
  if (from) { conditions.push(`${DERIVED_DATE} >= ?`); params.push(from); }
  if (to) { conditions.push(`${DERIVED_DATE} <= ?`); params.push(to); }

  return { where: conditions.join(' AND '), params };
}

/**
 * Columns for a payments row. `payment_attempts` keeps the earlier attempts
 * visible even though only one row per registration is listed, so collapsing
 * them never hides a retry from the admin.
 */
const PAYMENT_COLUMNS = `
  p.id, p.registrant_id, p.paynow_reference, p.paynow_poll_url, p.paynow_status_raw,
  p.amount, p.currency, p.payment_method, p.paid_at, p.created_at,
  ${DERIVED_STATUS} AS status,
  ${DERIVED_DATE} AS activity_at,
  (SELECT COUNT(*) FROM payments p3 WHERE p3.registrant_id = r.id) AS payment_attempts,
  r.id AS registrant_row_id, r.registration_ref, r.designation, r.first_name, r.last_name,
  r.email, r.category, r.country, r.grand_total, r.amount_paid, r.balance_due,
  r.payment_status, r.registration_status`;

router.get('/payments', async (req, res, next) => {
  try {
    const pageValue = parseInt(req.query.page || '1', 10);
    const limitValue = parseInt(req.query.limit || '20', 10);
    const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
    const limit = Number.isInteger(limitValue) && limitValue > 0 ? Math.min(100, limitValue) : 20;
    const offset = (page - 1) * limit;

    const { where, params } = paymentFilters(req.query);

    const [countRows] = await query(
      `SELECT COUNT(*) AS total ${PAYMENT_JOIN} WHERE ${where}`,
      params
    );

    const [rows] = await query(
      `SELECT ${PAYMENT_COLUMNS}
       ${PAYMENT_JOIN}
       WHERE ${where}
       ORDER BY ${DERIVED_DATE} DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return res.json({
      payments: rows,
      total: Number(countRows[0].total),
      page,
      limit,
      totalPages: Math.ceil(Number(countRows[0].total) / limit),
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/export/csv ────────────────────────────────────────────────

router.get('/export/csv', async (req, res, next) => {
  try {
    // Same clause as the list, so "Export CSV" gives back what is on screen.
    const { where, params } = registrationFilters(req.query);

    const [rows] = await query(
      `SELECT r.registration_ref, r.designation, r.first_name, r.last_name,
              r.email, r.phone, r.office, r.category, r.church, r.country,
              r.accommodation, r.accommodation_nights, r.num_people, r.delegate_details,
              r.hotel_name, r.hotel_room_type, r.hotel_rooms,
              r.conference_total, r.hotel_total, r.grand_total,
              r.amount_paid, r.balance_due,
              r.payment_status, r.registration_status,
              r.dietary_requirements, r.special_requests, r.created_at,
              p.amount, p.currency, p.payment_method, p.paid_at
       FROM registrants r
       LEFT JOIN payments p ON p.registrant_id = r.id AND p.status = 'paid'
       WHERE ${where}
       ORDER BY r.created_at DESC`,
      params
    );

    const fields = [
      'registration_ref','designation','first_name','last_name','email','phone',
      'office','category','church','country','accommodation','accommodation_nights','num_people','delegate_details',
      'hotel_name','hotel_room_type','hotel_rooms','conference_total','hotel_total','grand_total','amount_paid','balance_due',
      'payment_status','registration_status','dietary_requirements','special_requests','created_at','amount','currency','payment_method','paid_at',
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(rows);

    await auditLog(adminRef(req), 'EXPORT_CSV', 'registrants', null, `Exported ${rows.length} records`);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="amc2027-registrations-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (err) {
    next(err);
  }
});

// ─── PDF Documents ────────────────────────────────────────────────────────────

/** Columns the registration PDFs read. Kept in one place so the single-record
 *  document and the bulk report never drift apart. */
const REGISTRATION_PDF_COLUMNS = `
  r.id, r.registration_ref, r.designation, r.first_name, r.last_name,
  r.email, r.phone, r.office, r.category, r.church, r.country,
  r.accommodation, r.accommodation_nights, r.num_people, r.delegate_details,
  r.hotel_name, r.hotel_room_type, r.hotel_price_usd, r.hotel_rooms,
  r.conference_total, r.hotel_total, r.grand_total, r.amount_paid, r.balance_due,
  r.payment_status, r.registration_status,
  r.dietary_requirements, r.special_requests, r.created_at`;

/** Human-readable description of the active filters, printed on the report. */
function describeFilters(q) {
  const parts = [];
  if (q.search) parts.push(`search "${q.search}"`);
  if (q.status) parts.push(`status ${q.status}`);
  if (q.payment_status) parts.push(`payment ${q.payment_status}`);
  if (q.category) parts.push(`category ${q.category}`);
  if (q.country) parts.push(`country ${q.country}`);
  if (q.method) parts.push(`method ${q.method}`);
  if (q.currency) parts.push(`currency ${q.currency}`);
  if (q.date_from) parts.push(`from ${q.date_from}`);
  if (q.date_to) parts.push(`to ${q.date_to}`);
  return parts.length ? parts.join(' · ') : null;
}

function sendPdf(res, buffer, filename) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.end(buffer);
}

// ─── GET /api/admin/registrations/:id/pdf ─────────────────────────────────────

router.get('/registrations/:id/pdf', async (req, res, next) => {
  try {
    const [rows] = await query('SELECT * FROM registrants WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Registrant not found.' });

    const [payments] = await query(
      'SELECT * FROM payments WHERE registrant_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );

    const buffer = await pdfService.buildRegistrationPdf(rows[0], payments);
    await auditLog(adminRef(req), 'EXPORT_PDF', 'registrants', req.params.id, 'Registration record PDF');

    return sendPdf(res, buffer, `AMC2027-registration-${rows[0].registration_ref}.pdf`);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/payments/:id/pdf ──────────────────────────────────────────

router.get('/payments/:id/pdf', async (req, res, next) => {
  try {
    const [payRows] = await query('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    if (!payRows.length) return res.status(404).json({ error: 'Payment not found.' });

    const [regRows] = await query('SELECT * FROM registrants WHERE id = ?', [payRows[0].registrant_id]);
    if (!regRows.length) return res.status(404).json({ error: 'Registrant for this payment not found.' });

    const buffer = await pdfService.buildPaymentPdf(payRows[0], regRows[0]);
    await auditLog(adminRef(req), 'EXPORT_PDF', 'payments', req.params.id, 'Payment receipt PDF');

    return sendPdf(res, buffer, `AMC2027-receipt-${regRows[0].registration_ref}-${payRows[0].id}.pdf`);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/export/registrations/pdf ──────────────────────────────────

/**
 * Bulk registrations report. Honours the same filters as the list, so it
 * exports what is on screen. `?detailed=true` appends a full record page per
 * registrant (including their payment history) after the summary listing.
 */
router.get('/export/registrations/pdf', async (req, res, next) => {
  try {
    const detailed = req.query.detailed === 'true';
    const { where, params } = registrationFilters(req.query);

    const [rows] = await query(
      `SELECT ${REGISTRATION_PDF_COLUMNS}
       FROM registrants r
       WHERE ${where}
       ORDER BY r.created_at DESC`,
      params
    );

    // The detailed pack embeds each registrant's payments; one grouped query
    // keeps this off the N+1 path for large exports.
    if (detailed && rows.length) {
      const [allPayments] = await query(
        `SELECT p.* FROM payments p WHERE p.registrant_id IN (${rows.map(() => '?').join(',')})
         ORDER BY p.created_at DESC`,
        rows.map((r) => r.id)
      );
      const byRegistrant = new Map();
      allPayments.forEach((p) => {
        if (!byRegistrant.has(p.registrant_id)) byRegistrant.set(p.registrant_id, []);
        byRegistrant.get(p.registrant_id).push(p);
      });
      rows.forEach((r) => { r.payments = byRegistrant.get(r.id) || []; });
    }

    const buffer = await pdfService.buildRegistrationsReportPdf(rows, {
      filterSummary: describeFilters(req.query),
      detailed,
    });

    await auditLog(adminRef(req), 'EXPORT_PDF', 'registrants', null,
      `Bulk registrations PDF (${rows.length} records${detailed ? ', detailed' : ''})`);

    return sendPdf(res, buffer, `amc2027-registrations-${Date.now()}.pdf`);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/export/payments/pdf ───────────────────────────────────────

router.get('/export/payments/pdf', async (req, res, next) => {
  try {
    const { where, params } = paymentFilters(req.query);

    const [rows] = await query(
      `SELECT ${PAYMENT_COLUMNS}
       ${PAYMENT_JOIN}
       WHERE ${where}
       ORDER BY ${DERIVED_DATE} DESC`,
      params
    );

    const buffer = await pdfService.buildPaymentsReportPdf(rows, {
      filterSummary: describeFilters(req.query),
    });

    await auditLog(adminRef(req), 'EXPORT_PDF', 'payments', null,
      `Bulk payments PDF (${rows.length} records)`);

    return sendPdf(res, buffer, `amc2027-payments-${Date.now()}.pdf`);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/settings ──────────────────────────────────────────────────

router.get('/settings', async (req, res, next) => {
  try {
    const [rows] = await query('SELECT setting_key, setting_value FROM conference_settings ORDER BY setting_key');
    const settings = {};
    rows.forEach((r) => { settings[r.setting_key] = r.setting_value; });
    return res.json({ settings });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/admin/settings ────────────────────────────────────────────────

router.patch('/settings', async (req, res, next) => {
  try {
    const updates = req.body; // { key: value, ... }

    if (!updates || typeof updates !== 'object') {
      return res.status(422).json({ error: 'Request body must be a key-value object.' });
    }

    for (const [key, value] of Object.entries(updates)) {
      await query(
        `UPDATE conference_settings SET setting_value = ? WHERE setting_key = ?`,
        [String(value), key]
      );
    }

    await auditLog(
      adminRef(req),
      'UPDATE_SETTINGS',
      'conference_settings',
      null,
      `Updated keys: ${Object.keys(updates).join(', ')}`
    );

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── SPEAKERS CRUD ────────────────────────────────────────────────────────────

router.get('/speakers', async (req, res, next) => {
  try {
    // Conference running order, matching the public page.
    const [rows] = await query('SELECT * FROM speakers ORDER BY display_order ASC, id ASC');
    res.json(rows);
  } catch (err) { next(err); }
});

// Headings the Speakers page groups people under.
// Mirrors SPEAKER_SECTIONS in client/src/lib/speakerSections.js.
const SPEAKER_CATEGORIES = [
  'speaker', 'keynote', 'workshop', 'constitutional',
  'strategic', 'host', 'secretary', 'awards',
];
const speakerCategory = (v) => (SPEAKER_CATEGORIES.includes(v) ? v : 'speaker');

router.post('/speakers', async (req, res, next) => {
  try {
    const { name, designation, church, country, bio, photo_url, keynote, category, display_order } = req.body;
    const [result] = await query(
      `INSERT INTO speakers (name, designation, church, country, bio, photo_url, keynote, category, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, designation || '', church || '', country || '', bio || '', photo_url || '', keynote ? 1 : 0, speakerCategory(category), display_order || 0]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) { next(err); }
});

router.put('/speakers/:id', async (req, res, next) => {
  try {
    const { name, designation, church, country, bio, photo_url, keynote, category, display_order } = req.body;
    await query(
      `UPDATE speakers SET name=?, designation=?, church=?, country=?, bio=?, photo_url=?, keynote=?, category=?, display_order=? WHERE id=?`,
      [name, designation || '', church || '', country || '', bio || '', photo_url || '', keynote ? 1 : 0, speakerCategory(category), display_order || 0, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/speakers/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM speakers WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─── RESOURCES CRUD ───────────────────────────────────────────────────────────

const RESOURCE_CATEGORIES = ['Presentation', 'Keynote Material', 'Document', 'Report', 'Other'];
const resourceCategory = (v) => (RESOURCE_CATEGORIES.includes(v) ? v : 'Document');

router.get('/resources', async (req, res, next) => {
  try {
    const [rows] = await query('SELECT * FROM resources ORDER BY display_order ASC, id DESC');
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/resources', async (req, res, next) => {
  try {
    const { title, description, category, speaker_name, file_url, external_url, file_size, published, display_order } = req.body;
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title is required' });
    if (!file_url && !external_url) return res.status(400).json({ error: 'Attach a file or provide a link' });

    const [result] = await query(
      `INSERT INTO resources (title, description, category, speaker_name, file_url, external_url, file_size, published, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [String(title).trim(), description || '', resourceCategory(category), speaker_name || '',
       file_url || '', external_url || '', Number(file_size) || 0, published === false ? 0 : 1, display_order || 0]
    );
    await auditLog(adminRef(req), 'create', 'resources', result.insertId, title);
    res.status(201).json({ id: result.insertId });
  } catch (err) { next(err); }
});

router.put('/resources/:id', async (req, res, next) => {
  try {
    const { title, description, category, speaker_name, file_url, external_url, file_size, published, display_order } = req.body;
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title is required' });

    await query(
      `UPDATE resources SET title=?, description=?, category=?, speaker_name=?, file_url=?, external_url=?,
              file_size=?, published=?, display_order=? WHERE id=?`,
      [String(title).trim(), description || '', resourceCategory(category), speaker_name || '',
       file_url || '', external_url || '', Number(file_size) || 0, published === false ? 0 : 1, display_order || 0, req.params.id]
    );
    await auditLog(adminRef(req), 'update', 'resources', req.params.id, title);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/resources/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM resources WHERE id=?', [req.params.id]);
    await auditLog(adminRef(req), 'delete', 'resources', req.params.id, null);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─── AWARD CATEGORIES CRUD ────────────────────────────────────────────────────

router.get('/award-categories', async (req, res, next) => {
  try {
    const [rows] = await query('SELECT * FROM award_categories ORDER BY display_order ASC, id ASC');
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/award-categories', async (req, res, next) => {
  try {
    const { title, description, criteria, published, display_order } = req.body;
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title is required' });

    const [result] = await query(
      `INSERT INTO award_categories (title, description, criteria, published, display_order)
       VALUES (?, ?, ?, ?, ?)`,
      [String(title).trim(), description || '', criteria || '', published === false ? 0 : 1, display_order || 0]
    );
    await auditLog(adminRef(req), 'create', 'award_categories', result.insertId, title);
    res.status(201).json({ id: result.insertId });
  } catch (err) { next(err); }
});

router.put('/award-categories/:id', async (req, res, next) => {
  try {
    const { title, description, criteria, published, display_order } = req.body;
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'Title is required' });

    await query(
      `UPDATE award_categories SET title=?, description=?, criteria=?, published=?, display_order=? WHERE id=?`,
      [String(title).trim(), description || '', criteria || '', published === false ? 0 : 1, display_order || 0, req.params.id]
    );
    await auditLog(adminRef(req), 'update', 'award_categories', req.params.id, title);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/award-categories/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM award_categories WHERE id=?', [req.params.id]);
    await auditLog(adminRef(req), 'delete', 'award_categories', req.params.id, null);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─── SCHEDULE CRUD ────────────────────────────────────────────────────────────

router.get('/schedule', async (req, res, next) => {
  try {
    const { date } = req.query;
    const [rows] = date
      ? await query('SELECT * FROM schedule_sessions WHERE session_date=? ORDER BY start_time', [date])
      : await query('SELECT * FROM schedule_sessions ORDER BY session_date, start_time');
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/schedule', async (req, res, next) => {
  try {
    const { session_date, start_time, end_time, title, room, type, description } = req.body;
    const [result] = await query(
      `INSERT INTO schedule_sessions (session_date, start_time, end_time, title, room, type, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [session_date, start_time, end_time || null, title, room || '', type || 'general', description || '']
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) { next(err); }
});

router.put('/schedule/:id', async (req, res, next) => {
  try {
    const { session_date, start_time, end_time, title, room, type, description } = req.body;
    await query(
      `UPDATE schedule_sessions SET session_date=?, start_time=?, end_time=?, title=?, room=?, type=?, description=? WHERE id=?`,
      [session_date || null, start_time || null, end_time || null, title || '', room || '', type || 'general', description || '', req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/schedule/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM schedule_sessions WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─── HOTELS CRUD ──────────────────────────────────────────────────────────────

router.get('/hotels', async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT id, name, stars, address, distance_km, price_usd, room_type,
              total_rooms, available_rooms, description, photo_url, website_url, active
       FROM hotels
       ORDER BY id ASC`
    );

    const hotels = rows.map((h) => ({
      id: Number(h.id || 0),
      name: h.name || '',
      stars: Number(h.stars || 0),
      address: h.address || '',
      distance_km: Number(h.distance_km || 0),
      price_usd: Number(h.price_usd || 0),
      room_type: h.room_type || '',
      total_rooms: Number(h.total_rooms || 0),
      available_rooms: Number(h.available_rooms || 0),
      description: h.description || '',
      photo_url: h.photo_url || '',
      website_url: h.website_url || '',
      active: h.active === 1 || h.active === true || h.active === '1' || h.active === 'true',
    }));

    res.json(hotels);
  } catch (err) { next(err); }
});

router.post('/hotels', async (req, res, next) => {
  try {
    const { name, stars, address, distance_km, price_usd, room_type, total_rooms, available_rooms, description, photo_url, website_url, active } = req.body;
    const [result] = await query(
      `INSERT INTO hotels (name, stars, address, distance_km, price_usd, room_type, total_rooms, available_rooms, description, photo_url, website_url, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, stars || 3, address || '', distance_km || 0, price_usd || 0, room_type || 'Standard Room',
       total_rooms || 0, available_rooms || 0, description || '', photo_url || '', website_url || '', active !== false ? 1 : 0]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) { next(err); }
});

router.put('/hotels/:id', async (req, res, next) => {
  try {
    const { name, stars, address, distance_km, price_usd, room_type, total_rooms, available_rooms, description, photo_url, website_url, active } = req.body;
    await query(
      `UPDATE hotels SET name=?, stars=?, address=?, distance_km=?, price_usd=?, room_type=?, total_rooms=?, available_rooms=?, description=?, photo_url=?, website_url=?, active=? WHERE id=?`,
      [name, stars || 3, address || '', distance_km || 0, price_usd || 0, room_type || 'Standard Room',
       total_rooms || 0, available_rooms || 0, description || '', photo_url || '', website_url || '', active !== false ? 1 : 0, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/hotels/:id', async (req, res, next) => {
  try {
    const [rows] = await query(
      'SELECT COUNT(*) AS relatedBookings FROM hotel_bookings WHERE hotel_id = ? AND status != ?',
      [req.params.id, 'cancelled']
    );
    if (rows[0]?.relatedBookings > 0) {
      return res.status(400).json({
        error: 'Unable to delete this hotel while it has existing active bookings. Cancel or remove active bookings first.',
      });
    }

    await query('DELETE FROM hotel_bookings WHERE hotel_id = ?', [req.params.id]);
    await query('DELETE FROM hotels WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/hotel-bookings/:id', async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid booking id' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[booking]] = await conn.execute(
      'SELECT id, hotel_id, rooms, status, registration_id FROM hotel_bookings WHERE id = ? FOR UPDATE',
      [id]
    );
    if (!booking) {
      await conn.rollback();
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.status === 'cancelled') {
      await conn.rollback();
      return res.json({ message: 'Booking already cancelled', booking_id: id });
    }

    await conn.execute('UPDATE hotel_bookings SET status = ? WHERE id = ?', ['cancelled', id]);
    await conn.execute('UPDATE hotels SET available_rooms = available_rooms + ? WHERE id = ?', [booking.rooms, booking.hotel_id]);

    if (booking.registration_id) {
      await conn.execute(
        `UPDATE registrants
         SET accommodation = 0,
             accommodation_nights = 0,
             hotel_booking_id = NULL,
             hotel_id = NULL,
             hotel_name = NULL,
             hotel_room_type = NULL,
             hotel_price_usd = 0,
             hotel_rooms = 0
         WHERE id = ?`,
        [booking.registration_id]
      );
    }

    await conn.commit();
    res.json({ message: 'Booking cancelled', booking_id: id, status: 'cancelled' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

router.get('/hotel-bookings', async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT hb.*, h.name AS hotel_name FROM hotel_bookings hb
       JOIN hotels h ON hb.hotel_id = h.id
       ORDER BY hb.created_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
