/**
 * models/paymentModel.js
 * Simple model functions for payments table using the existing DB helper.
 */

const { query, getConnection } = require('../config/db');

async function createPaymentRecord({ order_id, user_id = null, amount, currency, customer_name, customer_email, provider, status = 'Pending', provider_response = null, payment_reference = null }) {
  const sql = `INSERT INTO payments (order_id, user_id, amount, currency, customer_name, customer_email, payment_url, payment_reference, status, provider, provider_response, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, NOW(), NOW())`;

  const params = [order_id, user_id, amount, currency, customer_name, customer_email, payment_reference, status, provider, provider_response ? JSON.stringify(provider_response) : null];
  const [res] = await query(sql, params);
  return res.insertId;
}

async function findByOrderId(order_id) {
  const [rows] = await query('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1', [order_id]);
  return rows[0] || null;
}

async function updatePaymentUrl(id, payment_url) {
  await query('UPDATE payments SET payment_url = ?, updated_at = NOW() WHERE id = ?', [payment_url, id]);
}

async function updateStatusById(id, status, provider_response = null, reference = null) {
  const respStr = provider_response ? JSON.stringify(provider_response) : null;
  const params = [status, respStr, id];
  await query('UPDATE payments SET status = ?, provider_response = ?, payment_reference = COALESCE(payment_reference, ?), updated_at = NOW() WHERE id = ?', [status, respStr, reference, id]);
}

async function setProviderReference(id, reference) {
  await query('UPDATE payments SET payment_reference = ?, updated_at = NOW() WHERE id = ?', [reference, id]);
}

module.exports = {
  createPaymentRecord,
  findByOrderId,
  updatePaymentUrl,
  updateStatusById,
  setProviderReference,
};
