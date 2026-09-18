/**
 * routes/hotels.js
 * GET  /api/hotels                — list active hotels
 * GET  /api/hotels/:id            — single hotel
 *
 * Rooms are no longer reserved through this site: delegates book directly with
 * the hotel, so the listing is informational only. The reserve / confirm /
 * cancel endpoints were removed along with the public Reserve button — nothing
 * may write to hotel_bookings from an unauthenticated request. Existing
 * bookings are still visible and removable under /api/admin/hotel-bookings.
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

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

module.exports = router;
