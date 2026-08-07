/**
 * routes/auth.js
 * POST /api/auth/login  — email + password → JWT
 * GET  /api/auth/me     — validate token, return current admin
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const requireAuth = require('../middleware/clerkAuth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme-use-a-long-random-secret-in-production';
const JWT_EXPIRES = '12h';

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
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
