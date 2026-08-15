/**
 * routes/awards.js
 * GET /api/awards/categories — published award categories, in display order.
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

router.get('/categories', async (req, res, next) => {
  try {
    const [rows] = await query(
      `SELECT id, title, description, criteria, display_order
       FROM award_categories
       WHERE published = 1
       ORDER BY display_order ASC, id ASC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
