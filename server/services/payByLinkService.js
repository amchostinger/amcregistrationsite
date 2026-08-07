/**
 * services/payByLinkService.js
 * Communicates with PayByLink REST API using Axios and Basic Auth.
 */

const axios = require('axios');

const PAYBYLINK_BASE_URL = process.env.PAYBYLINK_BASE_URL || 'https://testapi.paybylink.com';
const ENTITY_KEY = process.env.PAYBYLINK_ENTITY_KEY;
const USERNAME = process.env.PAYBYLINK_USERNAME;
const PASSWORD = process.env.PAYBYLINK_PASSWORD;

if (!ENTITY_KEY || !USERNAME || !PASSWORD) {
  console.warn('[PayByLink] Missing credentials in environment variables');
}

const client = axios.create({
  baseURL: PAYBYLINK_BASE_URL,
  timeout: 10000,
  auth: {
    username: USERNAME || '',
    password: PASSWORD || '',
  },
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

async function createPayment({ orderId, amount, currency, customerName, customerEmail, metadata = {} }) {
  const url = `/payment/create/${ENTITY_KEY}`;
  const payload = {
    orderReference: orderId,
    amount,
    currency,
    customer: {
      name: customerName,
      email: customerEmail,
    },
    metadata,
  };

  console.info('[PayByLink] POST', url, { orderReference: orderId, amount, currency });

  const resp = await client.post(url, payload).catch((err) => {
    const msg = err.response ? `${err.response.status} ${err.response.statusText}` : err.message;
    console.error('[PayByLink] createPayment error', msg);
    throw err;
  });

  console.info('[PayByLink] createPayment response status', resp.status);
  return resp.data;
}

async function searchPayment({ orderId }) {
  const url = `/payment/search/${ENTITY_KEY}`;
  console.info('[PayByLink] SEARCH', url, { orderId });

  const resp = await client.get(url, { params: { orderReference: orderId } }).catch((err) => {
    const msg = err.response ? `${err.response.status} ${err.response.statusText}` : err.message;
    console.error('[PayByLink] searchPayment error', msg);
    throw err;
  });

  return resp.data;
}

async function getPaymentUrl({ orderReference }) {
  const url = `/payment/url/${ENTITY_KEY}/${encodeURIComponent(orderReference)}`;
  console.info('[PayByLink] GET URL', url);

  const resp = await client.get(url).catch((err) => {
    const msg = err.response ? `${err.response.status} ${err.response.statusText}` : err.message;
    console.error('[PayByLink] getPaymentUrl error', msg);
    throw err;
  });

  return resp.data;
}

// handleCallback is a thin parser that returns the parsed payload for controller handling
function handleCallback(reqBody) {
  // PayByLink will send an event payload; return as-is for controller to interpret
  return reqBody;
}

module.exports = {
  createPayment,
  searchPayment,
  getPaymentUrl,
  handleCallback,
};
