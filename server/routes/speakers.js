/**
 * routes/speakers.js
 * GET /api/speakers      — all speakers, newest added first
 * GET /api/speakers/:id  — single speaker
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await query(
      // Newest speaker first, oldest last.
      'SELECT id, name, designation, church, country, bio, photo_url, keynote, display_order FROM speakers ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid id' });

    const [rows] = await query(
      'SELECT id, name, designation, church, country, bio, photo_url, keynote FROM speakers WHERE id = ?',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Speaker not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
