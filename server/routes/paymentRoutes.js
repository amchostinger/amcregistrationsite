/**
 * routes/paymentRoutes.js
 * Routes for PayByLink integration
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// POST /api/payments/create
router.post('/create', paymentController.createValidation, paymentController.createPayment);

// GET /api/payments/status/:orderId
router.get('/status/:orderId', paymentController.getStatus);

// POST /api/payments/callback
router.post('/callback', express.json({ limit: '50kb' }), paymentController.callbackHandler);

// GET /api/payments/url/:orderId
router.get('/url/:orderId', paymentController.getPaymentUrl);

module.exports = router;
