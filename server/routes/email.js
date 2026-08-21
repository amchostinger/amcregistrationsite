/**
 * routes/email.js
 * Admin "Email Actions" — re-send the transactional emails for a registrant.
 *
 * Every action reads the registrant (and their payments) fresh from the
 * database at send time, so a re-sent email always reflects the record as it
 * stands now, not as it stood when the original was sent. The communications
 * desk is blind-copied on each one by emailService.
 */

const express = require('express');
const requireAuth = require('../middleware/clerkAuth');
const { query } = require('../config/db');
const emailService = require('../services/emailService');

const router = express.Router();

// Protect with admin auth
router.use(requireAuth);

/** Load a registrant by id, or send a 404 and return null. */
async function loadRegistrant(res, id) {
  const [rows] = await query('SELECT * FROM registrants WHERE id = ?', [id]);
  if (!rows.length) {
    res.status(404).json({ error: 'Registrant not found.' });
    return null;
  }
  return rows[0];
}

/**
 * Resend failures must not surface as a generic 500 — the admin needs to know
 * the mail was rejected and why, so it comes back as a 502 with the reason.
 */
function mailError(res, err) {
  console.error('[Email Action]', err.message);
  return res.status(502).json({ error: `Email could not be sent. ${err.message}` });
}

/**
 * POST /api/email/resend-confirmation/:registrantId
 * Registration confirmation. The template branches on the live balance, so this
 * shows "payment pending" or "paid in full" according to the current record.
 */
router.post('/resend-confirmation/:registrantId', async (req, res, next) => {
  try {
    const registrant = await loadRegistrant(res, req.params.registrantId);
    if (!registrant) return undefined;

    await emailService.sendRegistrationConfirmation(registrant);
    return res.json({
      success: true,
      message: `Registration email sent to ${registrant.email}.`,
      sentTo: registrant.email,
      copiedTo: emailService.config.ARCHIVE_EMAIL,
    });
  } catch (err) {
    if (err.message?.startsWith('Resend:')) return mailError(res, err);
    return next(err);
  }
});

/**
 * POST /api/email/resend-payment/:registrantId
 * Payment confirmation for the most recent settled payment.
 */
router.post('/resend-payment/:registrantId', async (req, res, next) => {
  try {
    const registrant = await loadRegistrant(res, req.params.registrantId);
    if (!registrant) return undefined;

    const [payRows] = await query(
      `SELECT * FROM payments
       WHERE registrant_id = ? AND status = 'paid'
       ORDER BY paid_at DESC, created_at DESC LIMIT 1`,
      [req.params.registrantId]
    );

    if (!payRows.length) {
      return res.status(409).json({
        error: 'No confirmed payment on this registration yet. Use "Send Payment Reminder" instead.',
      });
    }

    await emailService.sendPaymentConfirmation(registrant, payRows[0]);
    return res.json({
      success: true,
      message: `Payment confirmation sent to ${registrant.email}.`,
      sentTo: registrant.email,
      copiedTo: emailService.config.ARCHIVE_EMAIL,
    });
  } catch (err) {
    if (err.message?.startsWith('Resend:')) return mailError(res, err);
    return next(err);
  }
});

/**
 * POST /api/email/payment-reminder/:registrantId
 * Nudge a registrant who still owes money. Refused when nothing is outstanding,
 * so an admin cannot accidentally chase someone who has already paid.
 */
router.post('/payment-reminder/:registrantId', async (req, res, next) => {
  try {
    const registrant = await loadRegistrant(res, req.params.registrantId);
    if (!registrant) return undefined;

    const balance = Math.max(0, Number(
      registrant.balance_due ?? (Number(registrant.grand_total || 0) - Number(registrant.amount_paid || 0))
    ));

    if (balance <= 0) {
      return res.status(409).json({
        error: 'This registration has no outstanding balance — no reminder is due.',
      });
    }

    await emailService.sendPaymentReminder(registrant);
    return res.json({
      success: true,
      message: `Payment reminder for $${balance.toFixed(2)} sent to ${registrant.email}.`,
      sentTo: registrant.email,
      copiedTo: emailService.config.ARCHIVE_EMAIL,
    });
  } catch (err) {
    if (err.message?.startsWith('Resend:')) return mailError(res, err);
    return next(err);
  }
});

/**
 * GET /api/email/status
 * Lets the admin panel show which address mail leaves from, where copies go,
 * and whether a real Resend key is configured at all.
 */
router.get('/status', (req, res) => {
  const { FROM, ARCHIVE_EMAIL, ADMIN_EMAIL, REPLY_TO, live } = emailService.config;
  return res.json({ from: FROM, archiveTo: ARCHIVE_EMAIL, adminTo: ADMIN_EMAIL, replyTo: REPLY_TO, live });
});

module.exports = router;
