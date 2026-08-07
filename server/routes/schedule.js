/**
 * routes/schedule.js
 * GET /api/schedule          — sessions for a given date (?date=YYYY-MM-DD)
 * GET /api/schedule/live     — session happening right now
 * GET /api/schedule/:date    — alias for ?date=
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// Helper: convert HH:MM:SS MySQL time to HH:MM
function toHHMM(t) {
  if (!t) return null;
  return String(t).slice(0, 5);
}

function formatSession(row) {
  let speakers = [];
  try {
    if (row.speakers && typeof row.speakers === 'string' && row.speakers.trim()) {
      speakers = JSON.parse(row.speakers);
    }
  } catch (err) {
    // If JSON parse fails, default to empty array
    speakers = [];
  }
  
  return {
    id:         row.id,
    time:       toHHMM(row.start_time),
    end:        toHHMM(row.end_time),
    title:      row.title,
    room:       row.room  || '',
    type:       row.type,
    description:row.description || '',
    speakers:   speakers,
  };
}

// GET /api/schedule/live
router.get('/live', async (req, res, next) => {
  try {
    const now  = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 8);

    const [rows] = await query(
      `SELECT s.*,
         IFNULL(
           JSON_ARRAYAGG(
             JSON_OBJECT('name', sp.name, 'designation', sp.designation)
           ),
           JSON_ARRAY()
         ) AS speakers
       FROM schedule_sessions s
       LEFT JOIN session_speakers ss ON ss.session_id = s.id
       LEFT JOIN speakers sp         ON sp.id = ss.speaker_id
       WHERE s.session_date = ? AND s.start_time <= ? AND (s.end_time IS NULL OR s.end_time >= ?)
       GROUP BY s.id
       LIMIT 1`,
      [date, time, time]
    );

    if (!rows.length) return res.json(null);
    res.json(formatSession(rows[0]));
  } catch (err) {
    next(err);
  }
});

// GET /api/schedule?date=YYYY-MM-DD  OR  /api/schedule/:date
async function getByDate(req, res, next) {
  try {
    const date = req.query.date || req.params.date;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Provide date as YYYY-MM-DD' });
    }

    const [rows] = await query(
      `SELECT s.*,
         IFNULL(
           JSON_ARRAYAGG(
             CASE WHEN sp.id IS NOT NULL
               THEN JSON_OBJECT('id', sp.id, 'name', sp.name, 'designation', sp.designation, 'role', ss.role)
               ELSE NULL
             END
           ),
           JSON_ARRAY()
         ) AS speakers
       FROM schedule_sessions s
       LEFT JOIN session_speakers ss ON ss.session_id = s.id
       LEFT JOIN speakers sp         ON sp.id = ss.speaker_id
       WHERE s.session_date = ?
       GROUP BY s.id
       ORDER BY s.start_time`,
      [date]
    );

    res.json(rows.map(formatSession));
  } catch (err) {
    next(err);
  }
}

router.get('/',      getByDate);
router.get('/:date', getByDate);

module.exports = router;
