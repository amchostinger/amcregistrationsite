/**
 * routes/admin.js
 * All routes protected by Clerk authentication middleware.
 * Admin-only API endpoints for the dashboard.
 */

const express = require('express');
const { Parser } = require('json2csv');

const { query, pool } = require('../config/db');
const clerkAuth = require('../middleware/clerkAuth');

const router = express.Router();

// Apply Clerk auth to all admin routes
router.use(clerkAuth);

// Helper: log admin action to audit trail
async function auditLog(adminClerkId, action, targetTable, targetId, notes) {
  await query(
    `INSERT INTO admin_audit_log (admin_clerk_id, action, target_table, target_id, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [adminClerkId, action, targetTable || null, targetId || null, notes || null]
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

router.get('/registrations', async (req, res, next) => {
  try {
    const pageValue = parseInt(req.query.page || '1', 10);
    const limitValue = parseInt(req.query.limit || '20', 10);
    const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
    const limit = Number.isInteger(limitValue) && limitValue > 0 ? Math.min(100, limitValue) : 20;
    const offset = (page - 1) * limit;
    const { search, status, category, payment_status } = req.query;

    const conditions = ['1=1'];
    const params = [];

    if (search) {
      conditions.push('(r.first_name LIKE ? OR r.last_name LIKE ? OR r.email LIKE ? OR r.registration_ref LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (status) {
      conditions.push('r.registration_status = ?');
      params.push(status);
    }
    if (category) {
      conditions.push('r.category = ?');
      params.push(category);
    }
    if (payment_status) {
      conditions.push('r.payment_status = ?');
      params.push(payment_status);
    }

    const where = conditions.join(' AND ');

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
      req.auth.userId,
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

router.get('/payments', async (req, res, next) => {
  try {
    const pageValue = parseInt(req.query.page || '1', 10);
    const limitValue = parseInt(req.query.limit || '20', 10);
    const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
    const limit = Number.isInteger(limitValue) && limitValue > 0 ? Math.min(100, limitValue) : 20;
    const offset = (page - 1) * limit;
    const { status } = req.query;

    const conditions = ['1=1'];
    const params = [];

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    const where = conditions.join(' AND ');

    const [countRows] = await query(
      `SELECT COUNT(*) AS total FROM payments p WHERE ${where}`,
      params
    );

    const [rows] = await query(
      `SELECT p.*, r.registration_ref, r.designation, r.first_name, r.last_name,
              r.email, r.category, r.country, r.grand_total, r.amount_paid, r.balance_due
       FROM payments p
       JOIN registrants r ON r.id = p.registrant_id
       WHERE ${where}
       ORDER BY p.created_at DESC
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
       ORDER BY r.created_at DESC`
    );

    const fields = [
      'registration_ref','designation','first_name','last_name','email','phone',
      'office','category','church','country','accommodation','accommodation_nights','num_people','delegate_details',
      'hotel_name','hotel_room_type','hotel_rooms','conference_total','hotel_total','grand_total','amount_paid','balance_due',
      'payment_status','registration_status','dietary_requirements','special_requests','created_at','amount','currency','payment_method','paid_at',
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(rows);

    await auditLog(req.auth.userId, 'EXPORT_CSV', 'registrants', null, `Exported ${rows.length} records`);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="amc2027-registrations-${Date.now()}.csv"`);
    return res.send(csv);
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
      req.auth.userId,
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
    // Newest first, matching the public page.
    const [rows] = await query('SELECT * FROM speakers ORDER BY id DESC');
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/speakers', async (req, res, next) => {
  try {
    const { name, designation, church, country, bio, photo_url, keynote, display_order } = req.body;
    const [result] = await query(
      `INSERT INTO speakers (name, designation, church, country, bio, photo_url, keynote, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, designation || '', church || '', country || '', bio || '', photo_url || '', keynote ? 1 : 0, display_order || 0]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) { next(err); }
});

router.put('/speakers/:id', async (req, res, next) => {
  try {
    const { name, designation, church, country, bio, photo_url, keynote, display_order } = req.body;
    await query(
      `UPDATE speakers SET name=?, designation=?, church=?, country=?, bio=?, photo_url=?, keynote=?, display_order=? WHERE id=?`,
      [name, designation || '', church || '', country || '', bio || '', photo_url || '', keynote ? 1 : 0, display_order || 0, req.params.id]
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
      [session_date, start_time, end_time || null, title, room || '', type || 'general', description || '', req.params.id]
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
