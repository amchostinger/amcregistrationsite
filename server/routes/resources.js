/**
 * routes/resources.js
 * GET /api/resources — published conference resources, in display order.
 *
 * Hosts presentations, keynote materials and other documents shared by guest
 * speakers. Files live under <server>/uploads/resources (see uploads.js).
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT id, title, description, category, speaker_name, file_url, external_url,
              file_size, display_order, created_at
       FROM resources
       WHERE published = 1
       ORDER BY display_order ASC, id DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
