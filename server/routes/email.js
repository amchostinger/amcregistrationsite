/**
 * routes/email.js
 * Internal route for manually re-triggering emails (admin use only via server calls).
 * These routes are intentionally simple and not exposed publicly.
 */

const express = require('express');
const clerkAuth = require('../middleware/clerkAuth');
const { query } = require('../config/db');
const emailService = require('../services/emailService');

const router = express.Router();

// Protect with Clerk auth
router.use(clerkAuth);

/**
 * POST /api/email/resend-confirmation/:registrantId
 * Resend registration confirmation email to a registrant.
 */
router.post('/resend-confirmation/:registrantId', async (req, res, next) => {
  try {
    const [rows] = await query('SELECT * FROM registrants WHERE id = ?', [req.params.registrantId]);
    if (!rows.length) return res.status(404).json({ error: 'Registrant not found.' });

    await emailService.sendRegistrationConfirmation(rows[0]);
    return res.json({ success: true, message: 'Confirmation email resent.' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/email/resend-payment/:registrantId
 * Resend payment confirmation email to a confirmed registrant.
 */
router.post('/resend-payment/:registrantId', async (req, res, next) => {
  try {
    const [regRows] = await query('SELECT * FROM registrants WHERE id = ?', [req.params.registrantId]);
    if (!regRows.length) return res.status(404).json({ error: 'Registrant not found.' });

    const [payRows] = await query(
      'SELECT * FROM payments WHERE registrant_id = ? AND status = "paid" LIMIT 1',
      [req.params.registrantId]
    );

    if (!payRows.length) return res.status(409).json({ error: 'No confirmed payment found for this registrant.' });

    await emailService.sendPaymentConfirmation(regRows[0], payRows[0]);
    return res.json({ success: true, message: 'Payment confirmation email resent.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
