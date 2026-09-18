/**
 * routes/auth.js
 * POST /api/auth/login  — email + password → JWT
 * GET  /api/auth/me     — validate token, return current admin
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const requireAuth = require('../middleware/clerkAuth');

const router = express.Router();
const { JWT_SECRET, JWT_EXPIRES } = require('../config/jwt');

// A handful of admin accounts guarded by passwords is exactly the shape an
// online brute-force succeeds against, so cap attempts per IP. Counted per
// IP+email so one attacker cannot lock every admin out by burning the quota
// against a single address, and successful logins are not counted.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}|${String(req.body?.email || '').toLowerCase()}`,
  message: { error: 'Too many sign-in attempts. Please try again in 15 minutes.' },
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const [rows] = await query('SELECT * FROM admins WHERE email = ? AND is_active = 1 LIMIT 1', [email.toLowerCase()]);
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    await query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name } });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — verify token and return admin info
router.get('/me', requireAuth, (req, res) => {
  res.json({ admin: req.auth });
});

module.exports = router;
