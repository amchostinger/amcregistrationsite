/**
 * routes/hotels.js
 * GET  /api/hotels                — list active hotels
 * GET  /api/hotels/:id            — single hotel
 * POST /api/hotels/reserve        — reserve rooms (transactional, 2-hr expiry)
 * POST /api/hotels/confirm/:id    — confirm a reservation
 * POST /api/hotels/cancel/:id     — cancel a reservation
 */

const express = require('express');
const router = express.Router();
const { query, pool } = require('../config/db');
const { recalculateRegistrantTotals } = require('../services/registrationService');

const EXPIRY_HOURS = 2;
const NIGHTS_DEFAULT = 5;

/* ── GET /api/hotels ─────────────────────────────────────────────────────── */
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT id, name, stars, address, distance_km, price_usd, room_type,
              total_rooms, available_rooms, amenities, description, photo_url, website_url
       FROM hotels
       WHERE active = 1
       ORDER BY display_order ASC, id ASC`
    );
    // Parse amenities JSON if stored as string
    const hotels = rows.map((h) => ({
      ...h,
      amenities: typeof h.amenities === 'string' ? JSON.parse(h.amenities) : (h.amenities || []),
    }));
    res.json(hotels);
  } catch (err) {
    next(err);
  }
});

/* ── GET /api/hotels/:id ─────────────────────────────────────────────────── */
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id' });

    const [rows] = await query(
      'SELECT id, name, stars, address, distance_km, price_usd, room_type, total_rooms, available_rooms, amenities, description, photo_url, website_url FROM hotels WHERE id = ? AND active = 1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Hotel not found' });

    const h = rows[0];
    res.json({ ...h, amenities: typeof h.amenities === 'string' ? JSON.parse(h.amenities) : (h.amenities || []) });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/hotels/reserve ────────────────────────────────────────────── */
router.post('/reserve', async (req, res, next) => {
  const { hotel_id, guest_name, guest_email, rooms = 1, nights = NIGHTS_DEFAULT, registration_id } = req.body;

  // Input validation
  if (!hotel_id || !guest_name || !guest_email) {
    return res.status(400).json({ error: 'hotel_id, guest_name, and guest_email are required' });
  }
  const roomCount = Math.max(1, parseInt(rooms, 10) || 1);
  const nightCount = Math.max(1, parseInt(nights, 10) || NIGHTS_DEFAULT);

  // Use a connection with transaction for atomic reservation
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lock the hotel row
    const [[hotel]] = await conn.execute(
      'SELECT id, name, room_type, price_usd, available_rooms FROM hotels WHERE id = ? AND active = 1 FOR UPDATE',
      [hotel_id]
    );
    if (!hotel) {
      await conn.rollback();
      return res.status(404).json({ error: 'Hotel not found' });
    }
    if (hotel.available_rooms < roomCount) {
      await conn.rollback();
      return res.status(409).json({ error: 'Not enough rooms available', available: hotel.available_rooms });
    }

    const total = parseFloat(hotel.price_usd) * roomCount * nightCount;
    const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000);

    const checkIn  = '2027-03-09';
    const checkOut = new Date(new Date(checkIn).getTime() + nightCount * 86400000)
      .toISOString().slice(0, 10);

    // Create booking record
    const [result] = await conn.execute(
      `INSERT INTO hotel_bookings
         (hotel_id, registration_id, guest_name, guest_email, check_in, check_out, nights, rooms, total_usd, status, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'reserved', ?)`,
      [hotel_id, registration_id || null, guest_name, guest_email, checkIn, checkOut, nightCount, roomCount, total, expiresAt]
    );

    if (registration_id) {
      await conn.execute(
        `UPDATE registrants
           SET hotel_booking_id = ?, hotel_id = ?, hotel_name = ?, hotel_room_type = ?, hotel_price_usd = ?, hotel_rooms = ?, accommodation = 1, accommodation_nights = ?
         WHERE id = ?`,
        [result.insertId, hotel_id, hotel.name, hotel.room_type, hotel.price_usd, roomCount, nightCount, registration_id]
      );
    }

    // Decrement availability
    await conn.execute(
      'UPDATE hotels SET available_rooms = available_rooms - ? WHERE id = ?',
      [roomCount, hotel_id]
    );

    await conn.commit();

    if (registration_id) {
      await recalculateRegistrantTotals({ id: registration_id }).catch((err) => {
        console.error('[Recalculate Totals Error]', err.message);
      });
    }

    res.status(201).json({
      booking_id: result.insertId,
      hotel_id,
      guest_name,
      guest_email,
      rooms: roomCount,
      nights: nightCount,
      total_usd: total,
      check_in: checkIn,
      check_out: checkOut,
      status: 'reserved',
      expires_at: expiresAt.toISOString(),
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

/* ── POST /api/hotels/confirm/:id ───────────────────────────────────────── */
router.post('/confirm/:id', async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid booking id' });

  try {
    const [rows] = await query(
      'SELECT id, status, expires_at FROM hotel_bookings WHERE id = ?',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Booking not found' });

    const booking = rows[0];
    if (booking.status === 'cancelled') return res.status(409).json({ error: 'Booking is cancelled' });
    if (booking.status === 'confirmed') return res.json({ message: 'Already confirmed', booking_id: id });
    if (booking.expires_at && new Date(booking.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Reservation expired — please reserve again' });
    }

    await query(
      'UPDATE hotel_bookings SET status = \'confirmed\', confirmed_at = NOW(), expires_at = NULL WHERE id = ?',
      [id]
    );
    res.json({ message: 'Booking confirmed', booking_id: id, status: 'confirmed' });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/hotels/cancel/:id ────────────────────────────────────────── */
router.post('/cancel/:id', async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid booking id' });

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
      return res.json({ message: 'Already cancelled', booking_id: id });
    }

    await conn.execute(
      'UPDATE hotel_bookings SET status = \'cancelled\' WHERE id = ?',
      [id]
    );
    // Return rooms to inventory
    await conn.execute(
      'UPDATE hotels SET available_rooms = available_rooms + ? WHERE id = ?',
      [booking.rooms, booking.hotel_id]
    );

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

    if (booking.registration_id) {
      await recalculateRegistrantTotals({ id: booking.registration_id }).catch((err) => {
        console.error('[Recalculate Totals Error]', err.message);
      });
    }

    res.json({ message: 'Booking cancelled', booking_id: id, status: 'cancelled' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;
