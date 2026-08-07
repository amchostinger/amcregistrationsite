/**
 * controllers/paymentController.js
 */

const { body, validationResult } = require('express-validator');
const payByLinkService = require('../services/payByLinkService');
const paymentModel = require('../models/paymentModel');

// Validation middleware for create
const createValidation = [
  body('orderId').trim().notEmpty().withMessage('orderId is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('amount must be a positive number'),
  body('currency').isLength({ min: 3, max: 3 }).withMessage('currency must be a 3-letter code'),
  body('customerName').trim().notEmpty().withMessage('customerName is required'),
  body('customerEmail').isEmail().withMessage('Valid customerEmail is required'),
];

async function createPayment(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { orderId, amount, currency, customerName, customerEmail } = req.body;

    // Prevent duplicate order IDs
    const existing = await paymentModel.findByOrderId(orderId);
    if (existing) {
      return res.status(409).json({ error: 'Order ID already exists' });
    }

    // Save pending payment locally
    const provider = 'paybylink';
    const id = await paymentModel.createPaymentRecord({
      order_id: orderId,
      amount,
      currency,
      customer_name: customerName,
      customer_email: customerEmail,
      provider,
      status: 'Pending',
    });

    // Call PayByLink to create payment
    const resp = await payByLinkService.createPayment({
      orderId,
      amount,
      currency,
      customerName,
      customerEmail,
      metadata: { localPaymentId: id },
    });

    // Expect resp to contain a paymentUrl and optionally a reference
    const paymentUrl = resp?.paymentUrl || resp?.payment_url || (resp?.data && resp.data.paymentUrl) || null;
    const reference = resp?.paymentReference || resp?.payment_reference || resp?.reference || resp?.orderReference || null;

    if (paymentUrl) {
      await paymentModel.updatePaymentUrl(id, paymentUrl);
    }
    if (reference) {
      await paymentModel.setProviderReference(id, reference);
    }

    return res.json({ success: true, paymentUrl });
  } catch (err) {
    next(err);
  }
}

async function getStatus(req, res, next) {
  try {
    const { orderId } = req.params;
    const payment = await paymentModel.findByOrderId(orderId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    return res.json({ status: payment.status });
  } catch (err) {
    next(err);
  }
}

async function getPaymentUrl(req, res, next) {
  try {
    const { orderId } = req.params;
    const payment = await paymentModel.findByOrderId(orderId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const orderReference = payment.payment_reference || payment.order_id;
    const resp = await payByLinkService.getPaymentUrl({ orderReference });
    const paymentUrl = resp?.paymentUrl || resp?.payment_url || null;

    if (paymentUrl) {
      await paymentModel.updatePaymentUrl(payment.id, paymentUrl);
    }

    return res.json({ paymentUrl });
  } catch (err) {
    next(err);
  }
}

// Callback handler — idempotent and protected by token
async function callbackHandler(req, res, next) {
  try {
    const token = req.get('x-paybylink-token');
    const expected = process.env.PAYBYLINK_CALLBACK_TOKEN;
    if (expected && token !== expected) {
      console.warn('[PayByLink] Callback token mismatch');
      return res.status(403).json({ error: 'Forbidden' });
    }

    const payload = payByLinkService.handleCallback(req.body);

    const orderRef = payload.orderReference || payload.order_reference || payload.reference || payload.orderId || payload.order_id;
    const status = (payload.event || payload.status || '').toString();

    if (!orderRef) {
      console.warn('[PayByLink] Callback missing order reference', payload);
      return res.status(400).json({ error: 'Missing order reference' });
    }

    const payment = await paymentModel.findByOrderId(orderRef);
    if (!payment) {
      console.warn('[PayByLink] Callback for unknown order', orderRef);
      return res.status(200).send('OK');
    }

    const normalized = String(status || payload.event || '').toLowerCase();
    // Map incoming events to our status values
    const map = {
      success: 'Paid',
      paid: 'Paid',
      declined: 'Declined',
      expired: 'Expired',
      aborted: 'Aborted',
      error: 'Error',
      paymentpending: 'Pending',
      paymentfailed: 'Failed',
      paymentinprogress: 'Pending',
    };

    const newStatus = map[normalized] || (payload.status && payload.status.toString()) || payment.status;

    // Idempotent update: only update if status changed
    if (newStatus && newStatus !== payment.status) {
      await paymentModel.updateStatusById(payment.id, newStatus, payload, payload.reference || payload.orderReference || null);
    }

    return res.status(200).send('OK');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createValidation,
  createPayment,
  getStatus,
  getPaymentUrl,
  callbackHandler,
};
