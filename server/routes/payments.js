/**
 * routes/payments.js
 * POST /api/payments/initiate       — Start a Paynow payment
 * GET  /api/payments/poll/:paymentId — Poll payment status
 * POST /api/payments/paynow-result   — Paynow webhook (IPN)
 */

const express = require('express');
const { body, validationResult } = require('express-validator');

const { query } = require('../config/db');
const paynowService = require('../services/paynowService');
const emailService = require('../services/emailService');
const { recalculateRegistrantTotals } = require('../services/registrationService');

const router = express.Router();

// ─── POST /api/payments/initiate ─────────────────────────────────────────────

const initiateValidation = [
  body('registrantId').isInt({ min: 1 }).withMessage('Valid registrantId required'),
  body('paymentMethod').isIn(['ecocash','telecash','visa','mastercard','paynow','bank']).withMessage('Invalid payment method'),
  body('currency').optional().isIn(['USD','ZWL']),
  body('phone').optional().trim().isLength({ max: 30 }),
];

router.post('/initiate', initiateValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { registrantId, paymentMethod, currency = 'USD', phone } = req.body;
    const clientBaseUrl = req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173';
    const serverBaseUrl = process.env.SERVER_URL || `${req.protocol}://${req.get('host')}` || 'http://localhost:5000';

    // Fetch registrant
    const [rows] = await query('SELECT * FROM registrants WHERE id = ?', [registrantId]);
    if (!rows.length) return res.status(404).json({ error: 'Registrant not found.' });
    const registrant = rows[0];

    if (registrant.payment_status === 'paid') {
      return res.status(409).json({ error: 'This registration has already been paid.' });
    }

    // Mobile money requires a phone number
    if (['ecocash', 'telecash'].includes(paymentMethod) && !phone) {
      return res.status(422).json({ error: 'Phone number is required for mobile money payments.' });
    }

    // Recalculate totals to ensure the amount requested is authoritative
    const totals = await recalculateRegistrantTotals({ id: registrant.id });
    const amount = Math.max(0, totals.balanceDue);

    if (amount <= 0) {
      return res.status(409).json({ error: 'No outstanding balance due for this registration.' });
    }

    // For bank transfers, skip Paynow and create payment record directly
    if (paymentMethod === 'bank') {
      const reference = `${registrant.registration_ref}-${Date.now()}`;
      
      await query(
        `INSERT INTO payments (registrant_id, paynow_poll_url, paynow_reference, amount, currency, payment_method, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [
          registrant.id,
          null,
          reference,
          amount,
          currency,
          paymentMethod,
        ]
      );

      const [payRows] = await query(
        'SELECT id FROM payments WHERE paynow_reference = ? ORDER BY created_at DESC LIMIT 1',
        [reference]
      );

      return res.json({
        success: true,
        paymentId: payRows[0]?.id,
        redirectUrl: null,
        pollUrl: null,
      });
    }

    // Validate Paynow credentials first before attempting payment
    if ((process.env.PAYNOW_INTEGRATION_ID === 'your_integration_id' || 
         !process.env.PAYNOW_INTEGRATION_ID) ||
        (process.env.PAYNOW_INTEGRATION_KEY === 'your_integration_key' || 
         !process.env.PAYNOW_INTEGRATION_KEY)) {
      return res.status(503).json({ 
        error: 'Payment gateway is not configured. Please contact support.' 
      });
    }

    // Create payment record FIRST to get paymentId (before calling Paynow)
    const reference = `${registrant.registration_ref}-${Date.now()}`;
    await query(
      `INSERT INTO payments (registrant_id, paynow_reference, amount, currency, payment_method, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [registrant.id, reference, amount, currency, paymentMethod]
    );

    const [payRows] = await query(
      'SELECT id FROM payments WHERE paynow_reference = ? ORDER BY created_at DESC LIMIT 1',
      [reference]
    );

    const paymentId = payRows[0]?.id;

    let paynowResult;
    try {
      paynowResult = await paynowService.initiatePayment({
        registrant,
        amount,
        currency,
        paymentMethod,
        phone: phone || null,
        paymentId, // Pass paymentId to include in redirect URL
        reference,
        clientUrl: clientBaseUrl,
        serverUrl: serverBaseUrl,
      });
    } catch (err) {
      console.error('[Paynow Error]', err.message);
      await query(
        `UPDATE payments SET status = 'failed', paynow_status_raw = ? WHERE id = ?`,
        [err.message, paymentId]
      );
      return res.status(502).json({
        success: false,
        error: 'Payment gateway is temporarily unavailable. Please try again in a moment or choose bank transfer.',
      });
    }

    // Update payment record with Paynow URLs
    await query(
      `UPDATE payments SET paynow_poll_url = ?, status = 'pending' WHERE id = ?`,
      [paynowResult.pollUrl || null, paymentId]
    );

    return res.json({
      success: true,
      paymentId: payRows[0]?.id,
      redirectUrl: paynowResult.redirectUrl,
      pollUrl: paynowResult.pollUrl,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/payments/poll/:paymentId ───────────────────────────────────────

router.get('/poll/:paymentId', async (req, res, next) => {
  try {
    const [payRows] = await query('SELECT * FROM payments WHERE id = ?', [req.params.paymentId]);
    if (!payRows.length) return res.status(404).json({ error: 'Payment record not found.' });

    const payment = payRows[0];

    // Already confirmed — no need to poll again
    if (payment.status === 'paid') {
      return res.json({ status: 'paid', paid: true });
    }

    if (!payment.paynow_poll_url) {
      return res.json({ status: payment.status, paid: false });
    }

    // Poll Paynow for latest status
    const paynowStatus = await paynowService.pollStatus(payment.paynow_poll_url);
    const rawStatus = paynowStatus.status?.toLowerCase() || 'pending';
    const isPaid = paynowStatus.paid === true || rawStatus === 'paid';

    // Update payment record
    if (isPaid) {
      await query(
        `UPDATE payments SET status = 'paid', paynow_status_raw = ?, paid_at = NOW() WHERE id = ?`,
        [paynowStatus.status || 'paid', payment.id]
      );

      // Update registrant financials and status based on cumulative payments
      await query(
        `UPDATE registrants
         SET payment_status = CASE WHEN LEAST(grand_total, COALESCE(amount_paid, 0) + ?) >= grand_total THEN 'paid' ELSE payment_status END,
             registration_status = CASE WHEN LEAST(grand_total, COALESCE(amount_paid, 0) + ?) >= grand_total THEN 'confirmed' ELSE registration_status END,
             amount_paid = LEAST(grand_total, COALESCE(amount_paid, 0) + ?),
             balance_due = GREATEST(0, grand_total - LEAST(grand_total, COALESCE(amount_paid, 0) + ?))
         WHERE id = ?`,
        [payment.amount, payment.amount, payment.amount, payment.amount, payment.registrant_id]
      );

      // Fetch registrant for email
      const [regRows] = await query('SELECT * FROM registrants WHERE id = ?', [payment.registrant_id]);
      if (regRows.length) {
        const [updatedPayRows] = await query('SELECT * FROM payments WHERE id = ?', [payment.id]);
        Promise.all([
          emailService.sendPaymentConfirmation(regRows[0], updatedPayRows[0]),
          emailService.sendAdminPaymentNotification(regRows[0], updatedPayRows[0]),
        ]).catch((err) => console.error('[Email Error]', err.message));
      }
    } else {
      await query(
        `UPDATE payments SET status = ?, paynow_status_raw = ? WHERE id = ?`,
        [rawStatus, paynowStatus.status || rawStatus, payment.id]
      );
    }

    return res.json({ status: isPaid ? 'paid' : rawStatus, paid: isPaid });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/payments/paynow-result (Webhook / IPN) ────────────────────────

router.post('/paynow-result', express.urlencoded({ extended: false }), async (req, res, next) => {
  try {
    const params = req.body;

    // Verify hash to prevent spoofed callbacks
    if (!paynowService.verifyHash(params)) {
      console.warn('[Paynow IPN] Hash verification failed', params);
      return res.status(400).send('Invalid hash');
    }

    const rawStatus = (params.status || '').toLowerCase();
    const isPaid = rawStatus === 'paid';
    const paynowRef = params.reference;

    // Find the payment record by Paynow reference
    const [payRows] = await query(
      'SELECT * FROM payments WHERE paynow_reference = ? ORDER BY created_at DESC LIMIT 1',
      [paynowRef]
    );

    if (!payRows.length) {
      console.warn('[Paynow IPN] Payment record not found for ref:', paynowRef);
      return res.status(200).send('OK'); // Acknowledge to prevent retries
    }

    const payment = payRows[0];

    if (isPaid && payment.status !== 'paid') {
      await query(
        `UPDATE payments SET status = 'paid', paynow_status_raw = ?, paid_at = NOW() WHERE id = ?`,
        [params.status, payment.id]
      );
      await query(
        `UPDATE registrants
         SET payment_status = CASE WHEN LEAST(grand_total, COALESCE(amount_paid, 0) + ?) >= grand_total THEN 'paid' ELSE payment_status END,
             registration_status = CASE WHEN LEAST(grand_total, COALESCE(amount_paid, 0) + ?) >= grand_total THEN 'confirmed' ELSE registration_status END,
             amount_paid = LEAST(grand_total, COALESCE(amount_paid, 0) + ?),
             balance_due = GREATEST(0, grand_total - LEAST(grand_total, COALESCE(amount_paid, 0) + ?))
         WHERE id = ?`,
        [payment.amount, payment.amount, payment.amount, payment.amount, payment.registrant_id]
      );

      const [regRows] = await query('SELECT * FROM registrants WHERE id = ?', [payment.registrant_id]);
      if (regRows.length) {
        const [updPayRows] = await query('SELECT * FROM payments WHERE id = ?', [payment.id]);
        Promise.all([
          emailService.sendPaymentConfirmation(regRows[0], updPayRows[0]),
          emailService.sendAdminPaymentNotification(regRows[0], updPayRows[0]),
        ]).catch((err) => console.error('[Email Error]', err.message));
      }
    } else {
      await query(
        `UPDATE payments SET status = ?, paynow_status_raw = ? WHERE id = ?`,
        [rawStatus, params.status, payment.id]
      );
    }

    return res.status(200).send('OK');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
